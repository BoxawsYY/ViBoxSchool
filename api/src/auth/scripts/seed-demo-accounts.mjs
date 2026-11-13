import 'dotenv/config'
import bcrypt from 'bcrypt'
import pg from 'pg'
import { randomUUID } from 'node:crypto'

const { Pool } = pg
const password = process.env.VIBOX_DEMO_PASSWORD

if (!password || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)) {
    throw new Error('VIBOX_DEMO_PASSWORD debe tener mínimo 8 caracteres, mayúscula, minúscula, número y símbolo')
}

const demoAccounts = [
    { role: 'Guardian', alias: 'Padre de familia', name: 'María Fernanda Ortiz', username: 'demo.padre' },
    { role: 'Secretary', alias: 'Secretaría', name: 'Laura Gómez', username: 'demo.secretaria' },
    { role: 'Rector', alias: 'Rector', name: 'Andrés Villarreal', username: 'demo.rector' },
    { role: 'Admin', alias: 'Administrador', name: 'Camila Restrepo', username: 'demo.admin' }
]

const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionTimeoutMillis: 10000
})

const client = await pool.connect()

try {
    await client.query('BEGIN')

    const roles = new Map()
    for (const account of demoAccounts) {
        const found = await client.query(`
            SELECT "id" FROM "Roles"
            WHERE "name" = $1 AND "isDeleted" = FALSE
            ORDER BY "isActive" DESC
            LIMIT 1
        `, [account.role])
        let roleId = found.rows[0]?.id

        if (roleId) {
            await client.query(`
                UPDATE "Roles"
                SET "alias" = $1, "status" = 'active', "isActive" = TRUE, "isDeleted" = FALSE
                WHERE "id" = $2
            `, [account.alias, roleId])
        } else {
            roleId = randomUUID()
            await client.query(`
                INSERT INTO "Roles" ("id", "name", "alias", "description", "status", "isActive", "isDeleted")
                VALUES ($1, $2, $3, $4, 'active', TRUE, FALSE)
            `, [roleId, account.role, account.alias, `Acceso de ${account.alias} en ViBoxSchool`])
        }
        roles.set(account.role, roleId)
    }

    let dashboardPermission = await client.query(`
        SELECT "id" FROM "Permissions"
        WHERE "name" = 'AccessDashboard' AND "isDeleted" = FALSE
        ORDER BY "isActive" DESC
        LIMIT 1
    `)
    let permissionId = dashboardPermission.rows[0]?.id
    if (!permissionId) {
        permissionId = randomUUID()
        await client.query(`
            INSERT INTO "Permissions" ("id", "name", "alias", "description", "type", "status", "isActive", "isDeleted")
            VALUES ($1, 'AccessDashboard', 'Acceso al panel', 'Permite acceder al panel principal.', 'Access', 'active', TRUE, FALSE)
        `, [permissionId])
    } else {
        await client.query(`
            UPDATE "Permissions" SET "isActive" = TRUE, "isDeleted" = FALSE
            WHERE "id" = $1
        `, [permissionId])
    }

    for (const roleId of roles.values()) {
        await client.query(`
            INSERT INTO "RolesPermissions" ("roleId", "permissionId")
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
        `, [roleId, permissionId])
    }

    const passwordHash = await bcrypt.hash(password, 10)
    for (const account of demoAccounts) {
        const email = `${account.username}@demo.viboxschool.local`
        const userResult = await client.query(`
            INSERT INTO "Users"
                ("id", "name", "username", "email", "password", "registerDate",
                 "isAuthorized", "isOnline", "isActive", "isDeleted")
            VALUES ($1, $2, $3, $4, $5, NOW(), TRUE, FALSE, TRUE, FALSE)
            ON CONFLICT ("username") DO UPDATE SET
                "name" = EXCLUDED."name",
                "email" = EXCLUDED."email",
                "password" = EXCLUDED."password",
                "isAuthorized" = TRUE,
                "isActive" = TRUE,
                "isDeleted" = FALSE,
                "updatedAt" = NOW()
            RETURNING "id"
        `, [randomUUID(), account.name, account.username, email, passwordHash])

        const userId = userResult.rows[0].id
        await client.query('DELETE FROM "UsersRoles" WHERE "userId" = $1', [userId])
        await client.query(`
            INSERT INTO "UsersRoles" ("userId", "roleId")
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
        `, [userId, roles.get(account.role)])
    }

    await client.query('COMMIT')
    console.log(`Seeded ${demoAccounts.length} role demo accounts.`)
} catch (error) {
    await client.query('ROLLBACK')
    console.error(`Demo account seeding failed: ${error.message}`)
    process.exitCode = 1
} finally {
    client.release()
    await pool.end()
}
