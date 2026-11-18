import bcrypt from 'bcrypt'
import { Inject, Service } from '../../core/decorators/decorators.js'
import { AlreadyExistError } from '../../core/errors/AlreadyExist.error.js'
import { ForbiddenError } from '../../core/errors/Forbidden.error.js'
import { InvalidFormatError } from '../../core/errors/InvalidFormat.error.js'
import { NotFoundError } from '../../core/errors/NotFound.error.js'
import { ROLES } from '../../auth/constants/authorities.js'
import GlobalUserDTO from '../dtos/GlobalUser.dto.js'
import GlobalUserRepository, { GlobalUserFilters } from '../repositories/GlobalUser.repository.js'
import { MANAGED_ROLES, SCHOOL_ROLES } from '../constants/globalUsers.js'

export interface GlobalUserInput {
    name: string
    username: string
    email: string
    role: string
    schoolId?: string | null
    documentType?: string | null
    documentNumber?: string | null
    phoneNumber?: string | null
    gender?: string | null
    birthdate?: string | null
    country?: string | null
    city?: string | null
    address?: string | null
    image?: string | null
    studentId?: string | null
    relationship?: string | null
    password?: string
}

interface Actor {
    id: string
    username: string
}

@Service()
export class GlobalUserService {

    constructor(
        @Inject(GlobalUserRepository)
        private globalUserRepository: GlobalUserRepository
    ) { }

    async list(filters: GlobalUserFilters) {
        const { rows, total } = await this.globalUserRepository.list(filters)

        return {
            items: rows.map(row => new GlobalUserDTO(row)),
            total,
            limit: filters.limit,
            offset: filters.offset
        }
    }

    async summary() {
        const rows = await this.globalUserRepository.summary()
        const byRole = Object.fromEntries(rows.map(row => [row.role, row]))
        const count = (role: string) => byRole[role]?.users ?? 0

        return {
            total: MANAGED_ROLES.reduce((sum, role) => sum + count(role), 0),
            guardians: { users: count(ROLES.GUARDIAN), schools: byRole[ROLES.GUARDIAN]?.schools ?? 0 },
            secretaries: { users: count(ROLES.SECRETARY) },
            rectors: { users: count(ROLES.RECTOR) },
            admins: { users: count(ROLES.ADMIN) }
        }
    }

    async findStudentsBySchool(schoolId: string) {
        const school = await this.globalUserRepository.findSchool(schoolId)
        if (!school) throw new NotFoundError('El colegio no existe')

        return this.globalUserRepository.findStudentsBySchool(schoolId)
    }

    async findById(id: string) {
        const user = await this.globalUserRepository.findDetail(id)
        if (!user) throw new NotFoundError('El usuario no existe')

        return new GlobalUserDTO(user)
    }

    async create(input: GlobalUserInput, actor: Actor) {
        if (!input.password) throw new InvalidFormatError('La contraseña es obligatoria')

        const data = await this.resolve(input)
        const created = await this.globalUserRepository.createUser({
            ...data,
            password: await bcrypt.hash(input.password, 10)
        }, actor.username)

        return new GlobalUserDTO(created)
    }

    async update(id: string, input: GlobalUserInput, actor: Actor) {
        const current = await this.globalUserRepository.findDetail(id)
        if (!current) throw new NotFoundError('El usuario no existe')

        if (current.role === ROLES.ADMIN && input.role !== ROLES.ADMIN) {
            if (id === actor.id) throw new ForbiddenError('No puedes quitarte a ti mismo el rol de Administrador')
            await this.assertAnotherAdminRemains(id)
        }

        const data = await this.resolve(input, id)
        const updated = await this.globalUserRepository.updateUser(id, {
            ...data,
            password: input.password ? await bcrypt.hash(input.password, 10) : undefined
        }, actor.username)

        return new GlobalUserDTO(updated)
    }

    async updateStatus(id: string, status: 'active' | 'blocked', actor: Actor) {
        const current = await this.globalUserRepository.findDetail(id)
        if (!current) throw new NotFoundError('El usuario no existe')

        if (status === 'blocked') {
            if (id === actor.id) throw new ForbiddenError('No puedes bloquear tu propia cuenta')
            if (current.role === ROLES.ADMIN) await this.assertAnotherAdminRemains(id)
        }

        const updated = await this.globalUserRepository.setAuthorized(id, status === 'active', actor.username)
        return new GlobalUserDTO(updated)
    }

    async delete(id: string, actor: Actor) {
        const current = await this.globalUserRepository.findDetail(id)
        if (!current) throw new NotFoundError('El usuario no existe')

        if (id === actor.id) throw new ForbiddenError('No puedes eliminar tu propia cuenta')
        if (current.role === ROLES.ADMIN) await this.assertAnotherAdminRemains(id)

        await this.globalUserRepository.softDelete(id, actor.username)
    }

    /**
     * Valida rol, colegio, correo y la regla de un Rector por colegio.
     * Regla principal: todo usuario que no sea Administrador pertenece a un colegio.
     */
    private async resolve(input: GlobalUserInput, excludeId?: string) {
        const role = await this.globalUserRepository.findRoleByName(input.role)
        if (!role) throw new NotFoundError(`El rol "${input.role}" no está configurado en la base de datos`)

        let schoolId: string | null = null

        if (SCHOOL_ROLES.includes(input.role)) {
            if (!input.schoolId) throw new InvalidFormatError('Este rol debe estar asociado a un colegio')

            const school = await this.globalUserRepository.findSchool(input.schoolId)
            if (!school) throw new NotFoundError('El colegio seleccionado no existe')

            schoolId = school.id

            if (input.role === ROLES.GUARDIAN) {
                if (!input.studentId) throw new InvalidFormatError('El Padre de familia debe estar asociado a un estudiante')
                if (!input.relationship) throw new InvalidFormatError('Indica el parentesco con el estudiante')

                const student = await this.globalUserRepository.findStudent(input.studentId)
                if (!student) throw new NotFoundError('El estudiante seleccionado no existe')
                if (student.schoolId !== schoolId) {
                    throw new InvalidFormatError(`${student.name} no pertenece a ${school.name}`)
                }
            }

            if (input.role === ROLES.RECTOR) {
                const rector = await this.globalUserRepository.findRectorOfSchool(schoolId, excludeId)
                if (rector) throw new AlreadyExistError(`${school.name} ya tiene un rector asignado (${rector.name})`)
            }
        }

        const email = input.email.toLowerCase()
        const username = input.username

        const emailOwner = await this.globalUserRepository.findByLogin(email, excludeId)
        if (emailOwner) {
            throw new AlreadyExistError(emailOwner.isDeleted
                ? 'Ese correo pertenece a un usuario eliminado; usa otro correo'
                : 'Ya existe un usuario con ese correo')
        }
        const usernameOwner = await this.globalUserRepository.findByLogin(username, excludeId)
        if (usernameOwner) throw new AlreadyExistError(`El usuario "${username}" ya está en uso`)

        return {
            name: input.name,
            username,
            email,
            documentType: input.documentType || null,
            documentNumber: input.documentNumber || null,
            phoneNumber: input.phoneNumber || null,
            gender: input.gender || null,
            birthdate: input.birthdate || null,
            country: input.country || null,
            city: input.city || null,
            address: input.address || null,
            image: input.image || null,
            schoolId,
            roleId: role.id,
            roleName: role.name,
            studentId: input.role === ROLES.GUARDIAN ? input.studentId : null,
            relationship: input.role === ROLES.GUARDIAN ? input.relationship : null
        }
    }

    private async assertAnotherAdminRemains(id: string) {
        const admins = await this.globalUserRepository.countActiveAdmins(id)
        if (admins < 1) throw new ForbiddenError('Debe quedar al menos un Administrador activo en la plataforma')
    }
}

export default GlobalUserService
