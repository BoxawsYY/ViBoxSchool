import { Inject, Service } from "../../core/decorators/decorators.js"
import RoleRepository from "../repositories/Role.repository.js"
import UserRepository from "../repositories/User.repository.js"
import Role from "../entities/Role.entity.js"
import { NotFoundError } from "../../core/errors/NotFound.error.js"
import { ForbiddenError } from "../../core/errors/Forbidden.error.js"
import { ROLES } from "../constants/authorities.js"
import { AlreadyExistError } from "../../core/errors/AlreadyExist.error.js"

@Service()
export class RoleService {

    constructor(
        @Inject(RoleRepository)
        private roleRepository: RoleRepository,
        @Inject(UserRepository)
        private userRepository: UserRepository
    ) { }

    async findAll() {
        return this.roleRepository.findAll()
    }

    async findByName(name: string) {
        const role = await this.roleRepository.findOneBy('name', name)

        if (!role) throw new NotFoundError(`El rol "${name}" no existe`)

        return role
    }

    async findManyByUserId(userId: string) {
        return this.roleRepository.findManyByUserId(userId)
    }

    async findById(id: string) {
        const role = await this.roleRepository.findById(id)

        if (!role) throw new NotFoundError('El rol no existe')

        return role
    }

    async create(role: Partial<Role>) {
        const roleExists = await this.roleRepository.findOneBy('name', role.name)

        if (roleExists) throw new AlreadyExistError(`El rol "${role.name}" ya existe`)

        return this.roleRepository.create(role)
    }

    async update(name: string, role: Partial<Role>) {

        if (name === ROLES.ADMIN) {
            throw new ForbiddenError('No se puede actualizar el rol Administrador')
        }

        const oldRole = await this.roleRepository.findOneBy('name', name)

        if (!oldRole) throw new NotFoundError(`El rol "${name}" que intenta actualizar no existe`)

        return this.roleRepository.update(oldRole.id, role)
    }

    async delete(name: string) {

        if (name === ROLES.ADMIN) {
            throw new ForbiddenError('No se puede eliminar el rol Administrador')
        }

        const role = await this.roleRepository.findOneBy('name', name)

        if (!role) throw new NotFoundError(`El rol "${name}" que intenta eliminar no existe`)

        return this.roleRepository.delete(role.id)
    }

    async activate(name: string) {
        const role = await this.roleRepository.findOneBy('name', name)

        if (!role) throw new NotFoundError(`El rol "${name}" que intenta activar no existe`)

        role.isActive = true

        await this.roleRepository.update(role.id, role)

        return role
    }

    async deactivate(name: string) {

        if (name === ROLES.ADMIN) {
            throw new ForbiddenError('No se puede desactivar el rol Administrador')
        }

        const role = await this.roleRepository.findOneBy('name', name)

        if (!role) throw new NotFoundError(`El rol "${name}" que intenta desactivar no existe`)

        role.isActive = false

        await this.roleRepository.update(role.id, role)

        return role
    }

    async assign(roles: string[], username: string) {

        const userFound = await this.userRepository.findOneBy('username', username)
        if (!userFound) throw new NotFoundError(`El usuario "${username}" al que intenta asignarle roles no existe`)

        const rolesFounds = await Promise.all(
            roles.map(role => this.roleRepository.findOneBy('name', role))
        )

        const missingRoleIndex = rolesFounds.findIndex(roleFound => !roleFound)
        if (missingRoleIndex !== -1) {
            const role = roles[missingRoleIndex]
            throw new NotFoundError(`El rol "${role}" que intenta asignar al usuario "${username}" no existe`)
        }

        const resolvedRoles = rolesFounds as Role[]

        for (const roleFound of resolvedRoles) {
            if (userFound.roles.find(p => p.id === roleFound.id)) throw new NotFoundError(`El usuario "${userFound.name}" ya tiene el rol "${roleFound.name}" asignado`)
        }

        await this.userRepository.update(userFound.id, { ...userFound, roles: [...userFound.roles, ...resolvedRoles] })
    }

    async revoke(roles: string[], username: string) {

        const userFound = await this.userRepository.findOneBy('username', username)
        if (!userFound) throw new NotFoundError(`El usuario "${username}" al que intenta revocar roles no existe`)

        const rolesFounds = []

        for (const role of roles) {
            const roleFound = await this.roleRepository.findOneBy('name', role)
            if (!roleFound) throw new NotFoundError(`El rol "${role}" que intenta revocar del usuario "${username}" no existe`)
            rolesFounds.push(roleFound)
        }

        for (const roleFound of rolesFounds) {
            if (!userFound.roles.find(p => p.id === roleFound.id)) throw new ForbiddenError(`El usuario "${userFound.name}" no tiene el rol "${roleFound.name}" asignado`)
        }

        await this.userRepository.update(userFound.id, { ...userFound, roles: userFound.roles.filter(p => !rolesFounds.map(pf => pf.id).includes(p.id)) })
    }

    async check(roles: string[], username: string) {

        const userFound = await this.userRepository.findOneBy('username', username)
        if (!userFound) throw new NotFoundError(`El usuario "${username}" al que intenta verificar no existe`)

        const rolesFounds = []

        for (const role of roles) {
            const roleFound = await this.roleRepository.findOneBy('name', role)
            if (!roleFound) throw new NotFoundError(`El rol "${role}" que intenta verificar del usuario "${username}" no existe`)
            rolesFounds.push(roleFound)
        }

        const checkedRoles = []

        for (const roleFound of rolesFounds) {
            if (userFound.roles.find(p => p.id === roleFound.id)) checkedRoles.push(roleFound.name)
        }

        return checkedRoles
    }


}

export default RoleService