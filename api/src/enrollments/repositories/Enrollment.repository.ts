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
    createdBy?: string
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

    async findReviewQueue(schoolId: string) {
        const result = await this.db.query(`
            SELECT e."id" AS "enrollmentId", e."fileNumber", e."requestedAt",
                st."id" AS "studentId", st."name" AS "studentName",
                st."documentType" AS "studentDocumentType", st."documentNumber" AS "studentDocumentNumber",
                g."name" AS "grade",
                (SELECT MIN(u."name") FROM "StudentGuardians" sg
                    JOIN "Guardians" gu ON gu."id" = sg."guardianId" AND gu."isDeleted" = FALSE AND gu."isActive" = TRUE
                    JOIN "Users" u ON u."id" = gu."userId"
                    WHERE sg."studentId" = st."id" AND sg."isDeleted" = FALSE AND sg."isActive" = TRUE) AS "guardianName",
                (SELECT COUNT(DISTINCT ed."documentTypeId")::INTEGER FROM "EnrollmentDocuments" ed
                    WHERE ed."enrollmentId" = e."id" AND ed."isDeleted" = FALSE) AS "uploadedDocuments",
                (SELECT COUNT(*)::INTEGER FROM "GradeDocumentTypes" gdt
                    WHERE gdt."schoolId" = e."schoolId" AND gdt."gradeId" = g."id"
                        AND gdt."isRequired" = TRUE AND gdt."status" = 'active'
                        AND gdt."isActive" = TRUE AND gdt."isDeleted" = FALSE) AS "requiredDocuments",
                EXISTS (SELECT 1 FROM "EnrollmentDocuments" ed
                    WHERE ed."enrollmentId" = e."id" AND ed."version" > 1 AND ed."isDeleted" = FALSE) AS "hasCorrections",
                EXISTS (
                    SELECT 1 FROM (
                        SELECT ed."documentTypeId", MAX(ed."version") AS version
                        FROM "EnrollmentDocuments" ed
                        WHERE ed."enrollmentId" = e."id" AND ed."isDeleted" = FALSE
                        GROUP BY ed."documentTypeId"
                    ) latest
                    JOIN "EnrollmentDocuments" ed
                        ON ed."enrollmentId" = e."id" AND ed."documentTypeId" = latest."documentTypeId" AND ed."version" = latest.version
                    WHERE ed."status" = 'rejected'
                ) AS "hasRejections",
                EXISTS (
                    SELECT 1 FROM (
                        SELECT ed."documentTypeId", MAX(ed."version") AS version
                        FROM "EnrollmentDocuments" ed
                        WHERE ed."enrollmentId" = e."id" AND ed."isDeleted" = FALSE
                        GROUP BY ed."documentTypeId"
                    ) latest
                    JOIN "EnrollmentDocuments" ed
                        ON ed."enrollmentId" = e."id" AND ed."documentTypeId" = latest."documentTypeId" AND ed."version" = latest.version
                    WHERE ed."status" = 'pending'
                ) AS "hasPending"
            FROM "Enrollments" e
            JOIN "Students" st ON st."id" = e."studentId"
            JOIN "GradePeriods" gp ON gp."id" = e."gradePeriodId"
            JOIN "Grades" g ON g."id" = gp."gradeId"
            WHERE e."schoolId" = $1 AND e."isDeleted" = FALSE
                AND st."isDeleted" = FALSE
                AND EXISTS (SELECT 1 FROM "EnrollmentDocuments" ed
                    WHERE ed."enrollmentId" = e."id" AND ed."status" IN ('pending', 'rejected')
                        AND ed."isDeleted" = FALSE)
            ORDER BY e."requestedAt" ASC, st."name" ASC
        `, [schoolId])
        return result.rows
    }

    async findEnrollmentReview(schoolId: string, enrollmentId: string) {
        const enrollmentResult = await this.db.query(`
            SELECT e."id" AS "enrollmentId", e."fileNumber", e."requestedAt", e."periodId", e."status" AS "enrollmentStatus",
                st."id" AS "studentId", st."name" AS "studentName", st."documentType", st."documentNumber",
                g."id" AS "gradeId", g."name" AS "grade", ep."academicYear", e."shift"
            FROM "Enrollments" e
            JOIN "Students" st ON st."id" = e."studentId"
            JOIN "GradePeriods" gp ON gp."id" = e."gradePeriodId"
            JOIN "Grades" g ON g."id" = gp."gradeId"
            JOIN "EnrollmentPeriods" ep ON ep."id" = e."periodId"
            WHERE e."id" = $1 AND e."schoolId" = $2 AND e."isDeleted" = FALSE
            LIMIT 1
        `, [enrollmentId, schoolId])
        const enrollment = enrollmentResult.rows[0]
        if (!enrollment) return null

        const documentsResult = await this.db.query(`
            SELECT dt."id" AS "documentTypeId", dt."name", latest."id" AS "documentId",
                COALESCE(latest."status", 'missing') AS "status", latest."observation",
                latest."version", latest."fileName", latest."mimeType", latest."sizeBytes",
                latest."storagePath", latest."createdAt" AS "uploadedAt"
            FROM "GradeDocumentTypes" gdt
            JOIN "DocumentTypes" dt ON dt."id" = gdt."documentTypeId"
            JOIN "GradePeriods" gp ON gp."gradeId" = gdt."gradeId" AND gp."periodId" = $3
                AND gp."schoolId" = $2 AND gp."isDeleted" = FALSE
            LEFT JOIN LATERAL (
                SELECT ed."id", ed."status", ed."observation", ed."version", ed."fileName",
                    ed."mimeType", ed."sizeBytes", ed."storagePath", ed."createdAt"
                FROM "EnrollmentDocuments" ed
                WHERE ed."enrollmentId" = $1 AND ed."documentTypeId" = dt."id" AND ed."isDeleted" = FALSE
                ORDER BY ed."version" DESC, ed."createdAt" DESC
                LIMIT 1
            ) latest ON TRUE
            WHERE gdt."schoolId" = $2 AND gdt."gradeId" = $4 AND gdt."isRequired" = TRUE
                AND gdt."status" = 'active' AND gdt."isActive" = TRUE AND gdt."isDeleted" = FALSE
                AND dt."status" = 'active' AND dt."isActive" = TRUE AND dt."isDeleted" = FALSE
            ORDER BY dt."name" ASC
        `, [enrollmentId, schoolId, enrollment.periodId, enrollment.gradeId])

        const studentResult = await this.db.query(`
            SELECT "name", "documentType", "documentNumber", "gender", "birthDate",
                "phone", "address", "previousSchool"
            FROM "Students"
            WHERE "id" = $1 AND "isDeleted" = FALSE
        `, [enrollment.studentId])

        const guardianResult = await this.db.query(`
            SELECT g."id" AS "guardianId", u."id" AS "userId",
                u."name", u."documentType" AS "documentType", u."documentNumber" AS "documentNumber",
                u."email", g."whatsapp", g."phone", g."address",
                sg."relationship", sg."isPaymentResponsible",
                g."emailNotifications", g."whatsappNotifications"
            FROM "Guardians" g
            JOIN "Users" u ON u."id" = g."userId" AND u."isDeleted" = FALSE
            JOIN "StudentGuardians" sg ON sg."guardianId" = g."id"
                AND sg."studentId" = $1 AND sg."isDeleted" = FALSE AND sg."isActive" = TRUE
            WHERE g."isDeleted" = FALSE AND g."isActive" = TRUE
            ORDER BY sg."isPaymentResponsible" DESC NULLS LAST
            LIMIT 1
        `, [enrollment.studentId])

        return {
            enrollment,
            student: studentResult.rows[0] ? { ...studentResult.rows[0], shift: enrollment.shift ?? null } : null,
            guardian: guardianResult.rows[0] ?? null,
            documents: documentsResult.rows
        }
    }

    async updateEnrollmentData(schoolId: string, enrollmentId: string, student: Record<string, any> | undefined, guardian: Record<string, any> | undefined, actor: string) {
        return this.db.transaction(async (client) => {
            const enrollmentRow = await client.query(`
                SELECT e."id", e."studentId", e."gradePeriodId", gp."gradeId", gp."schoolId" AS "schoolId", gp."periodId"
                FROM "Enrollments" e
                JOIN "GradePeriods" gp ON gp."id" = e."gradePeriodId"
                WHERE e."id" = $1 AND e."schoolId" = $2 AND e."isDeleted" = FALSE
                LIMIT 1
            `, [enrollmentId, schoolId])
            const enrollment = enrollmentRow.rows[0]
            if (!enrollment) return null

            const lockResult = await client.query(`
                WITH required AS (
                    SELECT gdt."documentTypeId"
                    FROM "GradeDocumentTypes" gdt
                    JOIN "GradePeriods" gp ON gp."id" = $1 AND gp."gradeId" = gdt."gradeId" AND gp."schoolId" = gdt."schoolId"
                    WHERE gdt."schoolId" = $2
                        AND gdt."isRequired" = TRUE AND gdt."status" = 'active'
                        AND gdt."isActive" = TRUE AND gdt."isDeleted" = FALSE
                ),
                latest AS (
                    SELECT DISTINCT ON (ed."documentTypeId") ed."documentTypeId", ed."status"
                    FROM "EnrollmentDocuments" ed
                    WHERE ed."enrollmentId" = $3 AND ed."isDeleted" = FALSE
                    ORDER BY ed."documentTypeId", ed."version" DESC, ed."createdAt" DESC
                )
                SELECT
                    (SELECT COUNT(*) FROM required)::INTEGER AS "requiredCount",
                    (SELECT COUNT(*) FROM required r
                     LEFT JOIN latest l ON l."documentTypeId" = r."documentTypeId"
                     WHERE l."status" IS DISTINCT FROM 'approved')::INTEGER AS "pendingCount"
            `, [enrollment.gradePeriodId, schoolId, enrollmentId])
            const lock = lockResult.rows[0] || { requiredCount: 0, pendingCount: 0 }
            if (Number(lock.requiredCount) > 0 && Number(lock.pendingCount) === 0) {
                const err = new Error('El expediente no se puede modificar porque todos los documentos fueron verificados') as any
                err.code = 'ENROLLMENT_LOCKED'
                throw err
            }

            if (student && student.shift !== undefined) {
                await client.query(`
                    UPDATE "Enrollments" SET "shift" = $3, "updatedAt" = NOW(), "updatedBy" = $4
                    WHERE "id" = $1 AND "schoolId" = $2
                `, [enrollmentId, schoolId, student.shift, actor])
            }

            if (student && Object.keys(student).length > 0) {
                const columns = ['name', 'documentType', 'documentNumber', 'gender', 'birthDate', 'phone', 'address', 'previousSchool']
                const sets: string[] = []
                const values: any[] = [enrollment.studentId]
                for (const col of columns) {
                    if (student[col] !== undefined) {
                        values.push(student[col])
                        sets.push(`"${col}" = $${values.length}`)
                    }
                }
                if (sets.length) {
                    values.push(actor)
                    sets.push('"updatedAt" = NOW()', `"updatedBy" = $${values.length}`)
                    await client.query(`
                        UPDATE "Students" SET ${sets.join(', ')} WHERE "id" = $1 AND "isDeleted" = FALSE
                    `, values)
                }
            }

            if (guardian && Object.keys(guardian).length > 0) {
                const linkResult = await client.query(`
                    SELECT g."id" AS "guardianId", u."id" AS "userId"
                    FROM "Guardians" g
                    JOIN "Users" u ON u."id" = g."userId"
                    JOIN "StudentGuardians" sg ON sg."guardianId" = g."id"
                        AND sg."studentId" = $1 AND sg."isDeleted" = FALSE AND sg."isActive" = TRUE
                    WHERE g."isDeleted" = FALSE AND g."isActive" = TRUE
                    ORDER BY sg."isPaymentResponsible" DESC NULLS LAST
                    LIMIT 1
                `, [enrollment.studentId])
                const link = linkResult.rows[0]
                if (link) {
                    const guardianUsers: string[] = []
                    const guardianValues: any[] = [link.userId]
                    for (const col of ['name', 'documentType', 'documentNumber'] as const) {
                        if (guardian[col] !== undefined) {
                            guardianValues.push(guardian[col])
                            guardianUsers.push(`"${col}" = $${guardianValues.length}`)
                        }
                    }
                    if (guardian.email !== undefined) {
                        guardianValues.push(guardian.email)
                        guardianUsers.push(`"email" = $${guardianValues.length}`, `"username" = $${guardianValues.length}`)
                    }
                    if (guardianUsers.length) {
                        guardianValues.push(actor)
                        guardianUsers.push('"updatedAt" = NOW()', `"updatedBy" = $${guardianValues.length}`)
                        await client.query(`
                            UPDATE "Users" SET ${guardianUsers.join(', ')} WHERE "id" = $1 AND "isDeleted" = FALSE
                        `, guardianValues)
                    }

                    const guardianSets: string[] = []
                    const guardianVals: any[] = [link.guardianId]
                    for (const col of ['whatsapp', 'phone', 'address', 'emailNotifications', 'whatsappNotifications'] as const) {
                        if (guardian[col] !== undefined) {
                            guardianVals.push(guardian[col])
                            guardianSets.push(`"${col}" = $${guardianVals.length}`)
                        }
                    }
                    if (guardianSets.length) {
                        guardianVals.push(actor)
                        guardianSets.push('"updatedAt" = NOW()', `"updatedBy" = $${guardianVals.length}`)
                        await client.query(`
                            UPDATE "Guardians" SET ${guardianSets.join(', ')} WHERE "id" = $1 AND "isDeleted" = FALSE
                        `, guardianVals)
                    }

                    const linkSets: string[] = []
                    const linkVals: any[] = [link.guardianId, enrollment.studentId]
                    for (const col of ['relationship', 'isPaymentResponsible'] as const) {
                        if (guardian[col] !== undefined) {
                            linkVals.push(guardian[col])
                            linkSets.push(`"${col}" = $${linkVals.length}`)
                        }
                    }
                    if (linkSets.length) {
                        linkVals.push(actor)
                        linkSets.push('"updatedAt" = NOW()', `"updatedBy" = $${linkVals.length}`)
                        await client.query(`
                            UPDATE "StudentGuardians" SET ${linkSets.join(', ')} WHERE "guardianId" = $1 AND "studentId" = $2
                        `, linkVals)
                    }
                }
            }

            return { updated: true }
        })
    }

    async reviewEnrollmentDocument(schoolId: string, documentId: string, decision: 'approved' | 'rejected', observation: string | null, reviewerId?: string) {
        const result = await this.db.query(`
            UPDATE "EnrollmentDocuments" ed
            SET "status" = $3, "observation" = $4, "reviewedAt" = NOW(),
                "reviewedById" = $5, "updatedAt" = NOW()
            FROM "Enrollments" e
            WHERE ed."id" = $1 AND ed."enrollmentId" = e."id"
                AND ed."schoolId" = $2 AND e."schoolId" = $2 AND ed."isDeleted" = FALSE
            RETURNING ed."id", ed."status", ed."observation", ed."reviewedAt"
        `, [documentId, schoolId, decision, observation, reviewerId || null])
        return result.rows[0] || null
    }

    async createDraft(input: EnrollmentDraftInput) {
        const id = uuidv4()
        return this.db.transaction(async (client) => {
            const feeResult = await client.query(`
                SELECT "enrollmentFee" FROM "GradePeriods"
                WHERE "id" = $1 AND "schoolId" = $2 AND "periodId" = $3
                    AND "isActive" = TRUE AND "isDeleted" = FALSE
                FOR SHARE
            `, [input.gradePeriodId, input.schoolId, input.periodId])
            if (!feeResult.rows[0]) throw new NotFoundError('No se encontró el valor de matrícula del grado')
            const agreedFee = feeResult.rows[0].enrollmentFee
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
                     "accessTokenHash", "agreedFee", "expiresAt", "status", "isActive", "isDeleted", "createdBy")
                VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8, $9, 'draft', TRUE, FALSE, $10)
                RETURNING "id", "expiresAt", "status", "agreedFee"
            `, [
                id,
                input.schoolId,
                input.gradePeriodId,
                input.periodId,
                JSON.stringify(input.studentData),
                JSON.stringify(input.guardianData),
                input.accessTokenHash,
                agreedFee,
                input.expiresAt,
                input.createdBy ?? 'Public'
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
                AND s."isActive" = TRUE AND s."isDeleted" = FALSE
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

    async createDraftDocument(input: DraftDocumentInput, accessTokenHash: string, actor: string = 'Public') {
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
                     "isActive", "isDeleted", "createdBy")
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending', TRUE, FALSE, $13)
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
                input.heightPx ?? null,
                actor
            ])
            return result.rows[0]
        })
    }

    async submitDraft(draftId: string, accessTokenHash: string, passwordHash: string, actor: string = 'Public') {
        return this.db.transaction(async (client) => {
            const draftResult = await client.query(`
                SELECT d."id", d."schoolId", d."gradePeriodId", d."periodId",
                    d."studentData", d."guardianData", s."code", ep."academicYear",
                    COALESCE(d."agreedFee", gp."enrollmentFee") AS "agreedFee", g."id" AS "gradeId"
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
                     "registerDate", "isAuthorized", "isOnline", "isActive", "isDeleted", "schoolId")
                VALUES ($1, $2, $3, $4, $5, NULL, 'Colombia', NULL, $6, $7, $8, $9,
                    $10, TRUE, FALSE, TRUE, FALSE, $11)
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
                now,
                draft.schoolId
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
                     "requestedAt", "agreedFee", "shift", "status", "isActive", "isDeleted", "createdBy")
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', TRUE, FALSE, $10)
            `, [
                enrollmentId,
                draft.schoolId,
                fileNumber,
                studentId,
                draft.gradePeriodId,
                draft.periodId,
                now,
                draft.agreedFee,
                student.shift,
                actor
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
            return { id: enrollmentId, fileNumber, status: 'pending', username, requestedAt: now, agreedFee: draft.agreedFee, schoolId: draft.schoolId, studentName: student?.name ?? null }
        })
    }

    async findEnrollmentEmailContext(documentId: string): Promise<{ guardianEmail: string | null, emailNotifications: boolean, studentName: string | null, fileNumber: string | null } | null> {
        const result = await this.db.query(`
            SELECT u."email" AS "guardianEmail", g."emailNotifications" AS "emailNotifications",
                   s."name" AS "studentName", e."fileNumber" AS "fileNumber"
            FROM "EnrollmentDocuments" d
            JOIN "Enrollments" e ON e."id" = d."enrollmentId"
            JOIN "Students" s ON s."id" = e."studentId"
            JOIN "StudentGuardians" sg ON sg."studentId" = s."id" AND sg."isDeleted" = FALSE
            JOIN "Guardians" g ON g."id" = sg."guardianId" AND g."isDeleted" = FALSE AND g."isActive" = TRUE
            JOIN "Users" u ON u."id" = g."userId"
            WHERE d."id" = $1
            ORDER BY sg."isPaymentResponsible" DESC NULLS LAST
            LIMIT 1
        `, [documentId])
        return result.rows[0] ?? null
    }
}

export default EnrollmentRepository
