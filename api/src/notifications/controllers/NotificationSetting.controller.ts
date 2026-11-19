import { Controller, Get, Inject, Patch, Post, Roles } from '../../core/decorators/decorators.js'
import { ROLES } from '../../auth/constants/authorities.js'
import { InvalidFormatError } from '../../core/errors/InvalidFormat.error.js'
import Validator from '../../core/utils/Validator.js'
import NotificationSettingService, { SETTING_CHANNELS, SETTING_EVENT_TYPES } from '../services/NotificationSetting.service.js'

const MANAGE_ROLES = [ROLES.RECTOR, ROLES.SECRETARY, ROLES.ADMIN]

@Controller('/notifications/settings')
export class NotificationSettingController {

    constructor(
        @Inject(NotificationSettingService)
        private notificationSettingService: NotificationSettingService
    ) { }

    @Get('/')
    @Roles(MANAGE_ROLES)
    async list(request, response) {
        const { status } = request.query || {}
        if (status !== undefined && !['active', 'inactive'].includes(status)) {
            throw new InvalidFormatError('El parámetro status debe ser active o inactive')
        }

        return response.status(200).json(await this.notificationSettingService.list(request.user, status))
    }

    @Post('/')
    @Roles(MANAGE_ROLES)
    async create(request, response) {
        const body = request.body || {}
        const { eventType, channel, template, sendTime } = body
        const daysBefore = this.parseDaysBefore(body.daysBefore)

        Validator.required({ eventType, channel, template })
            .isIn({ eventType }, [...SETTING_EVENT_TYPES])
            .isIn({ channel }, [...SETTING_CHANNELS])
            .length({ template }, 1, 2000)

        if (sendTime !== undefined && sendTime !== null) Validator.isTime({ sendTime })

        const created = await this.notificationSettingService.create({ eventType, channel, template, daysBefore, sendTime: sendTime ?? null }, request.user)
        return response.status(201).json(created)
    }

    @Patch('/:id')
    @Roles(MANAGE_ROLES)
    async update(request, response) {
        const { id } = request.params || {}
        const body = request.body || {}

        Validator.required({ id }).isUUID({ id })

        const input: any = {}

        if (body.eventType !== undefined) {
            Validator.isIn({ eventType: body.eventType }, [...SETTING_EVENT_TYPES])
            input.eventType = body.eventType
        }
        if (body.channel !== undefined) {
            Validator.isIn({ channel: body.channel }, [...SETTING_CHANNELS])
            input.channel = body.channel
        }
        if (body.template !== undefined) {
            Validator.required({ template: body.template }).length({ template: body.template }, 1, 2000)
            input.template = body.template
        }
        if (body.daysBefore !== undefined) input.daysBefore = this.parseDaysBefore(body.daysBefore)
        if (body.sendTime !== undefined) {
            if (body.sendTime !== null) Validator.isTime({ sendTime: body.sendTime })
            input.sendTime = body.sendTime ?? null
        }

        return response.status(200).json(await this.notificationSettingService.update(id, input, request.user))
    }

    @Patch('/:id/status')
    @Roles(MANAGE_ROLES)
    async updateStatus(request, response) {
        const { id } = request.params || {}
        const { status } = request.body || {}

        Validator.required({ id, status }).isUUID({ id }).isIn({ status }, ['active', 'inactive'])

        return response.status(200).json(await this.notificationSettingService.setStatus(id, status, request.user))
    }

    private parseDaysBefore(value: any): number | null | undefined {
        if (value === undefined) return undefined
        if (value === null) return null

        const parsed = typeof value === 'number' ? value : Number.parseInt(String(value), 10)
        if (!Number.isInteger(parsed) || parsed < 0 || parsed > 365) {
            throw new InvalidFormatError('daysBefore debe ser un entero entre 0 y 365')
        }

        return parsed
    }

}

export default NotificationSettingController
