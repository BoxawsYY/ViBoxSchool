import { Inject, Service } from '../../core/decorators/decorators.js'
import { NotFoundError } from '../../core/errors/NotFound.error.js'
import NotificationDTO from '../dtos/Notification.dto.js'
import NotificationRepository from '../repositories/Notification.repository.js'

export interface ListFilters {
    isRead?: boolean
    limit: number
    offset: number
}

@Service()
export class NotificationService {

    constructor(
        @Inject(NotificationRepository)
        private notificationRepository: NotificationRepository
    ) { }

    async list(userId: string, filters: ListFilters) {
        const { rows, total } = await this.notificationRepository.listMine({
            recipientUserId: userId,
            isRead: filters.isRead,
            limit: filters.limit,
            offset: filters.offset
        })

        return {
            items: rows.map(row => new NotificationDTO(row)),
            total,
            limit: filters.limit,
            offset: filters.offset
        }
    }

    async unreadCount(userId: string) {
        const count = await this.notificationRepository.countUnread(userId)
        return { count }
    }

    async markRead(id: string, userId: string) {
        const row = await this.notificationRepository.markRead(id, userId)
        if (!row) throw new NotFoundError('Notificación no encontrada')

        return new NotificationDTO(row)
    }

    async markAllRead(userId: string) {
        const updated = await this.notificationRepository.markAllRead(userId)
        return { updated }
    }

}

export default NotificationService
