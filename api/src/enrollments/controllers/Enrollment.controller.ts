import { Controller, Get, Inject, Patch, Post, Public, Roles } from '../../core/decorators/decorators.js'
import { ROLES } from '../../auth/constants/authorities.js'
import { InvalidFormatError } from '../../core/errors/InvalidFormat.error.js'
import EnrollmentService from '../services/Enrollment.service.js'

@Controller('/enrollments')
export class EnrollmentController {
    constructor(
        @Inject(EnrollmentService)
        private enrollmentService: EnrollmentService
    ) { }

    @Get('/review-queue')
    @Roles([ROLES.RECTOR, ROLES.SECRETARY])
    async findReviewQueue(request, response) {
        const schoolId = request.user?.schoolId || request.user?.school?.id
        if (!schoolId) throw new InvalidFormatError('El usuario no tiene un colegio asociado')
        const enrollments = await this.enrollmentService.findReviewQueue(schoolId)
        return response.status(200).json(enrollments)
    }

    @Get('/:enrollmentId/documents')
    @Roles([ROLES.RECTOR, ROLES.SECRETARY])
    async findEnrollmentReview(request, response) {
        const schoolId = request.user?.schoolId || request.user?.school?.id
        const { enrollmentId } = request.params || {}
        if (!schoolId) throw new InvalidFormatError('El usuario no tiene un colegio asociado')
        if (typeof enrollmentId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(enrollmentId)) {
            throw new InvalidFormatError('enrollmentId debe ser un UUID válido')
        }
        const review = await this.enrollmentService.findEnrollmentReview(schoolId, enrollmentId)
        return response.status(200).json(review)
    }

    @Patch('/documents/:documentId/review')
    @Roles([ROLES.RECTOR, ROLES.SECRETARY])
    async reviewDocument(request, response) {
        const { documentId } = request.params || {}
        const { decision, observation } = request.body || {}
        if (typeof documentId !== 'string' || !/^[0-9a-f-]{36}$/i.test(documentId)) {
            throw new InvalidFormatError('documentId debe ser un UUID válido')
        }
        if (!['approved', 'rejected'].includes(decision)) {
            throw new InvalidFormatError('decision debe ser approved o rejected')
        }
        if (decision === 'rejected' && (typeof observation !== 'string' || !observation.trim())) {
            throw new InvalidFormatError('La observación es obligatoria para rechazar')
        }
        const schoolId = request.user?.schoolId || request.user?.school?.id
        if (!schoolId) throw new InvalidFormatError('El usuario no tiene un colegio asociado')
        const result = await this.enrollmentService.reviewDocument(
            schoolId, documentId, decision, decision === 'rejected' ? observation.trim() : null, request.user?.id
        )
        return response.status(200).json(result)
    }

    @Post('/')
    @Public()
    async create(request, response) {
        const actor = request.user?.username ?? 'Public'
        const result = await this.enrollmentService.createDraft(request.body || {}, actor)
        return response.status(201).json(result)
    }

    @Post('/:id/documents')
    @Public()
    async addDocument(request, response) {
        const accessToken = request.headers?.['x-enrollment-token']
        if (typeof accessToken !== 'string') {
            throw new InvalidFormatError('Se requiere el encabezado x-enrollment-token')
        }
        const actor = request.user?.username ?? 'Public'
        const document = await this.enrollmentService.addDocument(
            request.params?.id,
            accessToken,
            request.body || {},
            actor
        )
        return response.status(201).json(document)
    }

    @Post('/:id/documents/upload-url')
    @Public()
    async createDocumentUpload(request, response) {
        const accessToken = request.headers?.['x-enrollment-token']
        if (typeof accessToken !== 'string') {
            throw new InvalidFormatError('Se requiere el encabezado x-enrollment-token')
        }
        const upload = await this.enrollmentService.createDocumentUpload(
            request.params?.id,
            accessToken,
            request.body || {}
        )
        return response.status(201).json(upload)
    }

    @Post('/:id/submit')
    @Public()
    async submit(request, response) {
        const accessToken = request.headers?.['x-enrollment-token']
        if (typeof accessToken !== 'string') {
            throw new InvalidFormatError('Se requiere el encabezado x-enrollment-token')
        }
        const result = await this.enrollmentService.submitDraft(
            request.params?.id,
            accessToken,
            request.user?.username ?? 'Public'
        )
        return response.status(201).json(result)
    }
}

export default EnrollmentController
