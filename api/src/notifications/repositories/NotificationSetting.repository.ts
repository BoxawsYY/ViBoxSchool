import { Repository } from '../../core/decorators/decorators.js'
import BaseRepository from '../../core/orm/repository/Base.repository.js'
import NotificationSetting from '../entities/NotificationSetting.entity.js'

export interface SettingCreateInput {
    schoolId: string
    definedById: string
    eventType: string
    channel: string
    daysBefore: number | null
    template: string
    sendTime: string | null
}

export interface SettingUpdateInput {
    eventType?: string
    channel?: string
    daysBefore?: number | null
    template?: string
    sendTime?: string | null
}

@Repository()
export class NotificationSettingRepository extends BaseRepository<NotificationSetting> {

    private readonly PUBLIC_FIELDS = `"id", "eventType", "channel", "daysBefore", "template", "sendTime", "status", "definedById", "createdAt"`

    constructor() {
        super(NotificationSetting)
    }

    async findBySchoolEventChannel(schoolId: string, eventType: string, channel: string): Promise<any | null> {
        const rows = await this.raw(`
            SELECT "id", "eventType", "channel", "daysBefore", "template", "sendTime", "status"
            FROM "NotificationSettings"
            WHERE "schoolId" = $1 AND "eventType" = $2 AND "channel" = $3 AND "isDeleted" = FALSE
            LIMIT 1
        `, [schoolId, eventType, channel])

        return rows[0] || null
    }

    async listBySchool(schoolId: string, status?: string): Promise<any[]> {
        const conditions = ['"schoolId" = $1', '"isDeleted" = FALSE']
        const params: any[] = [schoolId]

        if (status) {
            params.push(status)
            conditions.push(`"status" = $${params.length}`)
        }

        return this.raw(`
            SELECT ${this.PUBLIC_FIELDS}
            FROM "NotificationSettings"
            WHERE ${conditions.join(' AND ')}
            ORDER BY "eventType" ASC, "channel" ASC
        `, params)
    }

    async findByIdForSchool(id: string, schoolId: string): Promise<any | null> {
        const rows = await this.raw(`
            SELECT ${this.PUBLIC_FIELDS}
            FROM "NotificationSettings"
            WHERE "id" = $1 AND "schoolId" = $2 AND "isDeleted" = FALSE
            LIMIT 1
        `, [id, schoolId])

        return rows[0] || null
    }

    async findDuplicate(schoolId: string, eventType: string, channel: string, excludeId?: string): Promise<any | null> {
        const conditions = ['"schoolId" = $1', '"eventType" = $2', '"channel" = $3', '"isDeleted" = FALSE']
        const params: any[] = [schoolId, eventType, channel]

        if (excludeId) {
            params.push(excludeId)
            conditions.push(`"id" <> $${params.length}`)
        }

        const rows = await this.raw(`
            SELECT "id"
            FROM "NotificationSettings"
            WHERE ${conditions.join(' AND ')}
            LIMIT 1
        `, params)

        return rows[0] || null
    }

    async createSetting(input: SettingCreateInput): Promise<any> {
        const rows = await this.raw(`
            INSERT INTO "NotificationSettings" ("id", "schoolId", "definedById", "eventType", "channel", "daysBefore", "template", "sendTime")
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)
            RETURNING ${this.PUBLIC_FIELDS}
        `, [input.schoolId, input.definedById, input.eventType, input.channel, input.daysBefore, input.template, input.sendTime])

        return rows[0]
    }

    async updateSetting(id: string, schoolId: string, input: SettingUpdateInput): Promise<any | null> {
        const keys = Object.keys(input).filter((key) => (input as any)[key] !== undefined)
        if (keys.length === 0) return this.findByIdForSchool(id, schoolId)

        const params: any[] = keys.map((key) => (input as any)[key])
        const setString = keys.map((key, i) => `"${key}" = $${i + 1}`).join(', ')
        params.push(id, schoolId)

        const rows = await this.raw(`
            UPDATE "NotificationSettings"
            SET ${setString}, "updatedAt" = NOW()
            WHERE "id" = $${params.length - 1} AND "schoolId" = $${params.length} AND "isDeleted" = FALSE
            RETURNING ${this.PUBLIC_FIELDS}
        `, params)

        return rows[0] || null
    }

    async setStatus(id: string, schoolId: string, status: string): Promise<any | null> {
        const rows = await this.raw(`
            UPDATE "NotificationSettings"
            SET "status" = $1, "updatedAt" = NOW()
            WHERE "id" = $2 AND "schoolId" = $3 AND "isDeleted" = FALSE
            RETURNING ${this.PUBLIC_FIELDS}
        `, [status, id, schoolId])

        return rows[0] || null
    }

}

export default NotificationSettingRepository
