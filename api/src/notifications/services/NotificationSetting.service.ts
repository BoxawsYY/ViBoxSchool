import { Inject, Service } from '../../core/decorators/decorators.js'
import { AlreadyExistError } from '../../core/errors/AlreadyExist.error.js'
import { ForbiddenError } from '../../core/errors/Forbidden.error.js'
import { NotFoundError } from '../../core/errors/NotFound.error.js'
import NotificationSettingDTO from '../dtos/NotificationSetting.dto.js'
import NotificationSettingRepository from '../repositories/NotificationSetting.repository.js'

export const SETTING_EVENT_TYPES = [
    'payment_reminder',
    'late_payment',
    'documents_pending',
    'observation',
    'payment_confirmation',
    'enrollment_confirmation',
    'new_enrollment_request',
    'payment_registered',
    'manual'
] as const

export const SETTING_CHANNELS = ['email', 'whatsapp', 'internal'] as const

export interface SettingPayload {
    eventType?: string
    channel?: string
    daysBefore?: number | null
    template?: string
    sendTime?: string | null
}

const requireSchoolId = (user: any): string => {
    const schoolId = user?.schoolId
    if (!schoolId) throw new ForbiddenError('Solo los colegios pueden configurar notificaciones')
    return schoolId
}

@Service()
export class NotificationSettingService {

    constructor(
        @Inject(NotificationSettingRepository)
        private notificationSettingRepository: NotificationSettingRepository
    ) { }

    async list(user: any, status?: string) {
        const schoolId = requireSchoolId(user)
        const rows = await this.notificationSettingRepository.listBySchool(schoolId, status)

        return {
            items: rows.map(row => new NotificationSettingDTO(row)),
            total: rows.length
        }
    }

    async create(payload: SettingPayload, user: any) {
        const schoolId = requireSchoolId(user)

        const duplicate = await this.notificationSettingRepository.findDuplicate(schoolId, payload.eventType!, payload.channel!)
        if (duplicate) throw new AlreadyExistError('Ya existe una configuración para ese tipo y canal')

        const row = await this.notificationSettingRepository.createSetting({
            schoolId,
            definedById: user.id,
            eventType: payload.eventType!,
            channel: payload.channel!,
            daysBefore: payload.daysBefore ?? null,
            template: payload.template!,
            sendTime: payload.sendTime ?? null
        })

        return new NotificationSettingDTO(row)
    }

    async update(id: string, payload: SettingPayload, user: any) {
        const schoolId = requireSchoolId(user)

        const current = await this.notificationSettingRepository.findByIdForSchool(id, schoolId)
        if (!current) throw new NotFoundError('Configuración no encontrada')

        const eventType = payload.eventType ?? current.eventType
        const channel = payload.channel ?? current.channel

        if (eventType !== current.eventType || channel !== current.channel) {
            const duplicate = await this.notificationSettingRepository.findDuplicate(schoolId, eventType, channel, id)
            if (duplicate) throw new AlreadyExistError('Ya existe una configuración para ese tipo y canal')
        }

        const row = await this.notificationSettingRepository.updateSetting(id, schoolId, {
            eventType: payload.eventType,
            channel: payload.channel,
            daysBefore: payload.daysBefore,
            template: payload.template,
            sendTime: payload.sendTime
        })

        return new NotificationSettingDTO(row)
    }

    async setStatus(id: string, status: string, user: any) {
        const schoolId = requireSchoolId(user)

        const row = await this.notificationSettingRepository.setStatus(id, schoolId, status)
        if (!row) throw new NotFoundError('Configuración no encontrada')

        return new NotificationSettingDTO(row)
    }

}

export default NotificationSettingService
