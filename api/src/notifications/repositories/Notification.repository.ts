import { Repository } from '../../core/decorators/decorators.js'
import BaseRepository from '../../core/orm/repository/Base.repository.js'
import Notification from '../entities/Notification.entity.js'

export interface ListMineInput {
    recipientUserId: string
    isRead?: boolean
    limit: number
    offset: number
}

export interface ListMineResult {
    rows: any[]
    total: number
}

@Repository()
export class NotificationRepository extends BaseRepository<Notification> {

    private readonly PUBLIC_FIELDS = `"id", "eventType", "subject", "message", "entityType", "entityId", "isRead", "readAt", "createdAt"`

    constructor() {
        super(Notification)
    }

    async listMine(input: ListMineInput): Promise<ListMineResult> {
        const conditions = ['"recipientUserId" = $1', '"isDeleted" = FALSE', `"status" = 'active'`]
        const params: any[] = [input.recipientUserId]

        if (input.isRead !== undefined) {
            params.push(input.isRead)
            conditions.push(`"isRead" = $${params.length}`)
        }

        params.push(input.limit, input.offset)

        const result = await this.db.query(`
            SELECT ${this.PUBLIC_FIELDS}, COUNT(*) OVER()::INTEGER AS "total"
            FROM "Notifications"
            WHERE ${conditions.join(' AND ')}
            ORDER BY "createdAt" DESC
            LIMIT $${params.length - 1} OFFSET $${params.length}
        `, params)

        return {
            rows: result.rows,
            total: result.rows[0]?.total ?? 0
        }
    }

    async countUnread(recipientUserId: string): Promise<number> {
        const rows = await this.raw(`
            SELECT COUNT(*)::INTEGER AS "count"
            FROM "Notifications"
            WHERE "recipientUserId" = $1
                AND "isDeleted" = FALSE
                AND "status" = 'active'
                AND "isRead" = FALSE
        `, [recipientUserId])

        return rows[0]?.count ?? 0
    }

    async markRead(id: string, recipientUserId: string): Promise<any | null> {
        const rows = await this.raw(`
            UPDATE "Notifications"
            SET "isRead" = TRUE, "readAt" = COALESCE("readAt", NOW())
            WHERE "id" = $1 AND "recipientUserId" = $2 AND "isDeleted" = FALSE
            RETURNING ${this.PUBLIC_FIELDS}
        `, [id, recipientUserId])

        return rows[0] || null
    }

    async markAllRead(recipientUserId: string): Promise<number> {
        const result = await this.db.query(`
            UPDATE "Notifications"
            SET "isRead" = TRUE, "readAt" = NOW()
            WHERE "recipientUserId" = $1
                AND "isRead" = FALSE
                AND "isDeleted" = FALSE
        `, [recipientUserId])

        return result.rowCount ?? 0
    }

}

export default NotificationRepository
