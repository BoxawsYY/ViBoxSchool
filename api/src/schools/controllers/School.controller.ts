import { Controller, Get, Inject, Patch, Post, Public, Roles } from '../../core/decorators/decorators.js'
import { ROLES } from '../../auth/constants/authorities.js'
import { InvalidFormatError } from '../../core/errors/InvalidFormat.error.js'
import Validator from '../../core/utils/Validator.js'
import SchoolPublicDTO from '../dtos/SchoolPublic.dto.js'
import SchoolService from '../services/School.service.js'

@Controller('/schools')
export class SchoolController {

    constructor(
        @Inject(SchoolService)
        private schoolService: SchoolService
    ) { }

    @Get('/')
    @Roles([ROLES.ADMIN])
    async findAll(request, response) {
        const schools = await this.schoolService.findAllForAdmin()
        return response.status(200).json(schools)
    }

    @Post('/')
    @Roles([ROLES.ADMIN])
    async create(request, response) {
        const {
            code, name, nit, city, department, address, phone, email,
            officeHours, levelsOffered, description, logoUrl, brandColor, isPartner, status
        } = request.body || {}

        Validator.required({ name, nit, city, email })
        Validator.type({ name, nit, city, email }, 'string')
        if (code !== undefined) {
            Validator.type({ code }, 'string')
            Validator.length({ code }, 2, 80)
        }
        Validator.length({ name }, 2, 160)
        Validator.length({ nit }, 3, 32)
        Validator.length({ city }, 2, 100)
        Validator.email({ email })

        const optionalTextFields = {
            department, address, phone, email, officeHours, levelsOffered, description, logoUrl, brandColor, status
        }
        for (const [field, value] of Object.entries(optionalTextFields)) {
            if (value !== undefined && value !== null && typeof value !== 'string') {
                throw new InvalidFormatError(`${field} debe ser texto`)
            }
        }
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(code)) {
            throw new InvalidFormatError('El código debe usar minúsculas, números y guiones')
        }
        if (logoUrl) Validator.url({ logoUrl })
        if (brandColor && !/^#[\da-f]{6}$/i.test(brandColor)) {
            throw new InvalidFormatError('El color institucional debe ser un HEX de 6 dígitos')
        }
        if (isPartner !== undefined && typeof isPartner !== 'boolean') {
            throw new InvalidFormatError('isPartner debe ser booleano')
        }
        const school = await this.schoolService.create({
            code: code?.trim(),
            name: name.trim(),
            nit: nit.trim(),
            city: city.trim(),
            department: department?.trim(),
            address: address?.trim(),
            phone: phone?.trim(),
            email: email?.trim(),
            officeHours: officeHours?.trim(),
            levelsOffered: levelsOffered?.trim(),
            description: description?.trim(),
            logoUrl: logoUrl?.trim(),
            brandColor: brandColor?.trim(),
            isPartner: isPartner ?? false,
            status: 'active'
        })
        return response.status(201).json(school)
    }

    @Patch('/:id')
    @Roles([ROLES.ADMIN])
    async update(request, response) {
        const { id } = request.params || {}
        const { name, nit, city, email, brandColor, isPartner } = request.body || {}

        Validator.required({ id, name, nit, city, email })
        Validator.isUUID({ id })
        Validator.type({ name, nit, city, email }, 'string')
        Validator.length({ name }, 2, 160)
        Validator.length({ nit }, 3, 32)
        Validator.length({ city }, 2, 100)
        Validator.email({ email })

        if (brandColor !== undefined && brandColor !== null
            && (typeof brandColor !== 'string' || !/^#[\da-f]{6}$/i.test(brandColor))) {
            throw new InvalidFormatError('El color institucional debe ser un HEX de 6 dígitos')
        }
        if (isPartner !== undefined && typeof isPartner !== 'boolean') {
            throw new InvalidFormatError('isPartner debe ser booleano')
        }

        const school = await this.schoolService.update(id, {
            name: name.trim(),
            nit: nit.trim(),
            city: city.trim(),
            email: email.trim(),
            ...(brandColor !== undefined ? { brandColor: brandColor?.trim() } : {}),
            isPartner
        })
        return response.status(200).json(school)
    }

    @Patch('/:id/deactivate')
    @Roles([ROLES.ADMIN])
    async deactivate(request, response) {
        const { id } = request.params || {}
        Validator.required({ id })
        Validator.isUUID({ id })

        const school = await this.schoolService.deactivate(id)
        return response.status(200).json(school)
    }

    @Patch('/:id/status')
    @Roles([ROLES.ADMIN])
    async updateStatus(request, response) {
        const { id } = request.params || {}
        const { status } = request.body || {}
        Validator.required({ id, status })
        Validator.isUUID({ id })
        if (!['active', 'suspended'].includes(status)) {
            throw new InvalidFormatError('El estado debe ser active o suspended')
        }

        const school = await this.schoolService.updateStatus(id, status)
        return response.status(200).json(school)
    }

    @Get('/discover')
    @Public()
    async discover(request, response) {
        const schools = await this.schoolService.findDiscoverable()

        return response.status(200).json(schools.map(school => new SchoolPublicDTO(school)))
    }

    @Get('/:code')
    @Public()
    async findPublicByCode(request, response) {
        const { code } = request.params || {}

        Validator.required({ code })

        const school = await this.schoolService.findDiscoverableByCode(code)

        return response.status(200).json(new SchoolPublicDTO(school))
    }
}

export default SchoolController
