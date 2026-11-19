import { Database } from '../../core/orm/database/Database.js'
import { Repository } from '../../core/decorators/decorators.js'

export interface DeliveryRecord {
    schoolId: string
    settingId: string | null
    eventType: string
    channel: string
    provider: string
    destination: string
    subject: string
    status: 'sent' | 'failed' | 'delivered' | 'pending'
    attempts: number
    externalId: string | null
    lastError: string | null
    sentAt: Date | null
}

@Repository()
export class NotificationDeliveryRepository {
    private readonly db = Database.getInstance()

    async record(record: DeliveryRecord): Promise<void> {
        await this.db.query(`
            INSERT INTO "NotificationDeliveries" (
                "schoolId", "settingId", "eventType", "channel", "provider",
                "destination", "subject", "status", "attempts",
                "lastAttemptAt", "sentAt", "externalId", "lastError"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10, $11, $12)
        `, [
            record.schoolId, record.settingId, record.eventType, record.channel, record.provider,
            record.destination, record.subject, record.status, record.attempts,
            record.sentAt, record.externalId, record.lastError
        ])
    }
}

export default NotificationDeliveryRepository
