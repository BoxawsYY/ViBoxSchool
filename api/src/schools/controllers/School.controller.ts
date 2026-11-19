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

    @Get('/me')
    @Roles([ROLES.RECTOR])
    async findMine(request, response) {
        const schoolId = request.user?.schoolId || request.user?.school?.id
        if (!schoolId) throw new InvalidFormatError('El usuario no tiene un colegio asociado')
        const school = await this.schoolService.findForRector(schoolId)
        return response.status(200).json(school)
    }

    @Patch('/me')
    @Roles([ROLES.RECTOR])
    async updateMine(request, response) {
        const schoolId = request.user?.schoolId || request.user?.school?.id
        if (!schoolId) throw new InvalidFormatError('El usuario no tiene un colegio asociado')
        const body = request.body || {}
        const { name, city, department, address, phone, email, officeHours, levelsOffered, description, logoUrl, brandColor } = body
        Validator.required({ name, city, department, email })
        Validator.type({ name, city, department, email }, 'string')
        Validator.length({ name }, 2, 160)
        Validator.length({ city }, 2, 100)
        Validator.length({ department }, 2, 100)
        Validator.email({ email })

        const editableText = { address, phone, officeHours, description, logoUrl }
        for (const [field, value] of Object.entries(editableText)) {
            if (value !== undefined && value !== null && typeof value !== 'string') {
                throw new InvalidFormatError(`${field} debe ser texto`)
            }
        }
        if (logoUrl) Validator.url({ logoUrl })
        const availableLevels = ['Preescolar', 'Básica Primaria (1° a 5°)', 'Básica Secundaria (6° a 9°)', 'Media (10° a 11°)']
        if (levelsOffered !== undefined && typeof levelsOffered !== 'string') {
            throw new InvalidFormatError('levelsOffered debe ser una lista de niveles separada por comas')
        }
        const selectedLevels = typeof levelsOffered === 'string'
            ? levelsOffered.split(',').map(level => level.trim()).filter(Boolean)
            : []
        const unknownLevels = selectedLevels.filter(level => !availableLevels.includes(level))
        if (unknownLevels.length) {
            throw new InvalidFormatError(`Niveles no válidos: ${unknownLevels.join(', ')}`)
        }
        const normalizedLevels = availableLevels.filter(level => selectedLevels.includes(level)).join(', ')
        if (brandColor !== undefined && brandColor !== null
            && (typeof brandColor !== 'string' || !/^#[\da-f]{6}$/i.test(brandColor))) {
            throw new InvalidFormatError('El color institucional debe ser un HEX de 6 dígitos')
        }

        const school = await this.schoolService.updateForRector(schoolId, {
            name: name.trim(), city: city.trim(), department: department.trim(), email: email.trim(),
            ...Object.fromEntries(Object.entries(editableText).map(([field, value]) => [field, typeof value === 'string' ? value.trim() : value])),
            ...(levelsOffered !== undefined ? { levelsOffered: normalizedLevels } : {}),
            ...(brandColor !== undefined ? { brandColor } : {})
        })
        return response.status(200).json(school)
    }

    @Get('/me/academic-settings')
    @Roles([ROLES.RECTOR])
    async findMyAcademicSettings(request, response) {
        const schoolId = request.user?.schoolId || request.user?.school?.id
        if (!schoolId) throw new InvalidFormatError('El usuario no tiene un colegio asociado')
        const includeInactive = request.query?.includeInactive === 'true'
        const settings = await this.schoolService.getAcademicSettingsForRector(schoolId, includeInactive)
        return response.status(200).json(settings)
    }

    @Patch('/me/academic-settings/grades/:gradeId/status')
    @Roles([ROLES.RECTOR])
    async setMyGradeStatus(request, response) {
        const schoolId = request.user?.schoolId || request.user?.school?.id
        const { gradeId } = request.params || {}
        const { isActive } = request.body || {}
        if (!schoolId) throw new InvalidFormatError('El usuario no tiene un colegio asociado')
        Validator.isUUID({ id: gradeId })
        if (typeof isActive !== 'boolean') throw new InvalidFormatError('isActive debe ser booleano')
        const grade = await this.schoolService.setGradeActiveForRector(schoolId, gradeId, isActive)
        return response.status(200).json(grade)
    }

    @Patch('/me/academic-settings')
    @Roles([ROLES.RECTOR])
    async updateMyAcademicSettings(request, response) {
        const schoolId = request.user?.schoolId || request.user?.school?.id
        if (!schoolId) throw new InvalidFormatError('El usuario no tiene un colegio asociado')
        const { enrollmentPeriod, gradePeriods } = request.body || {}
        if (!enrollmentPeriod || typeof enrollmentPeriod !== 'object' || Array.isArray(enrollmentPeriod)) {
            throw new InvalidFormatError('Se requiere la configuración del periodo de matrícula')
        }
        const { startDate, endDate, lateFeePercentage, lateFeeDay, applyLateFee } = enrollmentPeriod
        const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
            && !Number.isNaN(Date.parse(`${value}T00:00:00`))
        if (!validDate(startDate) || !validDate(endDate) || endDate < startDate) {
            throw new InvalidFormatError('Las fechas del periodo no son válidas')
        }
        if (!Number.isFinite(Number(lateFeePercentage)) || Number(lateFeePercentage) < 0 || Number(lateFeePercentage) > 100) {
            throw new InvalidFormatError('El recargo debe estar entre 0 y 100 por ciento')
        }
        if (!Number.isInteger(Number(lateFeeDay)) || Number(lateFeeDay) < 1 || Number(lateFeeDay) > 31) {
            throw new InvalidFormatError('El día límite debe estar entre 1 y 31')
        }
        if (typeof applyLateFee !== 'boolean') throw new InvalidFormatError('applyLateFee debe ser booleano')
        if (!Array.isArray(gradePeriods) || !gradePeriods.length) {
            throw new InvalidFormatError('Debe configurar al menos un grado')
        }
        const frequencies = ['monthly', 'bimonthly', 'quarterly', 'semiannual', 'annual']
        const normalizedGrades = gradePeriods.map((grade, index) => {
            if (!grade || typeof grade.name !== 'string' || !grade.name.trim() || grade.name.trim().length > 60) {
                throw new InvalidFormatError(`El nombre del grado ${index + 1} no es válido`)
            }
            if (grade.gradeId && !/^[0-9a-f-]{36}$/i.test(grade.gradeId)) {
                throw new InvalidFormatError(`El identificador del grado ${index + 1} no es válido`)
            }
            const maxCapacity = Number(grade.maxCapacity)
            const enrollmentFee = Number(grade.enrollmentFee)
            const tuitionFee = Number(grade.tuitionFee)
            if (!Number.isInteger(maxCapacity) || maxCapacity < 0
                || !Number.isFinite(enrollmentFee) || enrollmentFee < 0
                || !Number.isFinite(tuitionFee) || tuitionFee < 0) {
                throw new InvalidFormatError(`Los cupos y valores del grado ${grade.name} no son válidos`)
            }
            if (!frequencies.includes(grade.billingFrequency)) {
                throw new InvalidFormatError(`La periodicidad del grado ${grade.name} no es válida`)
            }
            return { ...grade, name: grade.name.trim(), maxCapacity, enrollmentFee, tuitionFee }
        })
        const settings = await this.schoolService.saveAcademicSettingsForRector(schoolId, {
            enrollmentPeriod: {
                startDate, endDate, lateFeePercentage: Number(lateFeePercentage),
                lateFeeDay: Number(lateFeeDay), applyLateFee
            },
            gradePeriods: normalizedGrades
        })
        return response.status(200).json(settings)
    }

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

        Validator.required({ name, nit, city, department, email })
        Validator.type({ name, nit, city, department, email }, 'string')
        if (code !== undefined) {
            Validator.type({ code }, 'string')
            Validator.length({ code }, 2, 80)
        }
        Validator.length({ name }, 2, 160)
        Validator.length({ nit }, 3, 32)
        Validator.length({ city }, 2, 100)
        Validator.length({ department }, 2, 100)
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
        const { name, nit, city, department, email, brandColor, isPartner } = request.body || {}

        Validator.required({ id, name, nit, city, department, email })
        Validator.isUUID({ id })
        Validator.type({ name, nit, city, department, email }, 'string')
        Validator.length({ name }, 2, 160)
        Validator.length({ nit }, 3, 32)
        Validator.length({ city }, 2, 100)
        Validator.length({ department }, 2, 100)
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
            department: department.trim(),
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
