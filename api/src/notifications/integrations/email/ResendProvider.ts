import { EmailAttachment, EmailProvider, EmailResult } from './EmailProvider.js'

const FROM = process.env.EMAIL_FROM || 'ViBoxSchool <onboarding@resend.dev>'
const ENDPOINT = 'https://api.resend.com/emails'

export default class ResendProvider implements EmailProvider {
    async send(destinatario: string, asunto: string, contenido: string, adjunto?: EmailAttachment): Promise<EmailResult> {
        const apiKey = process.env.RESEND_API_KEY
        if (!apiKey) return { ok: false, error: 'RESEND_API_KEY no está configurada' }

        const body: Record<string, unknown> = {
            from: FROM,
            to: [destinatario],
            subject: asunto,
            text: contenido
        }
        if (adjunto) {
            body.attachments = [{ filename: adjunto.nombre, content: adjunto.contenido.toString('base64') }]
        }

        try {
            const response = await fetch(ENDPOINT, {
                method: 'POST',
                headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })
            const payload: any = await response.json().catch(() => ({}))
            if (!response.ok) {
                return {
                    ok: false,
                    error: payload?.message || payload?.error?.message || `Resend respondió ${response.status}`
                }
            }
            return { ok: true, externalId: payload?.id }
        } catch (error: any) {
            return { ok: false, error: error?.message || 'Error de red con Resend' }
        }
    }
}
