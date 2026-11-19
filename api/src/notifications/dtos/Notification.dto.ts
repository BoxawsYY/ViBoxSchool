export class NotificationDTO {
    id: string
    eventType: string
    subject: string | null
    message: string
    entityType: string | null
    entityId: string | null
    isRead: boolean
    readAt: Date | null
    createdAt: Date

    constructor(row: any) {
        this.id = row.id
        this.eventType = row.eventType
        this.subject = row.subject ?? null
        this.message = row.message
        this.entityType = row.entityType ?? null
        this.entityId = row.entityId ?? null
        this.isRead = row.isRead
        this.readAt = row.readAt ?? null
        this.createdAt = row.createdAt
    }
}

export default NotificationDTO
