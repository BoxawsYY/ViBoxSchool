import { Inject, Service } from "../../core/decorators/decorators.js"
import PermissionRepository from "../repositories/Permission.repository.js"
import RoleRepository from "../repositories/Role.repository.js"
import Permission from "../entities/Permission.entity.js"
import { NotFoundError } from "../../core/errors/NotFound.error.js"
import { ROLES } from "../constants/authorities.js"
import { ForbiddenError } from "../../core/errors/Forbidden.error.js"
import { AlreadyExistError } from "../../core/errors/AlreadyExist.error.js"

@Service()
export class PermissionService {

    constructor(
        @Inject(PermissionRepository)
        private permissionRepository: PermissionRepository,
        @Inject(RoleRepository)
        private roleRepository: RoleRepository
    ) { }

    async findAll() {
        return this.permissionRepository.findAll()
    }

    async findByName(name: string) {
        const permission = await this.permissionRepository.findOneBy('name', name)

        if (!permission) throw new NotFoundError(`El permiso "${name}" no existe`)

        return permission
    }

    async findManyByRoleId(roleId: string) {
        return this.permissionRepository.findManyByRoleId(roleId)
    }

    async findManyByUserId(userId: string) {
        return this.permissionRepository.findManyByUserId(userId)
    }

    async findById(id: string) {
        const permission = await this.permissionRepository.findById(id)

        if (!permission) throw new NotFoundError('El permiso no existe')

        return permission
    }

    async create(permission: Partial<Permission>) {
        const permissionExists = await this.permissionRepository.findOneBy('name', permission.name)

        if (permissionExists) throw new AlreadyExistError(`El permiso "${permission.name}" ya existe`)

        return this.permissionRepository.create(permission)
    }

    async update(name: string, permission: Partial<Permission>) {

        const oldPermission = await this.permissionRepository.findOneBy('name', name)

        if (!oldPermission) throw new NotFoundError(`El permiso "${name}" que intenta actualizar no existe`)

        return this.permissionRepository.update(oldPermission.id, permission)
    }

    async delete(name: string) {
        const permission = await this.permissionRepository.findOneBy('name', name)

        if (!permission) throw new NotFoundError(`El permiso "${name}" que intenta eliminar no existe`)

        return this.permissionRepository.delete(permission.id)
    }

    async assign(permissions: string[], role: string) {

        const roleFound = await this.roleRepository.findOneBy('name', role)
        if (!roleFound) throw new NotFoundError(`El rol "${role}" al que intenta asignarle permisos no existe`)

        const permissionsFounds = []

        for (const permission of permissions) {
            const permissionFound = await this.permissionRepository.findOneBy('name', permission)
            if (!permissionFound) throw new NotFoundError(`El permiso "${permission}" que intenta asignar al rol "${role}" no existe`)
            permissionsFounds.push(permissionFound)
        }

        for (const permissionFound of permissionsFounds) {
            if (roleFound.permissions.find(p => p.id === permissionFound.id)) throw new NotFoundError(`El rol "${roleFound.name}" ya tiene el permiso "${permissionFound.name}" asignado`)
        }

        await this.roleRepository.update(roleFound.id, { ...roleFound, permissions: [...roleFound.permissions, ...permissionsFounds] })
    }

    async revoke(permissions: string[], role: string) {

        if (role === ROLES.ADMIN) {
            throw new ForbiddenError('No se pueden revocar permisos al rol Administrador')
        }

        const roleFound = await this.roleRepository.findOneBy('name', role)
        if (!roleFound) throw new NotFoundError(`El rol "${role}" al que intenta revocar permisos no existe`)

        const permissionsFounds = []

        for (const permission of permissions) {
            const permissionFound = await this.permissionRepository.findOneBy('name', permission)
            if (!permissionFound) throw new NotFoundError(`El permiso "${permission}" que intenta revocar del rol "${role}" no existe`)
            permissionsFounds.push(permissionFound)
        }

        for (const permissionFound of permissionsFounds) {
            if (!roleFound.permissions.find(p => p.id === permissionFound.id)) throw new ForbiddenError(`El rol "${roleFound.name}" no tiene el permiso "${permissionFound.name}" asignado`)
        }

        await this.roleRepository.update(roleFound.id, { ...roleFound, permissions: roleFound.permissions.filter(p => !permissionsFounds.map(pf => pf.id).includes(p.id)) })
    }

    async check(permissions: string[], role: string) {

        const roleFound = await this.roleRepository.findOneBy('name', role)
        if (!roleFound) throw new NotFoundError(`El rol "${role}" al que intenta verificar permisos no existe`)

        const permissionsFounds = []

        for (const permission of permissions) {
            const permissionFound = await this.permissionRepository.findOneBy('name', permission)
            if (!permissionFound) throw new NotFoundError(`El permiso "${permission}" que intenta verificar del rol "${role}" no existe`)
            permissionsFounds.push(permissionFound)
        }

        const checkedPermissions = []

        for (const permissionFound of permissionsFounds) {
            if (roleFound.permissions.find(p => p.id === permissionFound.id)) checkedPermissions.push(permissionFound.name)
        }

        return checkedPermissions
    }


}

export default PermissionService