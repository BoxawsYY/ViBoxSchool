import { Inject, Service } from '../../core/decorators/decorators.js'
import NotificationRepository from '../repositories/Notification.repository.js'
import NotificationSettingRepository from '../repositories/NotificationSetting.repository.js'

const renderTemplate = (template: string, values: Record<string, string>) => {
    return Object.entries(values).reduce(
        (text, [key, value]) => text.replaceAll(`{${key}}`, value),
        template
    )
}

@Service()
export class NotificationEmitterService {

    constructor(
        @Inject(NotificationRepository)
        private notificationRepository: NotificationRepository,
        @Inject(NotificationSettingRepository)
        private notificationSettingRepository: NotificationSettingRepository
    ) { }

    async newEnrollmentRequest(input: { schoolId: string, enrollmentId: string, fileNumber: string, studentName?: string | null }) {
        const setting = await this.notificationSettingRepository.findBySchoolEventChannel(input.schoolId, 'new_enrollment_request', 'internal')
        if (setting?.status === 'inactive') return { emitted: 0, skipped: 'setting_inactive' }

        const staffIds = await this.notificationRepository.listSchoolStaffIds(input.schoolId)
        if (staffIds.length === 0) return { emitted: 0, skipped: 'no_staff' }

        const studentName = input.studentName || 'Un estudiante'
        const subject = `Nueva solicitud de matrícula ${input.fileNumber}`
        const message = setting?.template
            ? renderTemplate(setting.template, { studentName, fileNumber: input.fileNumber })
            : `${studentName} envió su solicitud de matrícula (${input.fileNumber}). Revísala en el módulo de matrículas.`

        const entries = staffIds.map(recipientUserId => ({
            schoolId: input.schoolId,
            recipientUserId,
            settingId: setting?.id ?? null,
            eventType: 'new_enrollment_request',
            subject,
            message,
            entityType: 'Enrollment',
            entityId: input.enrollmentId
        }))

        const emitted = await this.notificationRepository.createMany(entries)
        return { emitted }
    }

}

export default NotificationEmitterService
