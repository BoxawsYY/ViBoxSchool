import { Repository } from '../../core/decorators/decorators.js'
import BaseRepository from '../../core/orm/repository/Base.repository.js'
import { v4 as uuidv4 } from 'uuid'
import School from '../entities/School.entity.js'

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
                AND s."isDeleted" = FALSE AND s."isPartner" = TRUE
            ORDER BY s."name" ASC
        `)
        return result.rows
    }

    async findDiscoverableByCode(code: string) {
        const result = await this.db.query(`
            SELECT ${PUBLIC_SCHOOL_FIELDS.map(field => `s."${field}"`).join(', ')}, s."id"
            FROM "Schools" s
            WHERE s."code" = $1 AND s."status" = 'active'
                AND s."isActive" = TRUE AND s."isDeleted" = FALSE AND s."isPartner" = TRUE
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
                SELECT DISTINCT dt."id", dt."name", dt."allowedMimeType", dt."maxSizeBytes",
                    dt."minWidthPx", dt."minHeightPx", dt."maxWidthPx", dt."maxHeightPx",
                    gdt."gradeId", gdt."isRequired"
                FROM "GradeDocumentTypes" gdt
                JOIN "DocumentTypes" dt ON dt."id" = gdt."documentTypeId"
                JOIN "Grades" g ON g."id" = gdt."gradeId"
                WHERE gdt."schoolId" = $1 AND gdt."status" = 'active'
                    AND gdt."isActive" = TRUE AND gdt."isDeleted" = FALSE
                    AND dt."status" = 'active' AND dt."isActive" = TRUE AND dt."isDeleted" = FALSE
                    AND g."status" = 'active' AND g."isActive" = TRUE AND g."isDeleted" = FALSE
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

    async createSchoolWithAcademicDefaults(data: Partial<School>) {
        const schoolId = uuidv4()
        const periodId = uuidv4()
        const academicYear = new Date().getFullYear()
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
                    ("id", "code", "name", "nit", "city", "email", "brandColor",
                     "isPartner", "status", "isActive", "isDeleted")
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', TRUE, FALSE)
                RETURNING *
            `, [
                schoolId,
                data.code,
                data.name,
                data.nit,
                data.city,
                data.email || null,
                data.brandColor || null,
                data.isPartner ?? false
            ])

            await client.query(`
                INSERT INTO "EnrollmentPeriods"
                    ("id", "schoolId", "academicYear", "startDate", "endDate",
                     "status", "isActive", "isDeleted")
                VALUES ($1, $2, $3, $4, $5, 'open', TRUE, FALSE)
            `, [
                periodId,
                schoolId,
                academicYear,
                `${academicYear}-01-01`,
                `${academicYear}-12-31`
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

            return schoolResult.rows[0]
        })
    }
}

export default SchoolRepository
