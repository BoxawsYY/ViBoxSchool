import { EmailAttachment, EmailProvider, EmailResult } from './EmailProvider.js'

const ENDPOINT = 'https://api.brevo.com/v3/smtp/email'

export default class BrevoProvider implements EmailProvider {
    async send(destinatario: string, asunto: string, contenido: string, adjunto?: EmailAttachment): Promise<EmailResult> {
        const apiKey = process.env.BREVO_API_KEY
        const senderEmail = process.env.BREVO_SENDER_EMAIL
        const senderName = process.env.BREVO_SENDER_NAME || 'ViBoxSchool'

        if (!apiKey) return { ok: false, error: 'BREVO_API_KEY no está configurada' }
        if (!senderEmail) return { ok: false, error: 'BREVO_SENDER_EMAIL no está configurada' }

        const body: Record<string, unknown> = {
            sender: { name: senderName, email: senderEmail },
            to: [{ email: destinatario }],
            subject: asunto,
            textContent: contenido
        }
        if (adjunto) {
            body.attachment = [{ name: adjunto.nombre, content: adjunto.contenido.toString('base64') }]
        }

        try {
            const response = await fetch(ENDPOINT, {
                method: 'POST',
                headers: { 'api-key': apiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify(body)
            })
            const payload: any = await response.json().catch(() => ({}))
            if (!response.ok) {
                return {
                    ok: false,
                    error: payload?.message || payload?.error || `Brevo respondió ${response.status}`
                }
            }
            return { ok: true, externalId: payload?.messageId }
        } catch (error: any) {
            return { ok: false, error: error?.message || 'Error de red con Brevo' }
        }
    }
}
