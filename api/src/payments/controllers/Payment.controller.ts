import { Controller, Get, Post, Roles, Inject } from '../../core/decorators/decorators.js'
import PaymentRepository from '../repositories/Payment.repository.js'
import { InvalidFormatError } from '../../core/errors/InvalidFormat.error.js'
import { NotFoundError } from '../../core/errors/NotFound.error.js'
import EmailEmitterService from '../../notifications/services/EmailEmitterService.js'

@Controller('/payments')
export class PaymentController {
    constructor(@Inject(PaymentRepository) private payments: PaymentRepository, @Inject(EmailEmitterService) private emailEmitter: EmailEmitterService) {}

    @Roles(['Guardian'])
    @Get('/payables')
    async payables(request, response) {
        try {
            const result = await this.payments.listPayable(request.user.id)
            return response.status(200).json(result)
        } catch (error) {
            console.error('[Payments] No se pudieron consultar los conceptos pendientes', error)
            return response.status(500).json({
                code: 'PAYMENT_PAYABLES_ERROR',
                message: 'No se pudieron cargar los conceptos pendientes. Intenta nuevamente más tarde.'
            })
        }
    }

    @Roles(['Guardian'])
    @Post('/cash')
    async createCash(request, response) {
        const concepts = request.body?.concepts
        if (!Array.isArray(concepts) || !concepts.length || concepts.length > 100 || concepts.some(item => !item?.id || !item?.concept)) {
            throw new InvalidFormatError('Selecciona al menos un concepto válido')
        }
        const keys = concepts.map(item => `${item.id}:${item.concept}`)
        if (new Set(keys).size !== keys.length) throw new InvalidFormatError('Hay conceptos repetidos')
        const payment = await this.payments.createCashPayment(request.user.id, concepts)
        return response.status(201).json(payment)
    }

    @Roles(['Guardian'])
    @Post('/pse')
    async preparePse(request, response) {
        const concepts = request.body?.concepts
        if (!Array.isArray(concepts) || !concepts.length || concepts.length > 100 || concepts.some(item => !item?.id || !item?.concept)) {
            throw new InvalidFormatError('Selecciona al menos un concepto válido')
        }
        const keys = concepts.map(item => `${item.id}:${item.concept}`)
        if (new Set(keys).size !== keys.length) throw new InvalidFormatError('Hay conceptos repetidos')
        const invalidatedPaymentIds = await this.payments.invalidateCashReferences(request.user.id, concepts)
        return response.status(200).json({ method: 'pse', status: 'development', invalidatedPaymentIds })
    }

    @Roles(['Secretary'])
    @Get('/reference/:referenceNumber')
    async findByReference(request, response) {
        const payment = await this.payments.findPendingByReference(request.params.referenceNumber, request.user.schoolId)
        if (!payment) throw new NotFoundError('No se encontró un pago pendiente con esa referencia')
        return response.status(200).json(payment)
    }

    @Roles(['Secretary'])
    @Get('/students')
    async searchStudents(request, response) {
        return response.status(200).json(await this.payments.searchStudents(request.user.schoolId, String(request.query?.q || '')))
    }

    @Roles(['Secretary'])
    @Get('/students/:studentId/payables')
    async secretaryPayables(request, response) {
        const data = await this.payments.studentPayablesForSecretary(request.params.studentId, request.user.schoolId)
        if (!data) throw new NotFoundError('No se encontró el estudiante en este colegio')
        return response.status(200).json(data)
    }

    @Roles(['Secretary'])
    @Post('/cash/register')
    async registerSecretaryCash(request, response) {
        const { studentId, concepts, amountReceived, referenceNumber, observations, paymentDate } = request.body || {}
        if (!studentId || !Array.isArray(concepts) || !concepts.length || concepts.some(item => !item?.id || !item?.concept)) throw new InvalidFormatError('Selecciona al estudiante y al menos un concepto')
        const keys = concepts.map(item => `${item.id}:${item.concept}`)
        if (new Set(keys).size !== keys.length) throw new InvalidFormatError('Hay conceptos repetidos')
        if (paymentDate && (!/^\d{4}-\d{2}-\d{2}$/.test(paymentDate) || Number.isNaN(Date.parse(`${paymentDate}T12:00:00-05:00`)))) throw new InvalidFormatError('La fecha de pago no es válida')
        const receipt = await this.payments.registerSecretaryCash({ studentId, schoolId: request.user.schoolId, registeredById: request.user.id, concepts, amountReceived: Number(amountReceived), referenceNumber: referenceNumber ? String(referenceNumber) : undefined, observations: observations ? String(observations).slice(0, 2000) : null, paymentDate })
        let email: any = { sent: false, skipped: 'no_guardian_email' }
        if (receipt.toEmail) {
            try {
                email = await this.emailEmitter.paymentReceipt({
                    schoolId: receipt.schoolId, to: receipt.toEmail, studentName: receipt.studentName,
                    receiptNumber: receipt.receiptNumber, referenceNumber: receipt.referenceNumber,
                    totalAmount: receipt.totalAmount,
                    concepts: receipt.concepts.map(item => `${item.label}: ${item.amount}`).join(', '),
                    attachment: { nombre: `comprobante-${receipt.receiptNumber}.pdf`, contenido: receipt.pdf }
                })
            } catch (error) {
                console.error('[Payments] El pago quedó registrado, pero no se pudo enviar el comprobante por correo', error)
                email = { sent: false, error: 'email_delivery_failed' }
            }
        }
        return response.status(201).json({ ...receipt, pdf: undefined, toEmail: undefined, email })
    }

    @Roles(['Secretary', 'Guardian'])
    @Get('/receipts/:receiptId')
    async downloadReceipt(request, response) {
        const receipt = await this.payments.getReceipt(request.params.receiptId, request.user.id, request.user.roles?.[0], request.user.schoolId)
        if (!receipt) throw new NotFoundError('No se encontró el comprobante')
        response.setHeader('Content-Type', 'application/pdf')
        response.setHeader('Content-Disposition', `inline; filename="comprobante-${receipt.number}.pdf"`)
        return response.status(200).send(receipt.pdf)
    }
}

export default PaymentController
