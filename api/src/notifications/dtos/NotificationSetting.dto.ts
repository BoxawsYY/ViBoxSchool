export class NotificationSettingDTO {
    id: string
    eventType: string
    channel: string
    daysBefore: number | null
    template: string
    sendTime: string | null
    status: string
    definedById: string | null
    createdAt: Date

    constructor(row: any) {
        this.id = row.id
        this.eventType = row.eventType
        this.channel = row.channel
        this.daysBefore = row.daysBefore ?? null
        this.template = row.template
        this.sendTime = row.sendTime ?? null
        this.status = row.status
        this.definedById = row.definedById ?? null
        this.createdAt = row.createdAt
    }
}

export default NotificationSettingDTO
