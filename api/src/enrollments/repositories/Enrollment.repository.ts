import { Repository } from '../../core/decorators/decorators.js'
import BaseRepository from '../../core/orm/repository/Base.repository.js'
import EnrollmentDraft from '../entities/EnrollmentDraft.entity.js'
import { v4 as uuidv4 } from 'uuid'
import { AlreadyExistError } from '../../core/errors/AlreadyExist.error.js'
import { InvalidFormatError } from '../../core/errors/InvalidFormat.error.js'
import { NotFoundError } from '../../core/errors/NotFound.error.js'

export interface EnrollmentDraftInput {
    schoolId: string
    gradePeriodId: string
    periodId: string
    studentData: Record<string, unknown>
    guardianData: Record<string, unknown>
    accessTokenHash: string
    expiresAt: Date
}

export interface DraftDocumentInput {
    draftId: string
    schoolId: string
    documentTypeId: string
    fileUrl: string
    storagePath: string
    fileName: string
    mimeType: string
    sizeBytes: number
    widthPx?: number
    heightPx?: number
}

@Repository()
export class EnrollmentRepository extends BaseRepository<EnrollmentDraft> {
    constructor() {
        super(EnrollmentDraft)
    }

    async createDraft(input: EnrollmentDraftInput) {
        const id = uuidv4()
        return this.db.transaction(async (client) => {
            await client.query(`
                DELETE FROM "EnrollmentDraftDocuments"
                WHERE "draftId" IN (
                    SELECT "id" FROM "EnrollmentDrafts"
                    WHERE "status" = 'draft' AND "expiresAt" <= NOW()
                )
            `)
            await client.query(`
                DELETE FROM "EnrollmentDrafts"
                WHERE "status" = 'draft' AND "expiresAt" <= NOW()
            `)
            const result = await client.query(`
                INSERT INTO "EnrollmentDrafts"
                    ("id", "schoolId", "gradePeriodId", "periodId", "studentData", "guardianData",
                     "accessTokenHash", "expiresAt", "status", "isActive", "isDeleted")
                VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8, 'draft', TRUE, FALSE)
                RETURNING "id", "expiresAt", "status"
            `, [
                id,
                input.schoolId,
                input.gradePeriodId,
                input.periodId,
                JSON.stringify(input.studentData),
                JSON.stringify(input.guardianData),
                input.accessTokenHash,
                input.expiresAt
            ])
            return result.rows[0]
        })
    }

    async findOpenPeriod(schoolCode: string) {
        const result = await this.db.query(`
            SELECT s."id" AS "schoolId", ep."id" AS "periodId"
            FROM "Schools" s
            JOIN "EnrollmentPeriods" ep ON ep."schoolId" = s."id"
            WHERE s."code" = $1 AND s."status" = 'active'
                AND s."isPartner" = TRUE AND s."isActive" = TRUE AND s."isDeleted" = FALSE
                AND ep."status" = 'open' AND ep."isActive" = TRUE AND ep."isDeleted" = FALSE
                AND ep."startDate"::date <= CURRENT_DATE AND ep."endDate"::date >= CURRENT_DATE
            ORDER BY ep."academicYear" DESC
            LIMIT 1
        `, [schoolCode])
        return result.rows[0] || null
    }

    async findAvailableGradePeriod(gradePeriodId: string, schoolId: string, periodId: string) {
        const result = await this.db.query(`
            SELECT gp."id", gp."periodId", gp."enrollmentFee", gp."maxCapacity",
                GREATEST(gp."maxCapacity" - (
                    SELECT COUNT(*) FROM "Enrollments" e
                    WHERE e."gradePeriodId" = gp."id" AND e."isDeleted" = FALSE
                ), 0)::INTEGER AS "availableSeats"
            FROM "GradePeriods" gp
            JOIN "Grades" g ON g."id" = gp."gradeId"
            WHERE gp."id" = $1 AND gp."schoolId" = $2 AND gp."periodId" = $3
                AND gp."status" = 'active' AND gp."isActive" = TRUE AND gp."isDeleted" = FALSE
                AND g."status" = 'active' AND g."isActive" = TRUE AND g."isDeleted" = FALSE
            LIMIT 1
        `, [gradePeriodId, schoolId, periodId])
        return result.rows[0] || null
    }

    async findDocumentTypeForDraft(draftId: string, documentTypeId: string, accessTokenHash: string) {
        const result = await this.db.query(`
            SELECT dt."id", dt."allowedMimeType", dt."maxSizeBytes",
                dt."minWidthPx", dt."minHeightPx", dt."maxWidthPx", dt."maxHeightPx",
                d."schoolId"
            FROM "EnrollmentDrafts" d
            JOIN "DocumentTypes" dt ON dt."schoolId" = d."schoolId"
            WHERE d."id" = $1 AND d."accessTokenHash" = $2
                AND d."status" = 'draft' AND d."expiresAt" > NOW()
                AND d."isActive" = TRUE AND d."isDeleted" = FALSE
                AND dt."id" = $3 AND dt."status" = 'active'
                AND dt."isActive" = TRUE AND dt."isDeleted" = FALSE
                AND EXISTS (
                    SELECT 1
                    FROM "GradeDocumentTypes" gdt
                    JOIN "GradePeriods" gp ON gp."gradeId" = gdt."gradeId"
                    WHERE gdt."schoolId" = d."schoolId"
                        AND gdt."documentTypeId" = dt."id"
                        AND gp."id" = d."gradePeriodId"
                        AND gdt."status" = 'active'
                        AND gdt."isActive" = TRUE AND gdt."isDeleted" = FALSE
                        AND gp."status" = 'active'
                        AND gp."isActive" = TRUE AND gp."isDeleted" = FALSE
                )
            LIMIT 1
        `, [draftId, accessTokenHash, documentTypeId])
        return result.rows[0] || null
    }

    async createDraftDocument(input: DraftDocumentInput, accessTokenHash: string) {
        return this.db.transaction(async (client) => {
            const draftResult = await client.query(`
                SELECT "schoolId" FROM "EnrollmentDrafts"
                WHERE "id" = $1 AND "accessTokenHash" = $2 AND "status" = 'draft'
                    AND "expiresAt" > NOW() AND "isActive" = TRUE AND "isDeleted" = FALSE
                FOR UPDATE
            `, [input.draftId, accessTokenHash])

            if (!draftResult.rows[0]) return null

            const previousResult = await client.query(`
                SELECT COALESCE(MAX("version"), 0)::INTEGER AS "lastVersion"
                FROM "EnrollmentDraftDocuments"
                WHERE "draftId" = $1 AND "documentTypeId" = $2 AND "isDeleted" = FALSE
            `, [input.draftId, input.documentTypeId])
            const version = previousResult.rows[0].lastVersion + 1

            await client.query(`
                UPDATE "EnrollmentDraftDocuments"
                SET "status" = 'superseded', "isActive" = FALSE, "updatedAt" = NOW()
                WHERE "draftId" = $1 AND "documentTypeId" = $2
                    AND "status" = 'pending' AND "isDeleted" = FALSE
            `, [input.draftId, input.documentTypeId])

            const documentId = uuidv4()
            const result = await client.query(`
                INSERT INTO "EnrollmentDraftDocuments"
                    ("id", "schoolId", "draftId", "documentTypeId", "version", "fileUrl", "storagePath",
                     "fileName", "mimeType", "sizeBytes", "widthPx", "heightPx", "status",
                     "isActive", "isDeleted")
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending', TRUE, FALSE)
                RETURNING "id", "documentTypeId", "version", "fileName", "mimeType", "sizeBytes", "status"
            `, [
                documentId,
                input.schoolId,
                input.draftId,
                input.documentTypeId,
                version,
                input.fileUrl,
                input.storagePath,
                input.fileName,
                input.mimeType,
                input.sizeBytes,
                input.widthPx ?? null,
                input.heightPx ?? null
            ])
            return result.rows[0]
        })
    }

    async submitDraft(draftId: string, accessTokenHash: string, passwordHash: string) {
        return this.db.transaction(async (client) => {
            const draftResult = await client.query(`
                SELECT d."id", d."schoolId", d."gradePeriodId", d."periodId",
                    d."studentData", d."guardianData", s."code", ep."academicYear",
                    gp."enrollmentFee", g."id" AS "gradeId"
                FROM "EnrollmentDrafts" d
                JOIN "Schools" s ON s."id" = d."schoolId"
                JOIN "GradePeriods" gp ON gp."id" = d."gradePeriodId"
                JOIN "Grades" g ON g."id" = gp."gradeId"
                JOIN "EnrollmentPeriods" ep ON ep."id" = d."periodId"
                WHERE d."id" = $1 AND d."accessTokenHash" = $2
                    AND d."status" = 'draft' AND d."expiresAt" > NOW()
                    AND d."isActive" = TRUE AND d."isDeleted" = FALSE
                    AND s."status" = 'active' AND s."isActive" = TRUE AND s."isDeleted" = FALSE
                    AND gp."status" = 'active' AND gp."isActive" = TRUE AND gp."isDeleted" = FALSE
                    AND ep."status" = 'open' AND ep."isActive" = TRUE AND ep."isDeleted" = FALSE
                    AND ep."startDate"::date <= CURRENT_DATE AND ep."endDate"::date >= CURRENT_DATE
                FOR UPDATE OF d, gp
            `, [draftId, accessTokenHash])
            const draft = draftResult.rows[0]
            if (!draft) return null

            const seatsResult = await client.query(`
                SELECT GREATEST(gp."maxCapacity" - COUNT(e."id"), 0)::INTEGER AS "availableSeats"
                FROM "GradePeriods" gp
                LEFT JOIN "Enrollments" e ON e."gradePeriodId" = gp."id" AND e."isDeleted" = FALSE
                WHERE gp."id" = $1
                GROUP BY gp."id", gp."maxCapacity"
            `, [draft.gradePeriodId])
            if (!seatsResult.rows[0] || Number(seatsResult.rows[0].availableSeats) < 1) {
                throw new InvalidFormatError('Ya no hay cupos disponibles para el grado seleccionado')
            }

            const { studentData: student, guardianData: guardian } = draft
            const username = guardian.email
            const userResult = await client.query(`
                SELECT "id" FROM "Users"
                WHERE "username" = $1 OR "email" = $2
                LIMIT 1
            `, [username, guardian.email])
            if (userResult.rows.length > 0) {
                throw new AlreadyExistError('El usuario o correo del acudiente ya está registrado')
            }

            const existingStudent = await client.query(`
                SELECT "id" FROM "Students"
                WHERE "schoolId" = $1 AND "documentType" = $2 AND "documentNumber" = $3
                    AND "isDeleted" = FALSE
                LIMIT 1
            `, [draft.schoolId, student.documentType, student.documentNumber])
            if (existingStudent.rows.length > 0) {
                throw new AlreadyExistError('El estudiante ya tiene un registro en este colegio')
            }

            const missingDocuments = await client.query(`
                SELECT dt."name"
                FROM "GradeDocumentTypes" gdt
                JOIN "DocumentTypes" dt ON dt."id" = gdt."documentTypeId"
                WHERE gdt."schoolId" = $1 AND gdt."gradeId" = $2
                    AND gdt."isRequired" = TRUE AND gdt."status" = 'active'
                    AND gdt."isActive" = TRUE AND gdt."isDeleted" = FALSE
                    AND dt."status" = 'active' AND dt."isActive" = TRUE AND dt."isDeleted" = FALSE
                    AND NOT EXISTS (
                        SELECT 1 FROM "EnrollmentDraftDocuments" dd
                        WHERE dd."draftId" = $3 AND dd."documentTypeId" = dt."id"
                            AND dd."status" = 'pending' AND dd."isActive" = TRUE AND dd."isDeleted" = FALSE
                    )
            `, [draft.schoolId, draft.gradeId, draft.id])
            if (missingDocuments.rows.length > 0) {
                throw new InvalidFormatError(`Faltan documentos obligatorios: ${missingDocuments.rows.map(row => row.name).join(', ')}`)
            }

            const roleResult = await client.query(`
                SELECT "id" FROM "Roles"
                WHERE "name" IN ('Guardian', 'User') AND "isActive" = TRUE AND "isDeleted" = FALSE
                ORDER BY CASE "name" WHEN 'Guardian' THEN 0 ELSE 1 END
                LIMIT 1
            `)
            if (!roleResult.rows[0]) {
                throw new NotFoundError('No hay un rol activo de acudiente para crear la cuenta')
            }

            const userId = uuidv4()
            const guardianId = uuidv4()
            const studentId = uuidv4()
            const enrollmentId = uuidv4()
            const now = new Date()
            const relationship = guardian.relationship
            const email = guardian.email

            await client.query(`
                INSERT INTO "Users"
                    ("id", "name", "username", "documentType", "documentNumber", "gender",
                     "country", "city", "address", "phoneNumber", "email", "password",
                     "registerDate", "isAuthorized", "isOnline", "isActive", "isDeleted")
                VALUES ($1, $2, $3, $4, $5, NULL, 'Colombia', NULL, $6, $7, $8, $9,
                    $10, TRUE, FALSE, TRUE, FALSE)
            `, [
                userId,
                guardian.name,
                username,
                guardian.documentType,
                guardian.documentNumber,
                guardian.address || null,
                guardian.phone,
                email,
                passwordHash,
                now
            ])
            await client.query(`
                INSERT INTO "UsersRoles" ("userId", "roleId")
                VALUES ($1, $2)
            `, [userId, roleResult.rows[0].id])
            await client.query(`
                INSERT INTO "Guardians"
                    ("id", "userId", "whatsapp", "phone", "address", "emailNotifications",
                     "whatsappNotifications", "status", "isActive", "isDeleted")
                VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', TRUE, FALSE)
            `, [
                guardianId, userId, guardian.whatsapp || guardian.phone, guardian.phone,
                guardian.address || null, guardian.emailNotifications, guardian.whatsappNotifications
            ])
            await client.query(`
                INSERT INTO "Students"
                    ("id", "schoolId", "documentType", "documentNumber", "name", "gender",
                     "birthDate", "phone", "address", "previousSchool", "status", "isActive", "isDeleted")
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active', TRUE, FALSE)
            `, [
                studentId,
                draft.schoolId,
                student.documentType,
                student.documentNumber,
                student.name,
                student.gender || null,
                student.birthDate || null,
                student.phone || null,
                student.address || null,
                student.previousSchool || null
            ])
            await client.query(`
                INSERT INTO "StudentGuardians"
                    ("id", "schoolId", "studentId", "guardianId", "relationship",
                     "isPaymentResponsible", "status", "isActive", "isDeleted")
                VALUES ($1, $2, $3, $4, $5, $6, 'active', TRUE, FALSE)
            `, [
                uuidv4(),
                draft.schoolId,
                studentId,
                guardianId,
                relationship,
                guardian.isPaymentResponsible ?? true
            ])

            const fileNumber = `ENR-${draft.academicYear}-${enrollmentId.slice(0, 8).toUpperCase()}`
            await client.query(`
                INSERT INTO "Enrollments"
                    ("id", "schoolId", "fileNumber", "studentId", "gradePeriodId", "periodId",
                     "requestedAt", "agreedFee", "shift", "status", "isActive", "isDeleted")
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', TRUE, FALSE)
            `, [
                enrollmentId,
                draft.schoolId,
                fileNumber,
                studentId,
                draft.gradePeriodId,
                draft.periodId,
                now,
                draft.enrollmentFee,
                student.shift
            ])

            const documents = await client.query(`
                SELECT DISTINCT ON ("documentTypeId") "documentTypeId", "version", "fileUrl", "storagePath",
                    "fileName", "mimeType", "sizeBytes", "widthPx", "heightPx"
                FROM "EnrollmentDraftDocuments"
                WHERE "draftId" = $1 AND "status" = 'pending'
                    AND "isActive" = TRUE AND "isDeleted" = FALSE
                ORDER BY "documentTypeId", "version" DESC
            `, [draft.id])
            for (const document of documents.rows) {
                await client.query(`
                    INSERT INTO "EnrollmentDocuments"
                        ("id", "schoolId", "enrollmentId", "documentTypeId", "version",
                             "fileUrl", "storagePath", "fileName", "mimeType", "sizeBytes", "widthPx", "heightPx",
                         "status", "isActive", "isDeleted")
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending', TRUE, FALSE)
                `, [
                    uuidv4(), draft.schoolId, enrollmentId, document.documentTypeId,
                        document.version, document.fileUrl, document.storagePath, document.fileName, document.mimeType,
                    document.sizeBytes, document.widthPx, document.heightPx
                ])
            }

            await client.query(`
                UPDATE "EnrollmentDrafts"
                SET "status" = 'submitted', "isActive" = FALSE, "updatedAt" = NOW()
                WHERE "id" = $1
            `, [draft.id])
            return { id: enrollmentId, fileNumber, status: 'pending', username, requestedAt: now }
        })
    }
}

export default EnrollmentRepository
