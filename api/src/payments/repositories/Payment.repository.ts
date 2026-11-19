import { v4 as uuidv4 } from 'uuid'
import { Repository } from '../../core/decorators/repository.decorator.js'
import { Database } from '../../core/orm/database/Database.js'
import { InvalidFormatError } from '../../core/errors/InvalidFormat.error.js'
import { createPaymentReceiptPdf } from '../services/PaymentReceiptPdf.service.js'

type PaymentConcept = { id: string, concept: 'enrollment_fee' | 'tuition' | 'late_fee', label: string, amount: string, dueDate: string | null, studentName: string }

@Repository()
export class PaymentRepository {
    private db = Database.getInstance()

    async listPayable(userId: string, requestedStudentId?: string) {
        const guardian = await this.db.query(`
            SELECT g."id" AS "guardianId", sg."studentId", st."name" AS "studentName"
            FROM "Guardians" g
            JOIN "StudentGuardians" sg ON sg."guardianId" = g."id"
                AND sg."isDeleted" = FALSE AND sg."isActive" = TRUE
                AND sg."isPaymentResponsible" = TRUE
            JOIN "Students" st ON st."id" = sg."studentId" AND st."isDeleted" = FALSE
            WHERE g."userId" = $1 AND g."isDeleted" = FALSE AND g."isActive" = TRUE
              AND ($2::uuid IS NULL OR sg."studentId" = $2)
            ORDER BY sg."studentId" LIMIT 1
        `, [userId, requestedStudentId || null])
        if (!guardian.rows.length) return { student: null, concepts: [] }

        const student = guardian.rows[0]
        const result = await this.db.query(`
            SELECT e."id" AS "id", 'enrollment_fee' AS "concept",
                   'Matrícula ' || ep."academicYear" AS "label", e."agreedFee"::text AS "amount",
                   ep."endDate"::date AS "dueDate", st."name" AS "studentName"
            FROM "Enrollments" e
            JOIN "EnrollmentPeriods" ep ON ep."id" = e."periodId"
            JOIN "Students" st ON st."id" = e."studentId"
            WHERE e."studentId" = $1 AND e."isDeleted" = FALSE
              AND NOT EXISTS (
                SELECT 1 FROM "PaymentItems" pi JOIN "Payments" p ON p."id" = pi."paymentId"
                WHERE pi."enrollmentId" = e."id" AND pi."concept" = 'enrollment_fee'
                  AND pi."status" = 'active' AND p."status" = 'approved'
              )
            UNION ALL
            SELECT p."id", 'tuition', 'Pensión ' || to_char(p."billingMonth", 'TMMonth YYYY'),
                   GREATEST(p."amount" - COALESCE((SELECT SUM(pi."appliedAmount") FROM "PaymentItems" pi
                     JOIN "Payments" pay ON pay."id" = pi."paymentId" WHERE pi."pensionId" = p."id"
                     AND pi."concept" = 'tuition' AND pi."status" = 'active' AND pay."status" = 'approved'), 0), 0)::text,
                   p."dueDate"::date, st."name"
            FROM "Pensions" p
            JOIN "Enrollments" e ON e."id" = p."enrollmentId"
            JOIN "Students" st ON st."id" = e."studentId"
            WHERE e."studentId" = $1 AND p."status" IN ('pending', 'overdue', 'partial')
              AND p."amount" > 0
            UNION ALL
            SELECT p."id", 'late_fee', 'Recargo por mora · ' || to_char(p."billingMonth", 'TMMonth YYYY'),
                   GREATEST(p."lateFee" - COALESCE((SELECT SUM(pi."appliedAmount") FROM "PaymentItems" pi
                     JOIN "Payments" pay ON pay."id" = pi."paymentId" WHERE pi."pensionId" = p."id"
                     AND pi."concept" = 'late_fee' AND pi."status" = 'active' AND pay."status" = 'approved'), 0), 0)::text,
                   p."dueDate"::date, st."name"
            FROM "Pensions" p
            JOIN "Enrollments" e ON e."id" = p."enrollmentId"
            JOIN "Students" st ON st."id" = e."studentId"
            WHERE e."studentId" = $1 AND p."status" IN ('pending', 'overdue', 'partial')
              AND p."lateFee" > 0
            ORDER BY "dueDate" NULLS FIRST, "label"
        `, [student.studentId])
        return {
            student: { id: student.studentId, name: student.studentName },
            concepts: result.rows,
            references: await this.findActiveCashReferences(guardian.rows[0].guardianId)
        }
    }

    async searchStudents(schoolId: string, query: string) {
        const result = await this.db.query(`
            SELECT DISTINCT ON (st."id") st."id", st."name", st."documentType", st."documentNumber",
                   e."fileNumber", gr."name" AS "grade", u."name" AS "guardianName"
            FROM "Students" st
            JOIN "Enrollments" e ON e."studentId" = st."id" AND e."schoolId" = $1 AND e."isDeleted" = FALSE
            LEFT JOIN "GradePeriods" gp ON gp."id" = e."gradePeriodId"
            LEFT JOIN "Grades" gr ON gr."id" = gp."gradeId"
            LEFT JOIN "StudentGuardians" sg ON sg."studentId" = st."id" AND sg."isDeleted" = FALSE
                AND sg."isActive" = TRUE AND sg."isPaymentResponsible" = TRUE
            LEFT JOIN "Guardians" g ON g."id" = sg."guardianId" AND g."isDeleted" = FALSE AND g."isActive" = TRUE
            LEFT JOIN "Users" u ON u."id" = g."userId"
            WHERE st."schoolId" = $1 AND st."isDeleted" = FALSE
              AND ($2 = '' OR st."name" ILIKE '%' || $2 || '%'
                   OR st."documentNumber" ILIKE '%' || $2 || '%'
                   OR e."fileNumber" ILIKE '%' || $2 || '%')
            ORDER BY st."id", e."requestedAt" DESC
            LIMIT 25
        `, [schoolId, query.trim()])
        return result.rows
    }

    async studentPayablesForSecretary(studentId: string, schoolId: string) {
        const result = await this.db.query(`
            SELECT st."id", st."name", st."documentType", st."documentNumber", e."fileNumber",
                   gr."name" AS "grade", sg."guardianId", g."userId" AS "guardianUserId", u."name" AS "guardianName"
            FROM "Students" st
            JOIN "Enrollments" e ON e."studentId" = st."id" AND e."schoolId" = $2 AND e."isDeleted" = FALSE
            LEFT JOIN "GradePeriods" gp ON gp."id" = e."gradePeriodId"
            LEFT JOIN "Grades" gr ON gr."id" = gp."gradeId"
            LEFT JOIN "StudentGuardians" sg ON sg."studentId" = st."id" AND sg."isDeleted" = FALSE
                AND sg."isActive" = TRUE AND sg."isPaymentResponsible" = TRUE
            LEFT JOIN "Guardians" g ON g."id" = sg."guardianId" AND g."isDeleted" = FALSE AND g."isActive" = TRUE
            LEFT JOIN "Users" u ON u."id" = g."userId"
            WHERE st."id" = $1 AND st."schoolId" = $2 AND st."isDeleted" = FALSE
            ORDER BY e."requestedAt" DESC LIMIT 1
        `, [studentId, schoolId])
        const student = result.rows[0]
        if (!student) return null
        const payableData: any = student.guardianUserId ? await this.listPayable(student.guardianUserId, student.id) : { student: null, concepts: [], references: [] }
        if (payableData.student?.id !== student.id) return null
        return {
            student: {
                id: student.id, name: student.name, documentType: student.documentType,
                documentNumber: student.documentNumber, fileNumber: student.fileNumber,
                grade: student.grade, guardianName: student.guardianName
            },
            concepts: payableData.concepts,
            references: payableData.references
        }
    }

    async createCashPayment(userId: string, concepts: Array<{ id: string, concept: string }>) {
        return this.db.transaction(async client => {
            await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [userId])
            const guardianResult = await client.query(`
                SELECT g."id" AS "guardianId", g."userId", sg."studentId", sg."schoolId"
                FROM "Guardians" g JOIN "StudentGuardians" sg ON sg."guardianId" = g."id"
                    AND sg."isDeleted" = FALSE AND sg."isActive" = TRUE AND sg."isPaymentResponsible" = TRUE
                WHERE g."userId" = $1 AND g."isDeleted" = FALSE AND g."isActive" = TRUE
            `, [userId])
            if (!guardianResult.rows.length) throw new InvalidFormatError('No se encontró un estudiante responsable asociado a esta cuenta')
            const { guardianId, studentId, schoolId } = guardianResult.rows[0]
            const selected = await this.getSelectedConcepts(client, studentId, concepts)
            if (selected.length !== concepts.length) throw new InvalidFormatError('Uno o más conceptos ya no están disponibles para pago')

            await this.replaceOverlappingCashReferences(client, guardianId, concepts)

            const referenceNumber = `VB${Date.now().toString(36).toUpperCase()}${uuidv4().replaceAll('-', '').slice(0, 8).toUpperCase()}`
            const total = selected.reduce((sum, item) => sum + Number(item.amount), 0)
            const paymentId = uuidv4()
            await client.query(`INSERT INTO "Payments"
                ("id", "schoolId", "payerGuardianId", "paidAt", "totalAmount", "method", "channel", "transactionReference", "status")
                VALUES ($1, $2, $3, NOW(), $4, 'cash', 'in_person', $5, 'pending')`,
                [paymentId, schoolId, guardianId, total.toFixed(2), referenceNumber])
            for (const item of selected) {
                await client.query(`INSERT INTO "PaymentItems"
                    ("id", "schoolId", "paymentId", "concept", "pensionId", "enrollmentId", "appliedAmount", "status")
                    VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')`, [
                    uuidv4(), schoolId, paymentId, item.concept,
                    item.concept === 'enrollment_fee' ? null : item.id,
                    item.concept === 'enrollment_fee' ? item.id : null,
                    item.amount
                ])
            }
            return { id: paymentId, referenceNumber, totalAmount: total.toFixed(2), concepts: selected }
        })
    }

    async invalidateCashReferences(userId: string, concepts: Array<{ id: string, concept: string }>) {
        return this.db.transaction(async client => {
            await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [userId])
            const guardianResult = await client.query(`
                SELECT g."id" AS "guardianId", sg."studentId"
                FROM "Guardians" g JOIN "StudentGuardians" sg ON sg."guardianId" = g."id"
                    AND sg."isDeleted" = FALSE AND sg."isActive" = TRUE AND sg."isPaymentResponsible" = TRUE
                WHERE g."userId" = $1 AND g."isDeleted" = FALSE AND g."isActive" = TRUE
            `, [userId])
            if (!guardianResult.rows.length) throw new InvalidFormatError('No se encontró un estudiante responsable asociado a esta cuenta')
            const { guardianId, studentId } = guardianResult.rows[0]
            const selected = await this.getSelectedConcepts(client, studentId, concepts)
            if (selected.length !== concepts.length) throw new InvalidFormatError('Uno o más conceptos ya no están disponibles para pago')
            return this.replaceOverlappingCashReferences(client, guardianId, concepts)
        })
    }

    async findActiveCashReferences(guardianId: string) {
        const result = await this.db.query(`
            SELECT p."id", p."transactionReference" AS "referenceNumber", p."totalAmount", p."paidAt",
                   pi."concept", pi."appliedAmount", pi."pensionId", pi."enrollmentId",
                   CASE pi."concept"
                     WHEN 'enrollment_fee' THEN 'Matrícula ' || ep."academicYear"
                     WHEN 'tuition' THEN 'Pensión ' || to_char(pen."billingMonth", 'TMMonth YYYY')
                     WHEN 'late_fee' THEN 'Recargo por mora · ' || to_char(pen."billingMonth", 'TMMonth YYYY')
                   END AS "label"
            FROM "Payments" p
            JOIN "PaymentItems" pi ON pi."paymentId" = p."id" AND pi."status" = 'active'
            LEFT JOIN "Pensions" pen ON pen."id" = pi."pensionId"
            LEFT JOIN "Enrollments" e ON e."id" = COALESCE(pi."enrollmentId", pen."enrollmentId")
            LEFT JOIN "EnrollmentPeriods" ep ON ep."id" = e."periodId"
            WHERE p."payerGuardianId" = $1 AND p."method" = 'cash' AND p."status" = 'pending'
            ORDER BY p."paidAt" DESC, pi."id"
        `, [guardianId])
        const references = new Map<string, any>()
        for (const row of result.rows) {
            if (!references.has(row.id)) {
                references.set(row.id, {
                    id: row.id, referenceNumber: row.referenceNumber, totalAmount: row.totalAmount,
                    createdAt: row.paidAt, items: []
                })
            }
            references.get(row.id).items.push({
                concept: row.concept, label: row.label, appliedAmount: row.appliedAmount,
                pensionId: row.pensionId, enrollmentId: row.enrollmentId
            })
        }
        return [...references.values()]
    }

    private async replaceOverlappingCashReferences(client: any, guardianId: string, concepts: Array<{ id: string, concept: string }>) {
        const enrollmentIds = concepts.filter(item => item.concept === 'enrollment_fee').map(item => item.id)
        const pensionConcepts = concepts.filter(item => item.concept !== 'enrollment_fee')
        const pensionIds = pensionConcepts.map(item => item.id)
        const pensionTypes = pensionConcepts.map(item => item.concept)
        const replaced = await client.query(`
            SELECT DISTINCT p."id"
            FROM "Payments" p
            JOIN "PaymentItems" pi ON pi."paymentId" = p."id" AND pi."status" = 'active'
            WHERE p."payerGuardianId" = $1 AND p."method" = 'cash' AND p."status" = 'pending'
              AND (
                (pi."concept" = 'enrollment_fee' AND pi."enrollmentId" = ANY($2::uuid[]))
                OR EXISTS (
                    SELECT 1 FROM unnest($3::uuid[], $4::text[]) AS selected("id", "concept")
                    WHERE pi."pensionId" = selected."id" AND pi."concept" = selected."concept"
                )
              )
        `, [guardianId, enrollmentIds, pensionIds, pensionTypes])
        const paymentIds = replaced.rows.map(row => row.id)
        if (!paymentIds.length) return []
        await client.query(`UPDATE "PaymentItems" SET "status" = 'inactive', "updatedAt" = NOW()
            WHERE "paymentId" = ANY($1::uuid[]) AND "status" = 'active'`, [paymentIds])
        await client.query(`UPDATE "Payments" SET "status" = 'replaced', "updatedAt" = NOW()
            WHERE "id" = ANY($1::uuid[]) AND "status" = 'pending'`, [paymentIds])
        return paymentIds
    }

    async findPendingByReference(referenceNumber: string, schoolId: string) {
        const result = await this.db.query(`
            SELECT p."id", p."transactionReference" AS "referenceNumber", p."totalAmount", p."method", p."channel", p."status", p."paidAt",
                   st."id" AS "studentId", st."name" AS "studentName", st."documentType", st."documentNumber", e."fileNumber",
                   CASE pi."concept"
                     WHEN 'enrollment_fee' THEN 'Matrícula ' || ep."academicYear"
                     WHEN 'tuition' THEN 'Pensión ' || to_char(pen."billingMonth", 'TMMonth YYYY')
                     WHEN 'late_fee' THEN 'Recargo por mora · ' || to_char(pen."billingMonth", 'TMMonth YYYY')
                   END AS "label",
                   pi."concept", pi."appliedAmount", pi."pensionId", pi."enrollmentId"
            FROM "Payments" p
            JOIN "PaymentItems" pi ON pi."paymentId" = p."id" AND pi."status" = 'active'
            LEFT JOIN "Pensions" pen ON pen."id" = pi."pensionId"
            LEFT JOIN "Enrollments" e ON e."id" = COALESCE(pi."enrollmentId", pen."enrollmentId")
            LEFT JOIN "EnrollmentPeriods" ep ON ep."id" = e."periodId"
            LEFT JOIN "Students" st ON st."id" = e."studentId"
            WHERE p."transactionReference" = $1 AND p."schoolId" = $2 AND p."status" = 'pending'
            ORDER BY pi."id"
        `, [referenceNumber, schoolId])
        if (!result.rows.length) return null
        const { id, referenceNumber: reference, totalAmount, method, channel, status, paidAt } = result.rows[0]
        return { id, referenceNumber: reference, totalAmount, method, channel, status, paidAt,
            studentId: result.rows[0].studentId, studentName: result.rows[0].studentName, documentType: result.rows[0].documentType, documentNumber: result.rows[0].documentNumber, fileNumber: result.rows[0].fileNumber,
            items: result.rows.map(({ concept, label, appliedAmount, pensionId, enrollmentId }) => ({ concept, label, appliedAmount, pensionId, enrollmentId })) }
    }

    async registerSecretaryCash(input: { studentId: string, schoolId: string, registeredById: string, concepts: Array<{id:string,concept:string}>, amountReceived: number, referenceNumber?: string, observations?: string | null, paymentDate?: string }) {
        return this.db.transaction(async client => {
            await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [input.studentId])
            const studentResult = await client.query(`SELECT st."id", st."name", st."documentType", st."documentNumber", st."schoolId", u."email", s."name" AS "schoolName", sg."guardianId" FROM "Students" st JOIN "Schools" s ON s."id"=st."schoolId" LEFT JOIN "StudentGuardians" sg ON sg."studentId"=st."id" AND sg."isDeleted"=FALSE AND sg."isActive"=TRUE AND sg."isPaymentResponsible"=TRUE LEFT JOIN "Guardians" g ON g."id"=sg."guardianId" AND g."isDeleted"=FALSE AND g."isActive"=TRUE LEFT JOIN "Users" u ON u."id"=g."userId" WHERE st."id"=$1 AND st."schoolId"=$2 AND st."isDeleted"=FALSE LIMIT 1`, [input.studentId,input.schoolId])
            const student=studentResult.rows[0]
            if(!student) throw new InvalidFormatError('Estudiante no encontrado en este colegio')
            const paymentAt = input.paymentDate ? new Date(`${input.paymentDate}T12:00:00-05:00`) : new Date()
            let selected = await this.getSelectedConcepts(client,input.studentId,input.concepts)
            if(input.referenceNumber) {
                const ref=await client.query(`SELECT p."id",p."payerGuardianId" FROM "Payments" p WHERE p."transactionReference"=$1 AND p."schoolId"=$2 AND p."status"='pending' AND p."method"='cash'`,[input.referenceNumber,input.schoolId])
                if(!ref.rows[0] || ref.rows[0].payerGuardianId!==student.guardianId) throw new InvalidFormatError('La referencia no corresponde a este estudiante o ya fue procesada')
                const items=await client.query(`SELECT "concept", "enrollmentId", "pensionId" FROM "PaymentItems" WHERE "paymentId"=$1 AND "status"='active'`,[ref.rows[0].id])
                const refkeys=items.rows.map((i:any)=>`${i.concept==='enrollment_fee'?i.enrollmentId:i.pensionId}:${i.concept}`).sort()
                const keys=input.concepts.map(i=>`${i.id}:${i.concept}`).sort()
                if(JSON.stringify(refkeys)!==JSON.stringify(keys)) throw new InvalidFormatError('Los conceptos seleccionados no coinciden con la referencia')
                selected=items.rows.map((i:any)=>({id:i.enrollmentId||i.pensionId,concept:i.concept,amount:'0'})) as any
                const original=await client.query(`SELECT "totalAmount" FROM "Payments" WHERE "id"=$1`,[ref.rows[0].id])
                selected=await this.getSelectedConcepts(client,input.studentId,input.concepts)
                if(selected.length!==input.concepts.length) throw new InvalidFormatError('Los conceptos ya no están disponibles')
                const sum=selected.reduce((n:any,i:any)=>n+Number(i.amount),0)
                if(Number(input.amountReceived)<sum) throw new InvalidFormatError('El valor recibido es inferior al total a pagar')
                await client.query(`UPDATE "Payments" SET "status"='approved',"paidAt"=$3,"registeredById"=$2,"updatedAt"=NOW() WHERE "id"=$1`,[ref.rows[0].id,input.registeredById,paymentAt])
                input.referenceNumber=input.referenceNumber
                const paymentId=ref.rows[0].id
                return this.finalizeSecretaryReceipt(client,input,student,paymentId,selected,sum,paymentAt)
            }
            if(selected.length!==input.concepts.length) throw new InvalidFormatError('Uno o más conceptos ya no están disponibles')
            const total=selected.reduce((n,i)=>n+Number(i.amount),0)
            if(!Number.isFinite(input.amountReceived)||input.amountReceived<total) throw new InvalidFormatError('El valor recibido es inferior al total a pagar')
            if(!student.guardianId) throw new InvalidFormatError('El estudiante no tiene acudiente responsable de pagos')
            await this.replaceOverlappingCashReferences(client,student.guardianId,input.concepts)
            const paymentId=uuidv4()
            await client.query(`INSERT INTO "Payments" ("id","schoolId","payerGuardianId","registeredById","paidAt","totalAmount","method","channel","transactionReference","status") VALUES ($1,$2,$3,$4,$5,$6,'cash','in_person',NULL,'approved')`,[paymentId,input.schoolId,student.guardianId,input.registeredById,paymentAt,total.toFixed(2)])
            for(const item of selected) await client.query(`INSERT INTO "PaymentItems" ("id","schoolId","paymentId","concept","pensionId","enrollmentId","appliedAmount","status") VALUES ($1,$2,$3,$4,$5,$6,$7,'active')`,[uuidv4(),input.schoolId,paymentId,item.concept,item.concept==='enrollment_fee'?null:item.id,item.concept==='enrollment_fee'?item.id:null,item.amount])
            return this.finalizeSecretaryReceipt(client,input,student,paymentId,selected,total,paymentAt)
        })
    }

    private async finalizeSecretaryReceipt(client:any,input:any,student:any,paymentId:string,selected:any[],total:number,issuedAt:Date) {
        await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`receipt:${input.schoolId}`])
        const pensionIds = selected.filter(item => item.concept !== 'enrollment_fee').map(item => item.id)
        if (pensionIds.length) await client.query(`UPDATE "Pensions" pen SET "status" = CASE WHEN
            (pen."amount" - COALESCE((SELECT SUM(pi."appliedAmount") FROM "PaymentItems" pi JOIN "Payments" pay ON pay."id"=pi."paymentId" WHERE pi."pensionId"=pen."id" AND pi."concept"='tuition' AND pi."status"='active' AND pay."status"='approved'),0)) <= 0
            AND (pen."lateFee" - COALESCE((SELECT SUM(pi."appliedAmount") FROM "PaymentItems" pi JOIN "Payments" pay ON pay."id"=pi."paymentId" WHERE pi."pensionId"=pen."id" AND pi."concept"='late_fee' AND pi."status"='active' AND pay."status"='approved'),0)) <= 0 THEN 'paid' ELSE 'partial' END,
            "updatedAt"=NOW() WHERE pen."id"=ANY($1::uuid[])`, [pensionIds])
        const seq=await client.query(`SELECT COALESCE(MAX("number"),0)+1 AS "number" FROM "Receipts" WHERE "schoolId"=$1 AND "type"='payment'`,[input.schoolId])
        const number=String(seq.rows[0].number), receiptId=uuidv4(), reference=input.referenceNumber||number
        const pdf=createPaymentReceiptPdf({schoolName:student.schoolName,receiptNumber:number,referenceNumber:reference,date:issuedAt,studentName:student.name,studentDocument:student.documentNumber||'',concepts:selected.map(i=>({label:i.label,amount:i.amount})),totalAmount:total})
        const pdfUrl=`/api/v1/payments/receipts/${receiptId}`
        await client.query(`INSERT INTO "Receipts" ("id","schoolId","type","number","paymentId","enrollmentId","issuedAt","pdfUrl","pdfBase64","observations") VALUES ($1,$2,'payment',$3,$4,NULL,$5,$6,$7,$8)`,[receiptId,input.schoolId,number,paymentId,issuedAt,pdfUrl,pdf.toString('base64'),input.observations || null])
        return {paymentId,receiptId,receiptNumber:number,referenceNumber:reference,totalAmount:total.toFixed(2),changeAmount:(input.amountReceived-total).toFixed(2),downloadUrl:pdfUrl,pdf,toEmail:student.email,studentName:student.name,schoolId:input.schoolId,concepts:selected}
    }

    async getReceipt(receiptId:string, userId:string, role:string, schoolId:string) {
        const r=await this.db.query(`SELECT r."number",r."pdfBase64" FROM "Receipts" r JOIN "Payments" p ON p."id"=r."paymentId" LEFT JOIN "Guardians" g ON g."id"=p."payerGuardianId" WHERE r."id"=$1 AND (($2='Secretary' AND r."schoolId"=$3) OR ($2='Guardian' AND g."userId"=$4))`,[receiptId,role,schoolId,userId])
        return r.rows[0] ? {number:r.rows[0].number, pdf:Buffer.from(r.rows[0].pdfBase64,'base64')} : null
    }

    private async getSelectedConcepts(client: any, studentId: string, concepts: Array<{ id: string, concept: string }>): Promise<PaymentConcept[]> {
        const ids = [...new Set(concepts.map(item => item.id))]
        if (!ids.length || concepts.some(item => !['enrollment_fee', 'tuition', 'late_fee'].includes(item.concept))) return []
        const result = await client.query(`
            SELECT e."id", 'enrollment_fee' AS "concept", 'Matrícula ' || ep."academicYear" AS "label",
                   e."agreedFee"::text AS "amount",
                   ep."endDate"::date AS "dueDate", st."name" AS "studentName"
            FROM "Enrollments" e JOIN "EnrollmentPeriods" ep ON ep."id" = e."periodId"
            JOIN "Students" st ON st."id" = e."studentId"
            WHERE e."studentId" = $1 AND e."id" = ANY($2::uuid[]) AND e."isDeleted" = FALSE
              AND NOT EXISTS (SELECT 1 FROM "PaymentItems" pi JOIN "Payments" pay ON pay."id" = pi."paymentId"
                WHERE pi."enrollmentId" = e."id" AND pi."concept" = 'enrollment_fee' AND pi."status" = 'active'
                  AND pay."status" = 'approved')
            UNION ALL
            SELECT p."id", 'tuition', 'Pensión ' || to_char(p."billingMonth", 'TMMonth YYYY'),
                   GREATEST(p."amount" - COALESCE((SELECT SUM(pi."appliedAmount") FROM "PaymentItems" pi
                     JOIN "Payments" pay ON pay."id" = pi."paymentId" WHERE pi."pensionId" = p."id"
                     AND pi."concept" = 'tuition' AND pi."status" = 'active' AND pay."status" = 'approved'), 0), 0)::text,
                   p."dueDate"::date, st."name"
            FROM "Pensions" p JOIN "Enrollments" e ON e."id" = p."enrollmentId" JOIN "Students" st ON st."id" = e."studentId"
            WHERE e."studentId" = $1 AND p."id" = ANY($2::uuid[]) AND p."status" IN ('pending','overdue','partial') AND p."amount" > 0
            UNION ALL
            SELECT p."id", 'late_fee', 'Recargo por mora · ' || to_char(p."billingMonth", 'TMMonth YYYY'),
                   GREATEST(p."lateFee" - COALESCE((SELECT SUM(pi."appliedAmount") FROM "PaymentItems" pi
                     JOIN "Payments" pay ON pay."id" = pi."paymentId" WHERE pi."pensionId" = p."id"
                     AND pi."concept" = 'late_fee' AND pi."status" = 'active' AND pay."status" = 'approved'), 0), 0)::text,
                   p."dueDate"::date, st."name"
            FROM "Pensions" p JOIN "Enrollments" e ON e."id" = p."enrollmentId" JOIN "Students" st ON st."id" = e."studentId"
            WHERE e."studentId" = $1 AND p."id" = ANY($2::uuid[]) AND p."status" IN ('pending','overdue','partial') AND p."lateFee" > 0
        `, [studentId, ids])
        const byKey = new Map(result.rows.map((row: PaymentConcept) => [`${row.id}:${row.concept}`, row]))
        return concepts.map(item => byKey.get(`${item.id}:${item.concept}`)).filter(Boolean) as PaymentConcept[]
    }
}

export default PaymentRepository
