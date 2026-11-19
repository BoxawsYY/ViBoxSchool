import { Inject, Service } from '../../core/decorators/decorators.js'
import NotificationSettingRepository from '../repositories/NotificationSetting.repository.js'
import NotificationDeliveryRepository from '../repositories/NotificationDelivery.repository.js'
import { getEmailProvider, getEmailProviderName } from '../integrations/email/EmailProviderFactory.js'
import { EmailAttachment } from '../integrations/email/EmailProvider.js'

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

export interface DocumentApprovedEmailInput {
    schoolId: string
    to: string
    studentName: string
    fileNumber: string
}

export interface PaymentReceiptEmailInput {
    schoolId: string
    to: string
    studentName: string
    receiptNumber: string
    referenceNumber: string
    totalAmount: string
    concepts: string
    attachment: EmailAttachment
}

interface DeliverInput {
    schoolId: string
    settingId: string | null
    eventType: string
    to: string
    subject: string
    content: string
    attachment?: EmailAttachment
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
        if (setting?.status === 'inactive') return { sent: false as const, skipped: 'setting_inactive' as const }

        const subject = `Observación sobre el expediente ${input.fileNumber}`
        const content = setting?.template
            ? renderTemplate(setting.template, {
                studentName: input.studentName,
                fileNumber: input.fileNumber,
                observation: input.observation
            })
            : `Hola ${input.studentName}:\n\nEl colegio encontró una observación en el expediente ${input.fileNumber}:\n${input.observation}\n\nIngresa al módulo de matrícula para corregirla.\n\n— ViBoxSchool`

        return this.deliver({
            schoolId: input.schoolId,
            settingId: setting?.id ?? null,
            eventType: 'observation',
            to: input.to,
            subject,
            content
        })
    }

    async documentApproved(input: DocumentApprovedEmailInput) {
        const setting = await this.notificationSettingRepository.findBySchoolEventChannel(
            input.schoolId, 'document_approved', 'email'
        )
        if (setting?.status === 'inactive') return { sent: false as const, skipped: 'setting_inactive' as const }

        const subject = `Documentos aprobados ${input.fileNumber}`
        const content = setting?.template
            ? renderTemplate(setting.template, {
                studentName: input.studentName,
                fileNumber: input.fileNumber
            })
            : `Hola ${input.studentName}:\n\nLos documentos de tu expediente ${input.fileNumber} fueron aprobados.\nYa puedes pagar la matrícula.\n\n— ViBoxSchool`

        return this.deliver({
            schoolId: input.schoolId,
            settingId: setting?.id ?? null,
            eventType: 'document_approved',
            to: input.to,
            subject,
            content
        })
    }

    async paymentReceipt(input: PaymentReceiptEmailInput) {
        const setting = await this.notificationSettingRepository.findBySchoolEventChannel(
            input.schoolId, 'payment_confirmation', 'email'
        )
        if (setting?.status === 'inactive') return { sent: false as const, skipped: 'setting_inactive' as const }

        const values = {
            studentName: input.studentName,
            receiptNumber: input.receiptNumber,
            referenceNumber: input.referenceNumber,
            totalAmount: input.totalAmount,
            concepts: input.concepts
        }
        const subject = `Comprobante de pago ${input.receiptNumber}`
        const content = setting?.template
            ? renderTemplate(setting.template, values)
            : `Hola ${input.studentName}:\n\nRegistramos tu pago por ${input.totalAmount}.\nReferencia: ${input.referenceNumber}\nComprobante: ${input.receiptNumber}\nConceptos: ${input.concepts}\n\nAdjuntamos el comprobante en PDF.\n\nViBoxSchool`

        return this.deliver({
            schoolId: input.schoolId,
            settingId: setting?.id ?? null,
            eventType: 'payment_confirmation',
            to: input.to,
            subject,
            content,
            attachment: input.attachment
        })
    }

    private async deliver(input: DeliverInput) {
        const provider = getEmailProvider()
        const providerName = getEmailProviderName()

        let attempts = 0
        let lastError = ''
        let result: { ok: boolean, externalId?: string, error?: string } = { ok: false }

        while (attempts < MAX_ATTEMPTS) {
            attempts += 1
            result = await provider.send(input.to, input.subject, input.content, input.attachment)
            if (result.ok) break

            lastError = result.error || `Error desconocido (intento ${attempts})`
            if (attempts < MAX_ATTEMPTS) {
                await new Promise(resolve => setTimeout(resolve, backoffDelay(attempts)))
            }
        }

        await this.notificationDeliveryRepository.record({
            schoolId: input.schoolId,
            settingId: input.settingId,
            eventType: input.eventType,
            channel: 'email',
            provider: providerName,
            destination: input.to,
            subject: input.subject,
            status: result.ok ? 'sent' : 'failed',
            attempts,
            externalId: result.externalId ?? null,
            lastError: result.ok ? null : lastError,
            sentAt: result.ok ? new Date() : null
        })

        if (!result.ok) {
            console.error(`[EmailEmitter] ${input.eventType} para ${input.to} falló tras ${attempts} intento(s): ${lastError}`)
        }
        return result.ok
            ? { sent: true as const, attempts }
            : { sent: false as const, attempts, error: lastError }
    }
}

export default EmailEmitterService
