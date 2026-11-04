import { v4 as uuidv4 } from 'uuid'
import { Database } from '../database/Database.js'
import { Metadata } from '../../metadata/Metadata.js'
import { METADATA_KEYS } from '../../metadata/keys.js'
import { EntityConfig, RelationConfig } from '../metadata/orm.metadata.js'

export interface FindOptions {
    relations?: boolean | string[]
}

export interface QueryOptions extends FindOptions {
    where?: Record<string, any>
    select?: string[]
    orderBy?: { field: string, direction: 'ASC' | 'DESC' }
    limit?: number
    offset?: number
}

export class BaseRepository<T extends { id?: string;[key: string]: any }> {
    protected db: Database
    protected tableName: string
    protected entityClass: any

    constructor(entityClass: any) {
        this.entityClass = entityClass
        this.db = Database.getInstance()

        const entityConfig: EntityConfig | undefined = Metadata.get(entityClass, METADATA_KEYS.ENTITY)
        if (!entityConfig) {
            throw new Error(`Class ${entityClass.name} is not decorated with @Entity`)
        }
        this.tableName = entityConfig.tableName
    }

    private async loadRelations(entities: T[], relationsOption?: boolean | string[]): Promise<void> {
        if (entities.length === 0) return;
        const relations: Record<string, RelationConfig> = Metadata.get(this.entityClass, METADATA_KEYS.RELATIONS) || {};
        if (Object.keys(relations).length === 0) return;

        const selfIdField = Metadata.get(this.entityClass, METADATA_KEYS.ID) || 'id';
        const entityIds = entities.map(e => e[selfIdField]);

        for (const [propName, relConfig] of Object.entries(relations)) {
            let shouldLoad = false;
            if (typeof relationsOption === 'boolean' && relationsOption) {
                shouldLoad = true;
            } else if (Array.isArray(relationsOption) && relationsOption.includes(propName)) {
                shouldLoad = true;
            } else if (relConfig.eager) {
                shouldLoad = true;
            }
            if (!shouldLoad) continue;

            const targetClass = relConfig.target();
            const targetEntityConfig: EntityConfig | undefined = Metadata.get(targetClass, METADATA_KEYS.ENTITY);
            if (!targetEntityConfig) continue;

            const targetTableName = targetEntityConfig.tableName;
            const targetIdField = Metadata.get(targetClass, METADATA_KEYS.ID) || 'id';

            if (relConfig.type === 'ManyToOne' || (relConfig.type === 'OneToOne' && !relConfig.inverse)) {
                const fkCol = relConfig.joinColumn || `${propName}Id`;
                const targetIdsToFetch = Array.from(new Set(entities.map(e => e[fkCol]).filter(Boolean)));
                if (targetIdsToFetch.length === 0) {
                    entities.forEach((e: any) => e[propName] = null);
                    continue;
                }

                const placeholders = targetIdsToFetch.map((_, i) => `$${i + 1}`).join(',');
                const sql = `SELECT * FROM "${targetTableName}" WHERE "${targetIdField}" IN (${placeholders})`;
                const result = await this.db.query(sql, targetIdsToFetch);

                const targetMap = new Map();
                result.rows.forEach(te => targetMap.set(te[targetIdField], te));

                for (const entity of entities) {
                    const fkVal = entity[fkCol];
                    (entity as any)[propName] = (fkVal && targetMap.has(fkVal)) ? targetMap.get(fkVal) : null;
                }
            } else if (relConfig.type === 'OneToMany' || (relConfig.type === 'OneToOne' && relConfig.inverse)) {
                const fkCol = relConfig.inverse || `${this.tableName}Id`;

                const placeholders = entityIds.map((_, i) => `$${i + 1}`).join(',');
                const sql = `SELECT * FROM "${targetTableName}" WHERE "${fkCol}" IN (${placeholders})`;
                const result = await this.db.query(sql, entityIds);

                for (const entity of entities) {
                    const matched = result.rows.filter(te => te[fkCol] === (entity as any)[selfIdField]);
                    (entity as any)[propName] = relConfig.type === 'OneToOne' ? (matched[0] || null) : matched;
                }
            } else if (relConfig.type === 'ManyToMany') {
                let joinTableName = '';
                let selfIdCol = '';
                let targetIdCol = '';

                if (typeof relConfig.joinTable === 'string') {
                    joinTableName = relConfig.joinTable;
                    selfIdCol = `${this.tableName}Id`;
                    targetIdCol = `${targetTableName}Id`;
                } else if (typeof relConfig.joinTable === 'object' && relConfig.joinTable !== null) {
                    joinTableName = relConfig.joinTable.name || [this.tableName, targetTableName].sort().join('');
                    selfIdCol = relConfig.joinTable.joinColumn || `${this.tableName}Id`;
                    targetIdCol = relConfig.joinTable.inverseJoinColumn || `${targetTableName}Id`;
                } else {
                    joinTableName = [this.tableName, targetTableName].sort().join('');
                    selfIdCol = `${this.tableName}Id`;
                    targetIdCol = `${targetTableName}Id`;
                }

                const placeholders = entityIds.map((_, i) => `$${i + 1}`).join(',');
                const joinSql = `SELECT "${selfIdCol}", "${targetIdCol}" FROM "${joinTableName}" WHERE "${selfIdCol}" IN (${placeholders})`;
                let joinResult;
                try {
                    joinResult = await this.db.query(joinSql, entityIds);
                } catch (e: any) { continue; } // Handle case where table is not yet synced

                const joinRows = joinResult.rows;
                const targetIdsToFetch = Array.from(new Set(joinRows.map(r => r[targetIdCol])));

                if (targetIdsToFetch.length === 0) {
                    entities.forEach((e: any) => e[propName] = []);
                    continue;
                }

                const trgPlh = targetIdsToFetch.map((_, i) => `$${i + 1}`).join(',');
                const targetSql = `SELECT * FROM "${targetTableName}" WHERE "${targetIdField}" IN (${trgPlh})`;
                const targetResult = await this.db.query(targetSql, targetIdsToFetch);

                const targetMap = new Map();
                targetResult.rows.forEach(te => targetMap.set(te[targetIdField], te));

                for (const entity of entities) {
                    const matchedJoinRows = joinRows.filter(jr => jr[selfIdCol] === (entity as any)[selfIdField]);
                    (entity as any)[propName] = matchedJoinRows.map(jr => targetMap.get(jr[targetIdCol])).filter(Boolean);
                }
            }
        }
    }

    private async syncRelations(entityId: string, data: Partial<T>) {
        const relations: Record<string, RelationConfig> = Metadata.get(this.entityClass, METADATA_KEYS.RELATIONS) || {};

        for (const [propName, relConfig] of Object.entries(relations)) {
            if (data[propName] === undefined) continue;

            if (relConfig.type === 'ManyToMany') {
                const targetElements = data[propName] as any[];
                if (!Array.isArray(targetElements)) continue;

                const targetClass = relConfig.target();
                const targetEntityConfig: EntityConfig | undefined = Metadata.get(targetClass, METADATA_KEYS.ENTITY);
                if (!targetEntityConfig) continue;

                const targetTableName = targetEntityConfig.tableName;
                const targetIdField = Metadata.get(targetClass, METADATA_KEYS.ID) || 'id';

                let joinTableName = '';
                let selfIdCol = '';
                let targetIdCol = '';

                if (typeof relConfig.joinTable === 'string') {
                    joinTableName = relConfig.joinTable;
                    selfIdCol = `${this.tableName}Id`;
                    targetIdCol = `${targetTableName}Id`;
                } else if (typeof relConfig.joinTable === 'object' && relConfig.joinTable !== null) {
                    joinTableName = relConfig.joinTable.name || [this.tableName, targetTableName].sort().join('');
                    selfIdCol = relConfig.joinTable.joinColumn || `${this.tableName}Id`;
                    targetIdCol = relConfig.joinTable.inverseJoinColumn || `${targetTableName}Id`;
                } else {
                    joinTableName = [this.tableName, targetTableName].sort().join('');
                    selfIdCol = `${this.tableName}Id`;
                    targetIdCol = `${targetTableName}Id`;
                }

                try {
                    const existingJoinRowsResult = await this.db.query(`SELECT "${targetIdCol}" FROM "${joinTableName}" WHERE "${selfIdCol}" = $1`, [entityId]);
                    const existingIds = existingJoinRowsResult.rows.map(r => r[targetIdCol]);

                    const newIds = targetElements.map(te => te[targetIdField]).filter(Boolean);

                    const toDelete = existingIds.filter(id => !newIds.includes(id));
                    const toInsert = newIds.filter(id => !existingIds.includes(id));

                    if (toDelete.length > 0) {
                        const placeholders = toDelete.map((_, i) => `$${i + 2}`).join(',');
                        await this.db.query(`DELETE FROM "${joinTableName}" WHERE "${selfIdCol}" = $1 AND "${targetIdCol}" IN (${placeholders})`, [entityId, ...toDelete]);
                    }

                    if (toInsert.length > 0) {
                        const values = [];
                        const rowPlaceholders = [];
                        let pIndex = 1;
                        for (const id of toInsert) {
                            rowPlaceholders.push(`($${pIndex}, $${pIndex + 1})`);
                            values.push(entityId, id);
                            pIndex += 2;
                        }
                        await this.db.query(`INSERT INTO "${joinTableName}" ("${selfIdCol}", "${targetIdCol}") VALUES ${rowPlaceholders.join(',')}`, values);
                    }
                } catch (e: any) { } // Suppress errors if table doesn't exist yet before sync
            }
        }
    }

    public async findAll(includeDeleted = false, options?: FindOptions): Promise<T[]> {
        let sql = `SELECT * FROM "${this.tableName}"`
        if (!includeDeleted) {
            sql += ` WHERE "isDeleted" = FALSE`
        }
        const result = await this.db.query(sql)
        const entities = result.rows as T[]
        await this.loadRelations(entities, options?.relations)
        return entities
    }

    public async findById(id: string, includeDeleted = false, options?: FindOptions): Promise<T | null> {
        let sql = `SELECT * FROM "${this.tableName}" WHERE id = $1`
        if (!includeDeleted) {
            sql += ` AND "isDeleted" = FALSE`
        }
        const result = await this.db.query(sql, [id])
        const entity = (result.rows[0] as T) || null
        if (entity) await this.loadRelations([entity], options?.relations)
        return entity
    }

    public async findOneBy(field: string, value: any, includeDeleted = false, options?: FindOptions): Promise<T | null> {
        let sql = `SELECT * FROM "${this.tableName}" WHERE "${field}" = $1`
        if (!includeDeleted) {
            sql += ` AND "isDeleted" = FALSE`
        }
        sql += ` LIMIT 1`
        const result = await this.db.query(sql, [value])
        const entity = (result.rows[0] as T) || null
        if (entity) await this.loadRelations([entity], options?.relations)
        return entity
    }

    public async findManyBy(field: string, value: any, includeDeleted = false, options?: FindOptions): Promise<T[]> {
        let sql = `SELECT * FROM "${this.tableName}" WHERE "${field}" = $1`
        if (!includeDeleted) {
            sql += ` AND "isDeleted" = FALSE`
        }
        const result = await this.db.query(sql, [value])
        const entities = result.rows as T[]
        await this.loadRelations(entities, options?.relations)
        return entities
    }

    public async create(data: Partial<T>): Promise<T> {
        const idField = Metadata.get(this.entityClass, METADATA_KEYS.ID) || 'id'
        const relations: Record<string, RelationConfig> = Metadata.get(this.entityClass, METADATA_KEYS.RELATIONS) || {};

        const insertData = {} as any
        for (const key of Object.keys(data)) {
            if (!relations[key]) insertData[key] = (data as any)[key]
        }

        if (!insertData[idField]) {
            insertData[idField] = uuidv4()
        }

        const keys = Object.keys(insertData)
        const values = keys.map(k => insertData[k])

        const keyString = keys.map(k => `"${k}"`).join(', ')
        const placeholderString = keys.map((_, i) => `$${i + 1}`).join(', ')

        const sql = `
            INSERT INTO "${this.tableName}" (${keyString})
            VALUES (${placeholderString})
            RETURNING *
        `

        const result = await this.db.query(sql, values)
        const createdEntity = result.rows[0] as T

        await this.syncRelations(createdEntity[idField], data)
        return createdEntity
    }

    public async update(id: string, data: Partial<T>): Promise<T | null> {
        const relations: Record<string, RelationConfig> = Metadata.get(this.entityClass, METADATA_KEYS.RELATIONS) || {};

        const updateKeys = Object.keys(data).filter(k => k !== 'updatedAt' && !relations[k])

        if (updateKeys.length > 0) {
            const updateData = { ...data, updatedAt: new Date() } as any
            updateKeys.push('updatedAt')

            const setString = updateKeys.map((k, i) => `"${k}" = $${i + 1}`).join(', ')
            const values = updateKeys.map(k => updateData[k])
            values.push(id)

            const sql = `
                UPDATE "${this.tableName}"
                SET ${setString}
                WHERE id = $${values.length}
            `
            await this.db.query(sql, values)
        }

        await this.syncRelations(id, data)
        return this.findById(id)
    }

    public async updateBy(field: string, value: any, data: Partial<T>): Promise<T[]> {
        const relations: Record<string, RelationConfig> = Metadata.get(this.entityClass, METADATA_KEYS.RELATIONS) || {};

        const updateKeys = Object.keys(data).filter(k => k !== 'updatedAt' && !relations[k])
        const targetEntities = await this.findManyBy(field, value);
        const selfIdField = Metadata.get(this.entityClass, METADATA_KEYS.ID) || 'id';

        if (updateKeys.length > 0) {
            const updateData = { ...data, updatedAt: new Date() } as any
            updateKeys.push('updatedAt')

            const setString = updateKeys.map((k, i) => `"${k}" = $${i + 1}`).join(', ')
            const values = updateKeys.map(k => updateData[k])
            values.push(value)

            const sql = `
                UPDATE "${this.tableName}"
                SET ${setString}
                WHERE "${field}" = $${values.length}
            `
            await this.db.query(sql, values)
        }

        for (const entity of targetEntities) {
            await this.syncRelations(entity[selfIdField], data)
        }

        return this.findManyBy(field, value)
    }

    public async delete(id: string, deletedBy = 'System'): Promise<void> {
        const sql = `
            UPDATE "${this.tableName}"
            SET "isDeleted" = TRUE, "deletedAt" = NOW(), "deletedBy" = $1
            WHERE id = $2
        `
        await this.db.query(sql, [deletedBy, id])
    }

    public async deleteBy(field: string, value: any, deletedBy = 'System'): Promise<void> {
        const sql = `
            UPDATE "${this.tableName}"
            SET "isDeleted" = TRUE, "deletedAt" = NOW(), "deletedBy" = $1
            WHERE "${field}" = $2
        `
        await this.db.query(sql, [deletedBy, value])
    }

    public async hardDelete(id: string): Promise<void> {
        const sql = `DELETE FROM "${this.tableName}" WHERE id = $1`
        await this.db.query(sql, [id])
    }

    public async query(options: QueryOptions): Promise<T[]> {
        let sql = `SELECT ${options.select ? options.select.map(s => `"${s}"`).join(', ') : '*'} FROM "${this.tableName}"`
        const values: any[] = []

        const whereClauses: string[] = []
        if (options.where) {
            for (const [k, v] of Object.entries(options.where)) {
                values.push(v)
                whereClauses.push(`"${k}" = $${values.length}`)
            }
        }

        if (!options.where?.isDeleted) {
            whereClauses.push(`"isDeleted" = FALSE`)
        }

        if (whereClauses.length > 0) {
            sql += ` WHERE ` + whereClauses.join(' AND ')
        }

        if (options.orderBy) {
            sql += ` ORDER BY "${options.orderBy.field}" ${options.orderBy.direction}`
        }

        if (options.limit !== undefined) {
            sql += ` LIMIT ${options.limit}`
        }

        if (options.offset !== undefined) {
            sql += ` OFFSET ${options.offset}`
        }

        const result = await this.db.query(sql, values)
        const entities = result.rows as T[]
        await this.loadRelations(entities, options.relations)
        return entities
    }

    public async raw(sql: string, params?: any[]): Promise<any[]> {
        const result = await this.db.query(sql, params)
        return result.rows
    }
}

export default BaseRepository