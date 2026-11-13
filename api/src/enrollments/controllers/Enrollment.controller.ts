import { Controller, Inject, Post, Public } from '../../core/decorators/decorators.js'
import { InvalidFormatError } from '../../core/errors/InvalidFormat.error.js'
import EnrollmentService from '../services/Enrollment.service.js'

@Controller('/enrollments')
export class EnrollmentController {
    constructor(
        @Inject(EnrollmentService)
        private enrollmentService: EnrollmentService
    ) { }

    @Post('/')
    @Public()
    async create(request, response) {
        const result = await this.enrollmentService.createDraft(request.body || {})
        return response.status(201).json(result)
    }

    @Post('/:id/documents')
    @Public()
    async addDocument(request, response) {
        const accessToken = request.headers?.['x-enrollment-token']
        if (typeof accessToken !== 'string') {
            throw new InvalidFormatError('Se requiere el encabezado x-enrollment-token')
        }
        const document = await this.enrollmentService.addDocument(
            request.params?.id,
            accessToken,
            request.body || {}
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
            accessToken
        )
        return response.status(201).json(result)
    }
}

export default EnrollmentController
