import { Repository } from '../../core/decorators/decorators.js'
import BaseRepository from '../../core/orm/repository/Base.repository.js'
import { v4 as uuidv4 } from 'uuid'
import School from '../entities/School.entity.js'
import { InvalidFormatError } from '../../core/errors/InvalidFormat.error.js'

const PUBLIC_SCHOOL_FIELDS = [
    'code',
    'name',
    'city',
    'department',
    'address',
    'phone',
    'email',
    'secretaryEmail',
    'officeHours',
    'levelsOffered',
    'description',
    'logoUrl',
    'brandColor',
    'isPartner'
]

@Repository()
export class SchoolRepository extends BaseRepository<School> {

    constructor() {
        super(School)
    }

    async findDiscoverable() {
        const result = await this.db.query(`
            SELECT s."code", s."name", s."city", s."department", s."address",
                s."phone", s."email", s."secretaryEmail", s."officeHours", s."levelsOffered",
                s."description", s."logoUrl", s."brandColor", s."isPartner",
                EXISTS (
                    SELECT 1 FROM "EnrollmentPeriods" ep
                    WHERE ep."schoolId" = s."id" AND ep."status" = 'open'
                        AND ep."isActive" = TRUE AND ep."isDeleted" = FALSE
                        AND ep."startDate"::date <= CURRENT_DATE
                        AND ep."endDate"::date >= CURRENT_DATE
                ) AS "enrollmentOpen",
                COALESCE((
                    SELECT SUM(GREATEST(gp."maxCapacity" - (
                        SELECT COUNT(*) FROM "Enrollments" e
                        WHERE e."gradePeriodId" = gp."id" AND e."isDeleted" = FALSE
                    ), 0))
                    FROM "GradePeriods" gp
                    JOIN "EnrollmentPeriods" ep ON ep."id" = gp."periodId"
                    WHERE gp."schoolId" = s."id"
                        AND gp."status" = 'active' AND gp."isActive" = TRUE AND gp."isDeleted" = FALSE
                        AND ep."status" = 'open' AND ep."isActive" = TRUE AND ep."isDeleted" = FALSE
                        AND ep."startDate"::date <= CURRENT_DATE
                        AND ep."endDate"::date >= CURRENT_DATE
                ), 0)::INTEGER AS "availablePlaces"
            FROM "Schools" s
            WHERE s."status" = 'active' AND s."isActive" = TRUE
                AND s."isDeleted" = FALSE
            ORDER BY s."name" ASC
        `)
        return result.rows
    }

    async findDiscoverableByCode(code: string) {
        const result = await this.db.query(`
            SELECT ${PUBLIC_SCHOOL_FIELDS.map(field => `s."${field}"`).join(', ')}, s."id"
            FROM "Schools" s
            WHERE s."code" = $1 AND s."status" = 'active'
                AND s."isActive" = TRUE AND s."isDeleted" = FALSE
            LIMIT 1
        `, [code])
        const school = result.rows[0]

        if (!school) return null

        const periodResult = await this.db.query(`
            SELECT "id", "academicYear", "startDate", "endDate", "status",
                ("status" = 'open' AND "startDate"::date <= CURRENT_DATE
                    AND "endDate"::date >= CURRENT_DATE) AS "isOpen"
            FROM "EnrollmentPeriods"
            WHERE "schoolId" = $1
                AND "isActive" = TRUE AND "isDeleted" = FALSE
            ORDER BY CASE
                WHEN "status" = 'open' AND "startDate"::date <= CURRENT_DATE AND "endDate"::date >= CURRENT_DATE THEN 0
                ELSE 1
            END, "academicYear" DESC
            LIMIT 1
        `, [school.id])
        const enrollmentPeriod = periodResult.rows[0] || null
        let gradePeriods = []
        let requiredDocuments = []

        if (enrollmentPeriod) {
            const gradesResult = await this.db.query(`
                SELECT gp."id", g."id" AS "gradeId", g."name" AS "grade", gp."maxCapacity",
                    GREATEST(gp."maxCapacity" - (
                        SELECT COUNT(*) FROM "Enrollments" e
                        WHERE e."gradePeriodId" = gp."id" AND e."isDeleted" = FALSE
                    ), 0)::INTEGER AS "availableSeats",
                    gp."enrollmentFee", gp."tuitionFee", gp."billingFrequency",
                    gp."installmentCount", ep."academicYear"
                FROM "GradePeriods" gp
                JOIN "Grades" g ON g."id" = gp."gradeId"
                JOIN "EnrollmentPeriods" ep ON ep."id" = gp."periodId"
                WHERE gp."schoolId" = $1 AND gp."periodId" = $2
                    AND gp."status" = 'active' AND gp."isActive" = TRUE AND gp."isDeleted" = FALSE
                    AND g."status" = 'active' AND g."isActive" = TRUE AND g."isDeleted" = FALSE
                ORDER BY g."sortOrder" ASC
            `, [school.id, enrollmentPeriod.id])
            gradePeriods = gradesResult.rows

            const documentsResult = await this.db.query(`
                SELECT dt."id", dt."name", dt."allowedMimeType", dt."maxSizeBytes",
                    dt."minWidthPx", dt."minHeightPx", dt."maxWidthPx", dt."maxHeightPx",
                    BOOL_OR(gdt."isRequired") AS "isRequired",
                    ARRAY_AGG(DISTINCT gdt."gradeId") AS "gradeIds"
                FROM "GradeDocumentTypes" gdt
                JOIN "DocumentTypes" dt ON dt."id" = gdt."documentTypeId"
                JOIN "Grades" g ON g."id" = gdt."gradeId"
                WHERE gdt."schoolId" = $1 AND gdt."status" = 'active'
                    AND gdt."isActive" = TRUE AND gdt."isDeleted" = FALSE
                    AND dt."status" = 'active' AND dt."isActive" = TRUE AND dt."isDeleted" = FALSE
                    AND g."status" = 'active' AND g."isActive" = TRUE AND g."isDeleted" = FALSE
                GROUP BY dt."id", dt."name", dt."allowedMimeType", dt."maxSizeBytes",
                    dt."minWidthPx", dt."minHeightPx", dt."maxWidthPx", dt."maxHeightPx"
                ORDER BY dt."name" ASC
            `, [school.id])
            requiredDocuments = documentsResult.rows
        }

        return {
            ...school,
            enrollmentPeriod,
            gradePeriods,
            availablePlaces: gradePeriods.reduce((total, grade) => total + Number(grade.availableSeats || 0), 0),
            enrollmentOpen: enrollmentPeriod?.isOpen === true,
            requiredDocuments
        }
    }

    async findAllForAdmin() {
        return this.db.query(`
            SELECT s.*,
                (SELECT COUNT(*)::INTEGER FROM "Students" st
                    WHERE st."schoolId" = s."id" AND st."isDeleted" = FALSE) AS "studentCount"
            FROM "Schools" s
            WHERE s."isDeleted" = FALSE
            ORDER BY s."name" ASC
        `).then(result => result.rows)
    }

    async updateSchool(id: string, data: Partial<School>) {
        return this.update(id, data)
    }

    async findAcademicSettings(schoolId: string, includeInactive = false) {
        const periodResult = await this.db.query(`
            SELECT "id", "academicYear", "startDate"::date::text AS "startDate",
                "endDate"::date::text AS "endDate", "status", "lateFeePercentage",
                "lateFeeDay", "applyLateFee"
            FROM "EnrollmentPeriods"
            WHERE "schoolId" = $1 AND "isActive" = TRUE AND "isDeleted" = FALSE
            ORDER BY "academicYear" DESC, "createdAt" DESC
            LIMIT 1
        `, [schoolId])
        const period = periodResult.rows[0] || null
        if (!period) return { enrollmentPeriod: null, gradePeriods: [] }

        const gradesResult = await this.db.query(`
            SELECT g."id" AS "gradeId", gp."id" AS "gradePeriodId", g."name", g."code", g."sortOrder", g."isActive",
                COALESCE(gp."maxCapacity", 30)::INTEGER AS "maxCapacity",
                COALESCE((SELECT COUNT(*) FROM "Enrollments" e WHERE e."gradePeriodId" = gp."id" AND e."isDeleted" = FALSE), 0)::INTEGER AS "enrolledCount",
                COALESCE(gp."enrollmentFee", 700000)::NUMERIC AS "enrollmentFee",
                COALESCE(gp."tuitionFee", 380000)::NUMERIC AS "tuitionFee",
                COALESCE(gp."billingFrequency", 'monthly') AS "billingFrequency"
            FROM "Grades" g
            LEFT JOIN "GradePeriods" gp ON gp."gradeId" = g."id" AND gp."periodId" = $2
                AND gp."schoolId" = $1 AND gp."isDeleted" = FALSE
            WHERE g."schoolId" = $1 AND ($3::boolean = TRUE OR g."isActive" = TRUE) AND g."isDeleted" = FALSE
            ORDER BY g."sortOrder" ASC, g."name" ASC
        `, [schoolId, period.id, includeInactive])
        return { enrollmentPeriod: period, gradePeriods: gradesResult.rows }
    }

    async setGradeActive(schoolId: string, gradeId: string, isActive: boolean) {
        const result = await this.db.query(`
            UPDATE "Grades"
            SET "isActive" = $3, "status" = $4, "updatedAt" = NOW()
            WHERE "id" = $1 AND "schoolId" = $2 AND "isDeleted" = FALSE
            RETURNING "id", "name", "isActive", "status"
        `, [gradeId, schoolId, isActive, isActive ? 'active' : 'inactive'])
        return result.rows[0] || null
    }

    async saveAcademicSettings(schoolId: string, input: {
        enrollmentPeriod: { startDate: string, endDate: string, lateFeePercentage: number, lateFeeDay: number, applyLateFee: boolean },
        gradePeriods: Array<{ gradeId?: string, name: string, maxCapacity: number, enrollmentFee: number, tuitionFee: number, billingFrequency: string }>
    }) {
        await this.db.transaction(async client => {
            let periodResult = await client.query(`
                SELECT "id", "academicYear" FROM "EnrollmentPeriods"
                WHERE "schoolId" = $1 AND "isActive" = TRUE AND "isDeleted" = FALSE
                ORDER BY "academicYear" DESC, "createdAt" DESC LIMIT 1 FOR UPDATE
            `, [schoolId])
            let period = periodResult.rows[0]
            const year = new Date(`${input.enrollmentPeriod.startDate}T00:00:00`).getFullYear()
            if (period) {
                await client.query(`
                    UPDATE "EnrollmentPeriods"
                    SET "academicYear" = $2, "startDate" = $3, "endDate" = $4,
                        "lateFeePercentage" = $5, "lateFeeDay" = $6, "applyLateFee" = $7, "status" = 'open', "updatedAt" = NOW()
                    WHERE "id" = $1 AND "schoolId" = $8
                `, [period.id, year, input.enrollmentPeriod.startDate, input.enrollmentPeriod.endDate,
                    input.enrollmentPeriod.lateFeePercentage, input.enrollmentPeriod.lateFeeDay,
                    input.enrollmentPeriod.applyLateFee, schoolId])
            } else {
                const id = uuidv4()
                await client.query(`
                    INSERT INTO "EnrollmentPeriods"
                        ("id", "schoolId", "academicYear", "startDate", "endDate", "status",
                         "lateFeePercentage", "lateFeeDay", "applyLateFee", "isActive", "isDeleted")
                    VALUES ($1, $2, $3, $4, $5, 'open', $6, $7, $8, TRUE, FALSE)
                `, [id, schoolId, year, input.enrollmentPeriod.startDate, input.enrollmentPeriod.endDate,
                    input.enrollmentPeriod.lateFeePercentage, input.enrollmentPeriod.lateFeeDay, input.enrollmentPeriod.applyLateFee])
                period = { id, academicYear: year }
            }

            const names = input.gradePeriods.map(grade => grade.name.trim().toLocaleLowerCase('es'))
            if (new Set(names).size !== names.length) throw new InvalidFormatError('No puede haber grados con nombres repetidos')
            for (const [index, gradeInput] of input.gradePeriods.entries()) {
                let grade
                if (gradeInput.gradeId) {
                    const result = await client.query(`SELECT "id" FROM "Grades" WHERE "id" = $1 AND "schoolId" = $2 AND "isDeleted" = FALSE`, [gradeInput.gradeId, schoolId])
                    grade = result.rows[0]
                    if (!grade) throw new InvalidFormatError('Uno de los grados no pertenece a este colegio')
                } else {
                    const existing = await client.query(`SELECT "id" FROM "Grades" WHERE "schoolId" = $1 AND LOWER("name") = LOWER($2) AND "isDeleted" = FALSE LIMIT 1`, [schoolId, gradeInput.name.trim()])
                    grade = existing.rows[0]
                    if (!grade) {
                        const id = uuidv4()
                        await client.query(`
                            INSERT INTO "Grades" ("id", "schoolId", "code", "name", "sortOrder", "status", "isActive", "isDeleted")
                            VALUES ($1, $2, $3, $4, $5, 'active', TRUE, FALSE)
                        `, [id, schoolId, `CUSTOM-${id.slice(0, 8)}`, gradeInput.name.trim(), index + 12])
                        grade = { id }
                    }
                }
                await client.query(`UPDATE "Grades" SET "name" = $3, "sortOrder" = $4 WHERE "id" = $1 AND "schoolId" = $2`, [grade.id, schoolId, gradeInput.name.trim(), index])

                const gradePeriodResult = await client.query(`
                    SELECT "id" FROM "GradePeriods"
                    WHERE "schoolId" = $1 AND "gradeId" = $2 AND "periodId" = $3 AND "isDeleted" = FALSE
                    LIMIT 1
                `, [schoolId, grade.id, period.id])
                if (gradePeriodResult.rows[0]) {
                    await client.query(`
                        UPDATE "GradePeriods" SET "maxCapacity" = $2, "enrollmentFee" = $3,
                            "tuitionFee" = $4, "billingFrequency" = $5, "updatedAt" = NOW()
                        WHERE "id" = $1
                    `, [gradePeriodResult.rows[0].id, gradeInput.maxCapacity, gradeInput.enrollmentFee, gradeInput.tuitionFee, gradeInput.billingFrequency])
                } else {
                    await client.query(`
                        INSERT INTO "GradePeriods"
                            ("id", "schoolId", "gradeId", "periodId", "maxCapacity", "enrollmentFee",
                             "tuitionFee", "billingFrequency", "installmentCount", "status", "isActive", "isDeleted")
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 10, 'active', TRUE, FALSE)
                    `, [uuidv4(), schoolId, grade.id, period.id, gradeInput.maxCapacity, gradeInput.enrollmentFee,
                        gradeInput.tuitionFee, gradeInput.billingFrequency])
                }
            }
        })
        return this.findAcademicSettings(schoolId)
    }

    async createSchoolWithAcademicDefaults(data: Partial<School>) {
        const schoolId = uuidv4()
        const periodId = uuidv4()
        const grades = [
            { code: 'PRE', name: 'Preescolar' },
            ...Array.from({ length: 11 }, (_, index) => ({
                code: `G${index + 1}`,
                name: `${index + 1}°`
            }))
        ]

        return this.db.transaction(async (client) => {
            const schoolResult = await client.query(`
                INSERT INTO "Schools"
                    ("id", "code", "name", "nit", "city", "department", "email", "brandColor",
                     "isPartner", "status", "isActive", "isDeleted")
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', TRUE, FALSE)
                RETURNING *
            `, [
                schoolId,
                data.code,
                data.name,
                data.nit,
                data.city,
                data.department,
                data.email || null,
                data.brandColor || null,
                data.isPartner ?? false
            ])

            await client.query(`
                INSERT INTO "EnrollmentPeriods"
                    ("id", "schoolId", "academicYear", "startDate", "endDate",
                     "status", "isActive", "isDeleted")
                VALUES (
                    $1, $2, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
                    DATE_TRUNC('year', CURRENT_DATE)::date,
                    (DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year - 1 day')::date,
                    'open', TRUE, FALSE
                )
            `, [
                periodId,
                schoolId
            ])

            for (const [sortOrder, grade] of grades.entries()) {
                const gradeId = uuidv4()
                await client.query(`
                    INSERT INTO "Grades"
                        ("id", "schoolId", "code", "name", "sortOrder", "status", "isActive", "isDeleted")
                    VALUES ($1, $2, $3, $4, $5, 'active', TRUE, FALSE)
                `, [gradeId, schoolId, grade.code, grade.name, sortOrder])
                await client.query(`
                    INSERT INTO "GradePeriods"
                        ("id", "schoolId", "gradeId", "periodId", "maxCapacity",
                         "enrollmentFee", "tuitionFee", "billingFrequency", "installmentCount",
                         "status", "isActive", "isDeleted")
                    VALUES ($1, $2, $3, $4, 30, 700000, 380000, 'monthly', 10, 'active', TRUE, FALSE)
                `, [uuidv4(), schoolId, gradeId, periodId])
            }

            const documentTypes = [
                ['Documento de identidad del estudiante', 'application/pdf', 5 * 1024 * 1024],
                ['Registro civil de nacimiento', 'application/pdf', 5 * 1024 * 1024],
                ['Certificado de notas del año anterior', 'application/pdf', 5 * 1024 * 1024],
                ['Paz y salvo del colegio anterior', 'application/pdf', 5 * 1024 * 1024],
                ['Documento de identidad del acudiente', 'application/pdf', 5 * 1024 * 1024],
                ['Fotografía tipo documento del estudiante', 'image/jpeg', 2 * 1024 * 1024]
            ] as const

            const createdDocumentTypes: string[] = []
            for (const [name, allowedMimeType, maxSizeBytes] of documentTypes) {
                const documentTypeId = uuidv4()
                await client.query(`
                    INSERT INTO "DocumentTypes"
                        ("id", "name", "description", "allowedMimeType", "maxSizeBytes", "schoolId", "status", "isActive", "isDeleted")
                    VALUES ($1, $2, $3, $4, $5, $6, 'active', TRUE, FALSE)
                `, [documentTypeId, name, name, allowedMimeType, maxSizeBytes, schoolId])
                createdDocumentTypes.push(documentTypeId)
            }

            // Every grade gets the same required enrollment documents.
            const gradeResults = await client.query(`SELECT "id" FROM "Grades" WHERE "schoolId" = $1`, [schoolId])
            for (const grade of gradeResults.rows) {
                for (const documentTypeId of createdDocumentTypes) {
                    await client.query(`
                        INSERT INTO "GradeDocumentTypes"
                            ("id", "schoolId", "gradeId", "documentTypeId", "isRequired", "status", "isActive", "isDeleted")
                        VALUES ($1, $2, $3, $4, TRUE, 'active', TRUE, FALSE)
                    `, [uuidv4(), schoolId, grade.id, documentTypeId])
                }
            }

            return schoolResult.rows[0]
        })
    }
}

export default SchoolRepository
