import { Controller, Delete, Get, Inject, Patch, Post, Roles } from '../../core/decorators/decorators.js'
import { ROLES } from '../../auth/constants/authorities.js'
import { InvalidFormatError } from '../../core/errors/InvalidFormat.error.js'
import Validator from '../../core/utils/Validator.js'
import GlobalUserService, { GlobalUserInput } from '../services/GlobalUser.service.js'
import { DEFAULT_PAGE_SIZE, MANAGED_ROLES, MAX_PAGE_SIZE, RELATIONSHIPS, USER_STATUS } from '../constants/globalUsers.js'

const OPTIONAL_TEXT_FIELDS = [
    'username', 'documentType', 'documentNumber', 'phoneNumber', 'gender',
    'birthdate', 'country', 'city', 'address', 'image', 'studentId', 'relationship'
] as const

const GENDERS = ['F', 'M', 'O']
const USERNAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9._@-]{2,79}$/

const trimOrNull = (value: unknown) => typeof value === 'string' && value.trim() ? value.trim() : null

/**
 * Gestión de "Usuarios globales" desde el panel del Administrador.
 * Separado de /auth/users, que sigue funcionando con permisos.
 */
@Controller('/admin/users')
export class GlobalUserController {

    constructor(
        @Inject(GlobalUserService)
        private globalUserService: GlobalUserService
    ) { }

    // Debe declararse antes de '/:id' para que Express no lo trate como un id.
    @Get('/summary')
    @Roles([ROLES.ADMIN])
    async summary(request, response) {
        const summary = await this.globalUserService.summary()
        return response.status(200).json(summary)
    }

    // Estudiantes de un colegio, para asociarlos a un Padre de familia.
    @Get('/students')
    @Roles([ROLES.ADMIN])
    async students(request, response) {
        const { schoolId } = request.query || {}
        Validator.required({ schoolId }).isUUID({ schoolId })

        const students = await this.globalUserService.findStudentsBySchool(schoolId)
        return response.status(200).json(students)
    }

    @Get('/')
    @Roles([ROLES.ADMIN])
    async list(request, response) {
        const { search, role, schoolId, status, limit, offset } = request.query || {}

        if (role) Validator.isIn({ role }, [...MANAGED_ROLES])
        if (status) Validator.isIn({ status }, Object.values(USER_STATUS))
        if (schoolId && schoolId !== 'platform') Validator.isUUID({ schoolId })

        const parsedLimit = Math.min(Math.max(Number.parseInt(limit, 10) || DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE)
        const parsedOffset = Math.max(Number.parseInt(offset, 10) || 0, 0)

        const result = await this.globalUserService.list({
            search: typeof search === 'string' ? search.trim() : undefined,
            role,
            schoolId,
            status,
            limit: parsedLimit,
            offset: parsedOffset
        })
        return response.status(200).json(result)
    }

    @Get('/:id')
    @Roles([ROLES.ADMIN])
    async findById(request, response) {
        const { id } = request.params || {}
        Validator.required({ id }).isUUID({ id })

        const user = await this.globalUserService.findById(id)
        return response.status(200).json(user)
    }

    @Post('/')
    @Roles([ROLES.ADMIN])
    async create(request, response) {
        const input = this.parseInput(request.body, true)
        const user = await this.globalUserService.create(input, request.user)
        return response.status(201).json(user)
    }

    @Patch('/:id')
    @Roles([ROLES.ADMIN])
    async update(request, response) {
        const { id } = request.params || {}
        Validator.required({ id }).isUUID({ id })

        const input = this.parseInput(request.body, false)
        const user = await this.globalUserService.update(id, input, request.user)
        return response.status(200).json(user)
    }

    @Patch('/:id/status')
    @Roles([ROLES.ADMIN])
    async updateStatus(request, response) {
        const { id } = request.params || {}
        const { status } = request.body || {}
        Validator.required({ id, status }).isUUID({ id }).isIn({ status }, Object.values(USER_STATUS))

        const user = await this.globalUserService.updateStatus(id, status, request.user)
        return response.status(200).json(user)
    }

    @Delete('/:id')
    @Roles([ROLES.ADMIN])
    async delete(request, response) {
        const { id } = request.params || {}
        Validator.required({ id }).isUUID({ id })

        await this.globalUserService.delete(id, request.user)
        return response.status(200).json({ message: 'Usuario eliminado correctamente' })
    }

    private parseInput(body: any, isCreate: boolean): GlobalUserInput {
        const { name, email, role, schoolId, password } = body || {}

        Validator.required({ name, email, username: body?.username, role })
        Validator.type({ name, email, username: body?.username, role }, 'string')
        Validator.length({ name: name.trim() }, 2, 120)
        Validator.email({ email: email.trim() })
        Validator.isIn({ role }, [...MANAGED_ROLES])

        if (schoolId !== undefined && schoolId !== null && schoolId !== '') {
            Validator.type({ schoolId }, 'string')
            Validator.isUUID({ schoolId })
        }

        for (const field of OPTIONAL_TEXT_FIELDS) {
            const value = body?.[field]
            if (value !== undefined && value !== null && typeof value !== 'string') {
                throw new InvalidFormatError(`${field} debe ser texto`)
            }
        }

        const username = body.username.trim()
        if (!USERNAME_REGEX.test(username)) {
            throw new InvalidFormatError('El usuario debe tener entre 3 y 80 caracteres: letras, números, punto, guion, guion bajo o @')
        }
        const gender = trimOrNull(body?.gender)
        if (gender) Validator.isIn({ gender }, GENDERS)
        const birthdate = trimOrNull(body?.birthdate)
        if (birthdate) {
            Validator.isDate({ birthdate })
            if (new Date(birthdate) > new Date()) throw new InvalidFormatError('La fecha de nacimiento no puede ser futura')
        }
        const image = trimOrNull(body?.image)
        if (image) Validator.url({ image })

        const studentId = trimOrNull(body?.studentId)
        const relationship = trimOrNull(body?.relationship)
        if (role === ROLES.GUARDIAN) {
            Validator.required({ studentId, relationship })
            Validator.isUUID({ studentId })
            Validator.isIn({ relationship }, RELATIONSHIPS)
        }

        if (isCreate) Validator.required({ password })
        if (password !== undefined && password !== null && password !== '') {
            Validator.type({ password }, 'string')
            Validator.isStrongPassword({ password })
        }

        return {
            name: name.trim(),
            username,
            email: email.trim(),
            role,
            schoolId: trimOrNull(schoolId),
            documentType: trimOrNull(body.documentType),
            documentNumber: trimOrNull(body.documentNumber),
            phoneNumber: trimOrNull(body.phoneNumber),
            gender,
            birthdate,
            country: trimOrNull(body.country),
            city: trimOrNull(body.city),
            address: trimOrNull(body.address),
            image,
            studentId,
            relationship,
            password: password || undefined
        }
    }
}

export default GlobalUserController
