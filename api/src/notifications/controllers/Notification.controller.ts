import { Controller, Get, Inject, Patch } from '../../core/decorators/decorators.js'
import { InvalidFormatError } from '../../core/errors/InvalidFormat.error.js'
import Validator from '../../core/utils/Validator.js'
import NotificationService from '../services/Notification.service.js'

const DEFAULT_LIMIT = 10
const MAX_LIMIT = 50

@Controller('/notifications')
export class NotificationController {

    constructor(
        @Inject(NotificationService)
        private notificationService: NotificationService
    ) { }

    @Get('/unread-count')
    async unreadCount(request, response) {
        return response.status(200).json(await this.notificationService.unreadCount(request.user?.id))
    }

    @Get('/')
    async list(request, response) {
        const { isRead, limit, offset } = request.query || {}

        let parsedIsRead: boolean | undefined
        if (isRead === 'true') parsedIsRead = true
        else if (isRead === 'false') parsedIsRead = false
        else if (isRead !== undefined) throw new InvalidFormatError('El parámetro isRead debe ser true o false')

        const parsedLimit = Math.min(Math.max(Number.parseInt(limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT)
        const parsedOffset = Math.max(Number.parseInt(offset, 10) || 0, 0)

        const result = await this.notificationService.list(request.user?.id, {
            isRead: parsedIsRead,
            limit: parsedLimit,
            offset: parsedOffset
        })

        return response.status(200).json(result)
    }

    @Patch('/read-all')
    async readAll(request, response) {
        return response.status(200).json(await this.notificationService.markAllRead(request.user?.id))
    }

    @Patch('/:id/read')
    async markRead(request, response) {
        const { id } = request.params || {}
        Validator.required({ id }).isUUID({ id })

        return response.status(200).json(await this.notificationService.markRead(id, request.user?.id))
    }

}

export default NotificationController
