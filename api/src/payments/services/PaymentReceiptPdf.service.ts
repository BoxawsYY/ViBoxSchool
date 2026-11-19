export interface PaymentReceiptPdfData {
    referenceNumber: string
    receiptNumber: string
    date: Date
    studentName: string
    studentDocument: string
    concepts: Array<{ label: string, amount: string | number }>
    totalAmount: string | number
    schoolName: string
}

const plainText = (value: unknown) => String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '?')
    .replace(/[\\()]/g, '\\$&')

const money = (amount: string | number) => `COP ${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(Number(amount) || 0)}`

export const createPaymentReceiptPdf = (data: PaymentReceiptPdfData): Buffer => {
    const lines = [
        data.schoolName,
        'COMPROBANTE DE PAGO',
        `Comprobante: ${data.receiptNumber}`,
        `Referencia: ${data.referenceNumber}`,
        `Fecha: ${data.date.toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`,
        `Estudiante: ${data.studentName}`,
        `Documento: ${data.studentDocument}`,
        'Conceptos pagados:',
        ...data.concepts.map(item => `- ${item.label}: ${money(item.amount)}`),
        `TOTAL: ${money(data.totalAmount)}`,
        'Pago recibido y registrado por Secretaria.'
    ]
    const commands = ['BT', '/F1 12 Tf', '50 790 Td']
    lines.forEach((line, index) => {
        if (index === 1) commands.push('/F1 18 Tf')
        else if (index === 2) commands.push('/F1 10 Tf')
        commands.push(`(${plainText(line)}) Tj`, '0 -25 Td')
        if (index === 1) commands.push('/F1 12 Tf')
    })
    commands.push('ET')
    const stream = commands.join('\n')
    const objects = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        `<< /Length ${Buffer.byteLength(stream, 'ascii')} >>\nstream\n${stream}\nendstream`
    ]
    let pdf = '%PDF-1.4\n'
    const offsets = [0]
    objects.forEach((object, index) => {
        offsets.push(Buffer.byteLength(pdf, 'ascii'))
        pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
    })
    const xrefOffset = Buffer.byteLength(pdf, 'ascii')
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
    for (const offset of offsets.slice(1)) pdf += `${String(offset).padStart(10, '0')} 00000 n \n`
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
    return Buffer.from(pdf, 'ascii')
}

export default createPaymentReceiptPdf
