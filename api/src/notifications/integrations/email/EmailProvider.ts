export interface EmailResult {
    ok: boolean
    externalId?: string
    error?: string
}

export interface EmailAttachment {
    nombre: string
    contenido: Buffer
}

export interface EmailProvider {
    send(destinatario: string, asunto: string, contenido: string, adjunto?: EmailAttachment): Promise<EmailResult>
}
