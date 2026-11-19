import { EmailProvider } from './EmailProvider.js'
import ResendProvider from './ResendProvider.js'
import BrevoProvider from './BrevoProvider.js'
import MockEmailProvider from './MockEmailProvider.js'

let cached: EmailProvider | null = null
let cachedName = 'mock'

export const getEmailProvider = (): EmailProvider => {
    if (cached) return cached

    const which = (process.env.EMAIL_PROVIDER || 'mock').trim().toLowerCase()
    if (which === 'resend') {
        cached = new ResendProvider()
        cachedName = 'resend'
    } else if (which === 'brevo') {
        cached = new BrevoProvider()
        cachedName = 'brevo'
    } else {
        if (which !== 'mock') {
            console.warn(`[EmailProviderFactory] EMAIL_PROVIDER="${which}" no reconocido; usando mock`)
        }
        cached = new MockEmailProvider()
        cachedName = 'mock'
    }
    return cached
}

export const getEmailProviderName = (): string => {
    if (!cached) getEmailProvider()
    return cachedName
}
