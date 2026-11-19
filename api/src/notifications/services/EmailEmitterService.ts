import { Inject, Service } from '../../core/decorators/decorators.js'
import NotificationSettingRepository from '../repositories/NotificationSetting.repository.js'
import NotificationDeliveryRepository from '../repositories/NotificationDelivery.repository.js'
import { getEmailProvider, getEmailProviderName } from '../integrations/email/EmailProviderFactory.js'

const MAX_ATTEMPTS = 3
const BASE_DELAY_MS = 1000

const renderTemplate = (template: string, values: Record<string, string>) => (
    Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, value), template)
)

const backoffDelay = (attempt: number) => (
    BASE_DELAY_MS * 2 ** (attempt - 1) + Math.floor(Math.random() * 500)
)

export interface ObservationEmailInput {
    schoolId: string
    to: string
    studentName: string
    fileNumber: string
    observation: string
}

@Service()
export class EmailEmitterService {

    constructor(
        @Inject(NotificationSettingRepository)
        private notificationSettingRepository: NotificationSettingRepository,
        @Inject(NotificationDeliveryRepository)
        private notificationDeliveryRepository: NotificationDeliveryRepository
    ) { }

    async observationRejected(input: ObservationEmailInput) {
        const setting = await this.notificationSettingRepository.findBySchoolEventChannel(
            input.schoolId, 'observation', 'email'
        )
        if (setting?.status === 'inactive') return { sent: false, skipped: 'setting_inactive' as const }

        const subject = `Observación sobre el expediente ${input.fileNumber}`
        const content = setting?.template
            ? renderTemplate(setting.template, {
                studentName: input.studentName,
                fileNumber: input.fileNumber,
                observation: input.observation
            })
            : `Hola ${input.studentName}:\n\nEl colegio encontró una observación en el expediente ${input.fileNumber}:\n${input.observation}\n\nIngresa al módulo de matrícula para corregirla.\n\n— ViBoxSchool`

        const provider = getEmailProvider()
        const providerName = getEmailProviderName()

        let attempts = 0
        let lastError = ''
        let result: { ok: boolean, externalId?: string, error?: string } = { ok: false }

        while (attempts < MAX_ATTEMPTS) {
            attempts += 1
            result = await provider.send(input.to, subject, content)
            if (result.ok) break

            lastError = result.error || `Error desconocido (intento ${attempts})`
            if (attempts < MAX_ATTEMPTS) {
                await new Promise(resolve => setTimeout(resolve, backoffDelay(attempts)))
            }
        }

        await this.notificationDeliveryRepository.record({
            schoolId: input.schoolId,
            settingId: setting?.id ?? null,
            eventType: 'observation',
            channel: 'email',
            provider: providerName,
            destination: input.to,
            subject,
            status: result.ok ? 'sent' : 'failed',
            attempts,
            externalId: result.externalId ?? null,
            lastError: result.ok ? null : lastError,
            sentAt: result.ok ? new Date() : null
        })

        if (!result.ok) {
            console.error(`[EmailEmitter] Observación para ${input.to} falló tras ${attempts} intento(s): ${lastError}`)
        }
        return result.ok
            ? { sent: true as const, attempts }
            : { sent: false as const, attempts, error: lastError }
    }
}

export default EmailEmitterService
