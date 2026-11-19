import { randomUUID } from 'crypto'
import { EmailProvider, EmailResult } from './EmailProvider.js'

export default class MockEmailProvider implements EmailProvider {
    async send(destinatario: string, asunto: string, _contenido: string): Promise<EmailResult> {
        console.log(`[MockEmail] → ${destinatario} | ${asunto}`)
        return { ok: true, externalId: `mock-${randomUUID()}` }
    }
}
