import { v4 as uuidv4 } from 'uuid'
import { Repository } from '../../core/decorators/decorators.js'
import BaseRepository from '../../core/orm/repository/Base.repository.js'
import User from '../../auth/entities/User.entity.js'
import { ROLES } from '../../auth/constants/authorities.js'
import { MANAGED_ROLES, USER_STATUS } from '../constants/globalUsers.js'

export interface GlobalUserFilters {
    search?: string
    role?: string
    schoolId?: string
    status?: string
    limit: number
    offset: number
}

export interface GlobalUserData {
    name: string
    username: string
    email: string
    documentType?: string | null
    documentNumber?: string | null
    phoneNumber?: string | null
    gender?: string | null
    birthdate?: string | null
    country?: string | null
    city?: string | null
    address?: string | null
    image?: string | null
    schoolId: string | null
    roleId: string
    roleName: string
    studentId?: string | null
    relationship?: string | null
    password?: string
}

const SELECT_USER = `
    SELECT u."id", u."name", u."username", u."email", u."documentType", u."documentNumber",
        u."phoneNumber", u."gender", u."birthdate", u."country", u."city", u."address", u."image",
        u."isAuthorized", u."lastLogin", u."registerDate", u."schoolId",
        s."name" AS "schoolName", s."brandColor" AS "schoolBrandColor",
        r."name" AS "role", r."alias" AS "roleAlias",
        link."studentId", link."studentName", link."relationship"
    FROM "Users" u
    JOIN "UsersRoles" ur ON ur."userId" = u."id"
    JOIN "Roles" r ON r."id" = ur."roleId"
    LEFT JOIN "Schools" s ON s."id" = u."schoolId"
    LEFT JOIN LATERAL (
        SELECT st."id" AS "studentId", st."name" AS "studentName", sg."relationship"
        FROM "Guardians" g
        JOIN "StudentGuardians" sg ON sg."guardianId" = g."id" AND sg."isDeleted" = FALSE
        JOIN "Students" st ON st."id" = sg."studentId" AND st."isDeleted" = FALSE
        WHERE g."userId" = u."id" AND g."isDeleted" = FALSE
        ORDER BY sg."createdAt" DESC
        LIMIT 1
    ) link ON TRUE
`

@Repository()
export class GlobalUserRepository extends BaseRepository<User> {

    constructor() {
        super(User)
    }

    /** Lista paginada con filtros. Solo usuarios no eliminados con un rol gestionado. */
    async list(filters: GlobalUserFilters) {
        const conditions = ['u."isDeleted" = FALSE', 'r."name" = ANY($1)']
        const params: any[] = [[...MANAGED_ROLES]]

        if (filters.search) {
            params.push(`%${filters.search}%`)
            conditions.push(`(u."name" ILIKE $${params.length} OR u."email" ILIKE $${params.length} OR u."username" ILIKE $${params.length})`)
        }
        if (filters.role) {
            params.push(filters.role)
            conditions.push(`r."name" = $${params.length}`)
        }
        if (filters.schoolId === 'platform') {
            conditions.push('u."schoolId" IS NULL')
        } else if (filters.schoolId) {
            params.push(filters.schoolId)
            conditions.push(`u."schoolId" = $${params.length}`)
        }
        if (filters.status === USER_STATUS.ACTIVE) conditions.push('u."isAuthorized" = TRUE')
        if (filters.status === USER_STATUS.BLOCKED) conditions.push('u."isAuthorized" = FALSE')

        params.push(filters.limit, filters.offset)

        const result = await this.db.query(`
            ${SELECT_USER.replace('SELECT', 'SELECT COUNT(*) OVER()::INTEGER AS "total",')}
            WHERE ${conditions.join(' AND ')}
            ORDER BY u."name" ASC
            LIMIT $${params.length - 1} OFFSET $${params.length}
        `, params)

        return {
            rows: result.rows,
            total: result.rows[0]?.total ?? 0
        }
    }

    /** Conteos por rol para las tarjetas del encabezado. */
    async summary() {
        const result = await this.db.query(`
            SELECT r."name" AS "role",
                COUNT(DISTINCT u."id")::INTEGER AS "users",
                COUNT(DISTINCT u."schoolId")::INTEGER AS "schools"
            FROM "Users" u
            JOIN "UsersRoles" ur ON ur."userId" = u."id"
            JOIN "Roles" r ON r."id" = ur."roleId"
            WHERE u."isDeleted" = FALSE AND r."name" = ANY($1)
            GROUP BY r."name"
        `, [[...MANAGED_ROLES]])

        return result.rows
    }

    async findDetail(id: string) {
        const result = await this.db.query(`
            ${SELECT_USER}
            WHERE u."id" = $1 AND u."isDeleted" = FALSE AND r."name" = ANY($2)
            LIMIT 1
        `, [id, [...MANAGED_ROLES]])

        return result.rows[0] || null
    }

    async findRoleByName(name: string) {
        const result = await this.db.query(`
            SELECT "id", "name", "alias" FROM "Roles"
            WHERE "name" = $1 AND "isDeleted" = FALSE
            LIMIT 1
        `, [name])

        return result.rows[0] || null
    }

    async findSchool(id: string) {
        const result = await this.db.query(`
            SELECT "id", "name", "status", "isActive" FROM "Schools"
            WHERE "id" = $1 AND "isDeleted" = FALSE
            LIMIT 1
        `, [id])

        return result.rows[0] || null
    }

    /** Estudiantes (no eliminados) de un colegio, para asociarlos a un Padre de familia. */
    async findStudentsBySchool(schoolId: string) {
        const result = await this.db.query(`
            SELECT st."id", st."name", st."documentType", st."documentNumber"
            FROM "Students" st
            WHERE st."schoolId" = $1 AND st."isDeleted" = FALSE
            ORDER BY st."name" ASC
        `, [schoolId])

        return result.rows
    }

    async findStudent(id: string) {
        const result = await this.db.query(`
            SELECT "id", "name", "schoolId" FROM "Students"
            WHERE "id" = $1 AND "isDeleted" = FALSE
            LIMIT 1
        `, [id])

        return result.rows[0] || null
    }

    /**
     * Busca otro usuario que ya use ese valor como correo o como username.
     * Incluye eliminados porque el username tiene restricción UNIQUE en la BD.
     */
    async findByLogin(value: string, excludeId?: string) {
        const result = await this.db.query(`
            SELECT "id", "isDeleted" FROM "Users"
            WHERE (LOWER("email") = LOWER($1) OR LOWER("username") = LOWER($1))
                AND ($2::UUID IS NULL OR "id" <> $2::UUID)
            LIMIT 1
        `, [value, excludeId ?? null])

        return result.rows[0] || null
    }

    /** Rector activo (no eliminado) del colegio, excluyendo opcionalmente un usuario. */
    async findRectorOfSchool(schoolId: string, excludeId?: string) {
        const result = await this.db.query(`
            SELECT u."id", u."name" FROM "Users" u
            JOIN "UsersRoles" ur ON ur."userId" = u."id"
            JOIN "Roles" r ON r."id" = ur."roleId"
            WHERE r."name" = $1 AND u."schoolId" = $2 AND u."isDeleted" = FALSE
                AND ($3::UUID IS NULL OR u."id" <> $3::UUID)
            LIMIT 1
        `, [ROLES.RECTOR, schoolId, excludeId ?? null])

        return result.rows[0] || null
    }

    /** Cantidad de administradores activos (no eliminados ni bloqueados). */
    async countActiveAdmins(excludeId?: string) {
        const result = await this.db.query(`
            SELECT COUNT(DISTINCT u."id")::INTEGER AS "count" FROM "Users" u
            JOIN "UsersRoles" ur ON ur."userId" = u."id"
            JOIN "Roles" r ON r."id" = ur."roleId"
            WHERE r."name" = $1 AND u."isDeleted" = FALSE AND u."isAuthorized" = TRUE
                AND ($2::UUID IS NULL OR u."id" <> $2::UUID)
        `, [ROLES.ADMIN, excludeId ?? null])

        return result.rows[0]?.count ?? 0
    }

    /** Crea usuario + rol (+ registro de acudiente si es Padre) en una transacción. */
    async createUser(data: GlobalUserData, createdBy: string) {
        const userId = uuidv4()

        await this.db.transaction(async (client) => {
            await client.query(`
                INSERT INTO "Users"
                    ("id", "name", "username", "email", "password", "documentType", "documentNumber",
                     "phoneNumber", "gender", "birthdate", "country", "city", "address", "image",
                     "schoolId", "registerDate", "isAuthorized", "isOnline", "isActive", "isDeleted", "createdBy")
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(),
                    TRUE, FALSE, TRUE, FALSE, $16)
            `, [
                userId, data.name, data.username, data.email, data.password,
                data.documentType ?? null, data.documentNumber ?? null, data.phoneNumber ?? null,
                data.gender ?? null, data.birthdate ?? null, data.country ?? null, data.city ?? null,
                data.address ?? null, data.image ?? null, data.schoolId, createdBy
            ])

            await client.query(`
                INSERT INTO "UsersRoles" ("userId", "roleId") VALUES ($1, $2)
            `, [userId, data.roleId])

            if (data.roleName === ROLES.GUARDIAN) {
                const guardianId = await this.ensureGuardian(client, userId, data)
                await this.linkStudent(client, guardianId, data, createdBy)
            }
        })

        return this.findDetail(userId)
    }

    /** Actualiza datos, rol, colegio y opcionalmente contraseña en una transacción. */
    async updateUser(id: string, data: GlobalUserData, updatedBy: string) {
        await this.db.transaction(async (client) => {
            const params: any[] = [
                data.name, data.username, data.email, data.documentType ?? null,
                data.documentNumber ?? null, data.phoneNumber ?? null, data.gender ?? null,
                data.birthdate ?? null, data.country ?? null, data.city ?? null,
                data.address ?? null, data.image ?? null, data.schoolId, updatedBy
            ]
            let passwordSql = ''
            if (data.password) {
                params.push(data.password)
                passwordSql = `, "password" = $${params.length}`
            }
            params.push(id)

            await client.query(`
                UPDATE "Users" SET
                    "name" = $1, "username" = $2, "email" = $3, "documentType" = $4,
                    "documentNumber" = $5, "phoneNumber" = $6, "gender" = $7, "birthdate" = $8,
                    "country" = $9, "city" = $10, "address" = $11, "image" = $12, "schoolId" = $13,
                    "updatedBy" = $14, "updatedAt" = NOW() ${passwordSql}
                WHERE "id" = $${params.length}
            `, params)

            // Un usuario = un rol: se reemplaza el rol gestionado actual.
            await client.query(`
                DELETE FROM "UsersRoles"
                WHERE "userId" = $1 AND "roleId" IN (SELECT "id" FROM "Roles" WHERE "name" = ANY($2))
            `, [id, [...MANAGED_ROLES]])
            await client.query(`
                INSERT INTO "UsersRoles" ("userId", "roleId") VALUES ($1, $2)
                ON CONFLICT DO NOTHING
            `, [id, data.roleId])

            if (data.roleName === ROLES.GUARDIAN) {
                const guardianId = await this.ensureGuardian(client, id, data)
                await this.linkStudent(client, guardianId, data, updatedBy)
            } else {
                // Si deja de ser Padre, se desactivan su registro de acudiente y sus estudiantes.
                await this.removeGuardian(client, id, updatedBy)
            }
        })

        return this.findDetail(id)
    }

    async setAuthorized(id: string, isAuthorized: boolean, updatedBy: string) {
        await this.db.query(`
            UPDATE "Users" SET "isAuthorized" = $1, "isOnline" = CASE WHEN $1 THEN "isOnline" ELSE FALSE END,
                "updatedBy" = $2, "updatedAt" = NOW()
            WHERE "id" = $3
        `, [isAuthorized, updatedBy, id])

        return this.findDetail(id)
    }

    /** Borrado lógico del usuario y de su registro de acudiente, si existe. */
    async softDelete(id: string, deletedBy: string) {
        await this.db.transaction(async (client) => {
            await client.query(`
                UPDATE "Users" SET "isDeleted" = TRUE, "isOnline" = FALSE,
                    "deletedAt" = NOW(), "deletedBy" = $1
                WHERE "id" = $2
            `, [deletedBy, id])
            await this.removeGuardian(client, id, deletedBy)
        })
    }

    private async ensureGuardian(client: any, userId: string, data: GlobalUserData) {
        const existing = await client.query(`SELECT "id" FROM "Guardians" WHERE "userId" = $1 LIMIT 1`, [userId])

        if (existing.rows[0]) {
            await client.query(`
                UPDATE "Guardians" SET "phone" = $1, "address" = $2, "isDeleted" = FALSE,
                    "deletedAt" = NULL, "deletedBy" = NULL, "updatedAt" = NOW()
                WHERE "userId" = $3
            `, [data.phoneNumber ?? null, data.address ?? null, userId])
            return existing.rows[0].id as string
        }

        const guardianId = uuidv4()
        await client.query(`
            INSERT INTO "Guardians"
                ("id", "userId", "whatsapp", "phone", "address", "emailNotifications",
                 "whatsappNotifications", "status", "isActive", "isDeleted")
            VALUES ($1, $2, $3, $3, $4, TRUE, TRUE, 'active', TRUE, FALSE)
        `, [guardianId, userId, data.phoneNumber ?? null, data.address ?? null])
        return guardianId
    }

    /**
     * Asocia el acudiente a su estudiante (un estudiante por Padre en este módulo).
     * Las asociaciones anteriores con otros estudiantes se desactivan (borrado lógico).
     */
    private async linkStudent(client: any, guardianId: string, data: GlobalUserData, actor: string) {
        await client.query(`
            UPDATE "StudentGuardians"
            SET "isDeleted" = TRUE, "deletedAt" = NOW(), "deletedBy" = $1
            WHERE "guardianId" = $2 AND "studentId" <> $3 AND "isDeleted" = FALSE
        `, [actor, guardianId, data.studentId])

        const current = await client.query(`
            SELECT "id" FROM "StudentGuardians"
            WHERE "guardianId" = $1 AND "studentId" = $2
            ORDER BY "isDeleted" ASC
            LIMIT 1
        `, [guardianId, data.studentId])

        if (current.rows[0]) {
            await client.query(`
                UPDATE "StudentGuardians"
                SET "relationship" = $1, "schoolId" = $2, "isDeleted" = FALSE,
                    "deletedAt" = NULL, "deletedBy" = NULL, "updatedAt" = NOW(), "updatedBy" = $3
                WHERE "id" = $4
            `, [data.relationship, data.schoolId, actor, current.rows[0].id])
            return
        }

        await client.query(`
            INSERT INTO "StudentGuardians"
                ("id", "schoolId", "studentId", "guardianId", "relationship",
                 "isPaymentResponsible", "status", "isActive", "isDeleted", "createdBy")
            VALUES ($1, $2, $3, $4, $5, TRUE, 'active', TRUE, FALSE, $6)
        `, [uuidv4(), data.schoolId, data.studentId, guardianId, data.relationship, actor])
    }

    /** Desactiva el registro de acudiente del usuario y sus asociaciones con estudiantes. */
    private async removeGuardian(client: any, userId: string, actor: string) {
        await client.query(`
            UPDATE "StudentGuardians" SET "isDeleted" = TRUE, "deletedAt" = NOW(), "deletedBy" = $1
            WHERE "isDeleted" = FALSE AND "guardianId" IN (SELECT "id" FROM "Guardians" WHERE "userId" = $2)
        `, [actor, userId])
        await client.query(`
            UPDATE "Guardians" SET "isDeleted" = TRUE, "deletedAt" = NOW(), "deletedBy" = $1
            WHERE "userId" = $2 AND "isDeleted" = FALSE
        `, [actor, userId])
    }
}

export default GlobalUserRepository
