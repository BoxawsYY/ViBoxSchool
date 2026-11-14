import pg from 'pg'
import { DatabaseConfig } from '../config/database.config.js'
import { EntityRegistry } from '../metadata/orm.registry.js'
import { Metadata } from '../../metadata/Metadata.js'
import { METADATA_KEYS } from '../../metadata/keys.js'
import { EntityConfig, ColumnConfig, RelationConfig } from '../metadata/orm.metadata.js'

const { Pool } = pg

export class Database {
    private static instance: Database
    public pool: pg.Pool

    private constructor() {
        this.pool = new Pool({
            host: DatabaseConfig.host,
            port: DatabaseConfig.port,
            user: DatabaseConfig.user,
            password: DatabaseConfig.password,
            database: DatabaseConfig.database,
        })
    }

    public static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database()
        }
        return Database.instance
    }

    public async query(sql: string, params?: any[]): Promise<pg.QueryResult> {
        return this.pool.query(sql, params)
    }

    public async transaction<T>(callback: (client: pg.PoolClient) => Promise<T>): Promise<T> {
        const client = await this.pool.connect()
        try {
            await client.query('BEGIN')
            const result = await callback(client)
            await client.query('COMMIT')
            return result
        } catch (error) {
            try {
                await client.query('ROLLBACK')
            } catch (rollbackError) {
                console.error('[Database] Transaction rollback failed', rollbackError)
            }
            throw error
        } finally {
            client.release()
        }
    }

    private getDbType(colConfig: ColumnConfig): string {
        if (colConfig.type) {
            const mappings: Record<string, string> = {
                'string': 'TEXT',
                'number': 'INTEGER',
                'boolean': 'BOOLEAN',
                'date': 'TIMESTAMP',
                'uuid': 'UUID',
                'text': 'TEXT',
                'decimal': 'NUMERIC(12,2)',
                'bigint': 'BIGINT',
                'json': 'JSONB'
            }
            return mappings[colConfig.type] || 'TEXT'
        }
        if (colConfig.jsType) {
            if (colConfig.jsType === String) return 'TEXT'
            if (colConfig.jsType === Number) return 'INTEGER'
            if (colConfig.jsType === Boolean) return 'BOOLEAN'
            if (colConfig.jsType === Date) return 'TIMESTAMP'
        }
        return 'TEXT'
    }

    public async sync(): Promise<void> {
        await this.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";')

        const auditColumns = [
            `"status" TEXT NOT NULL DEFAULT 'Created'`,
            `"isActive" BOOLEAN NOT NULL DEFAULT TRUE`,
            `"isDeleted" BOOLEAN NOT NULL DEFAULT FALSE`,
            `"createdAt" TIMESTAMP NOT NULL DEFAULT (NOW())`,
            `"createdBy" TEXT NOT NULL DEFAULT 'System'`,
            `"updatedAt" TIMESTAMP NULL`,
            `"updatedBy" TEXT NULL`,
            `"deletedAt" TIMESTAMP NULL`,
            `"deletedBy" TEXT NULL`
        ]

        const rawAuditColumnNames = [
            'status', 'isActive', 'isDeleted', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy', 'deletedAt', 'deletedBy'
        ]

        for (const EntityClass of EntityRegistry) {
            const entityConfig: EntityConfig | undefined = Metadata.get(EntityClass, METADATA_KEYS.ENTITY)
            const columns: Record<string, ColumnConfig> = Metadata.get(EntityClass, METADATA_KEYS.COLUMNS) || {}
            const idField: string | undefined = Metadata.get(EntityClass, METADATA_KEYS.ID)

            if (!entityConfig) continue

            const tableName = entityConfig.tableName

            await this.query(`
                CREATE TABLE IF NOT EXISTS "${tableName}" (
                    _placeholder BOOLEAN
                )
            `)

            const existingColumnsQuery = await this.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = $1
            `, [tableName])

            const existingColumns = existingColumnsQuery.rows.map(r => r.column_name)

            for (const [propName, colConfig] of Object.entries(columns)) {
                const colName = colConfig.name || propName
                const dbType = this.getDbType(colConfig)

                if (!existingColumns.includes(colName)) {
                    let alterStr = `ALTER TABLE "${tableName}" ADD COLUMN "${colName}" ${dbType}`
                    if (colConfig.unique) alterStr += ' UNIQUE'
                    if (colConfig.nullable === false && propName !== idField) {
                        if (colConfig.default !== undefined) {
                            alterStr += ` NOT NULL DEFAULT '${colConfig.default}'`
                        } else {
                            // If we're adding a not null column to an existing table we need a safe default or it will fail
                        }
                    }
                    if (propName === idField) {
                        alterStr += ' PRIMARY KEY DEFAULT gen_random_uuid()'
                    }

                    await this.query(alterStr)
                    existingColumns.push(colName)
                }
            }

            for (const rawColName of rawAuditColumnNames) {
                if (!existingColumns.includes(rawColName)) {
                    const auditDef = auditColumns.find(ac => ac.startsWith(`"${rawColName}"`))
                    if (auditDef) {
                        await this.query(`ALTER TABLE "${tableName}" ADD COLUMN ${auditDef}`)
                        existingColumns.push(rawColName)
                    }
                }
            }

            if (existingColumns.includes('_placeholder')) {
                await this.query(`ALTER TABLE "${tableName}" DROP COLUMN _placeholder`)
            }
        }

        // Phase 2: Relations Sincronization
        for (const EntityClass of EntityRegistry) {
            const entityConfig: EntityConfig | undefined = Metadata.get(EntityClass, METADATA_KEYS.ENTITY)
            const relations: Record<string, RelationConfig> = Metadata.get(EntityClass, METADATA_KEYS.RELATIONS) || {}

            if (!entityConfig) continue
            const tableName = entityConfig.tableName

            for (const [propName, relConfig] of Object.entries(relations)) {
                const targetClass = relConfig.target()
                const targetEntityConfig: EntityConfig | undefined = Metadata.get(targetClass, METADATA_KEYS.ENTITY)
                if (!targetEntityConfig) continue

                const targetTableName = targetEntityConfig.tableName
                const targetIdField = Metadata.get(targetClass, METADATA_KEYS.ID) || 'id'

                if (relConfig.type === 'ManyToOne' || (relConfig.type === 'OneToOne' && !relConfig.inverse)) {
                    const colName = relConfig.joinColumn || `${propName}Id`

                    const existingColumnsQuery = await this.query(`
                        SELECT column_name 
                        FROM information_schema.columns 
                        WHERE table_name = $1
                    `, [tableName])
                    const existingColumns = existingColumnsQuery.rows.map(r => r.column_name)

                    if (!existingColumns.includes(colName)) {
                        let alterStr = `ALTER TABLE "${tableName}" ADD COLUMN "${colName}" UUID`
                        if (relConfig.type === 'OneToOne') alterStr += ' UNIQUE'
                        await this.query(alterStr)

                        const constraintName = `fk_${tableName}_${colName}_${targetTableName}`

                        // Validar si el constraint ya existe
                        const existingConstraintsQuery = await this.query(`
                            SELECT constraint_name 
                            FROM information_schema.table_constraints 
                            WHERE table_name = $1 AND constraint_name = $2
                        `, [tableName, constraintName])

                        if (existingConstraintsQuery.rows.length === 0) {
                            await this.query(`
                                ALTER TABLE "${tableName}"
                                ADD CONSTRAINT "${constraintName}"
                                FOREIGN KEY ("${colName}")
                                REFERENCES "${targetTableName}" ("${targetIdField}")
                                ON DELETE SET NULL
                            `)
                        }
                    }
                } else if (relConfig.type === 'ManyToMany') {
                    let joinTableName = ''
                    let selfIdCol = ''
                    let targetIdCol = ''

                    if (typeof relConfig.joinTable === 'string') {
                        joinTableName = relConfig.joinTable
                        selfIdCol = `${tableName}Id`
                        targetIdCol = `${targetTableName}Id`
                    } else if (typeof relConfig.joinTable === 'object' && relConfig.joinTable !== null) {
                        joinTableName = relConfig.joinTable.name || [tableName, targetTableName].sort().join('')
                        selfIdCol = relConfig.joinTable.joinColumn || `${tableName}Id`
                        targetIdCol = relConfig.joinTable.inverseJoinColumn || `${targetTableName}Id`
                    } else {
                        joinTableName = [tableName, targetTableName].sort().join('')
                        selfIdCol = `${tableName}Id`
                        targetIdCol = `${targetTableName}Id`
                    }

                    const idField = Metadata.get(EntityClass, METADATA_KEYS.ID) || 'id'

                    // We wrap in a block to hide errors from "relation already exists"
                    const createJoinTableSql = `
                        CREATE TABLE IF NOT EXISTS "${joinTableName}" (
                            "${selfIdCol}" UUID NOT NULL,
                            "${targetIdCol}" UUID NOT NULL,
                            PRIMARY KEY ("${selfIdCol}", "${targetIdCol}"),
                            CONSTRAINT "fk_${joinTableName}_${selfIdCol}" FOREIGN KEY ("${selfIdCol}") REFERENCES "${tableName}" ("${idField}") ON DELETE CASCADE,
                            CONSTRAINT "fk_${joinTableName}_${targetIdCol}" FOREIGN KEY ("${targetIdCol}") REFERENCES "${targetTableName}" ("${targetIdField}") ON DELETE CASCADE
                        )
                    `
                    try {
                        await this.query(createJoinTableSql)
                    } catch (e: any) {
                        // ignore constraint duplicate issues from reverse relationship passes
                    }
                }
            }
        }
    }
}
