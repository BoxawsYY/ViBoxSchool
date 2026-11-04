import { Controller, Inject, Permissions, Get, Post, Put, Delete } from '../../core/decorators/decorators.js'
import Validator from '../../core/utils/Validator.js'
import { PERMISSIONS } from '../constants/authorities.js'
import PermissionService from '../services/Permission.service.js'

@Controller('/auth')
export class PermissionController {

    constructor(
        @Inject(PermissionService)
        private permissionService: PermissionService
    ) { }

    @Get('/permissions')
    @Permissions([PERMISSIONS.PERMISSION.READ])
    async getAll(request, response) {
        const permissions = await this.permissionService.findAll()

        return response.status(200).json(permissions)
    }

    @Post('/permissions')
    @Permissions([PERMISSIONS.PERMISSION.CREATE])
    async postOne(request, response) {
        const { name, alias, description, type } = request.body || {}

        Validator
            .required({ name, alias, type })
            .isIn({ type }, ['Access', 'Create', 'Read', 'Update', 'Delete', 'Assign', 'Check', 'Revoke'])
            .length({ name, alias }, 2, 500)

        const permission = await this.permissionService.create({ name, alias, description, type })

        return response.status(201).json(permission)
    }

    @Get('/permissions/:name')
    @Permissions([PERMISSIONS.PERMISSION.READ])
    async getByName(request, response) {
        const { name } = request.params || {}

        Validator
            .required({ name })
            .length({ name }, 2, 500)

        const permission = await this.permissionService.findByName(name)

        return response.status(200).json(permission)
    }

    @Put('/permissions/:name')
    @Permissions([PERMISSIONS.PERMISSION.UPDATE])
    async putByName(request, response) {
        const { name } = request.params || {}
        const { alias, description, type } = request.body || {}

        Validator
            .required({ name, alias, type })
            .isIn({ type }, ['Access', 'Create', 'Read', 'Update', 'Delete', 'Assign', 'Check', 'Revoke'])
            .length({ name, alias }, 2, 500)

        const permission = await this.permissionService.update(name, { name, alias, description, type })

        return response.status(200).json(permission)
    }

    @Delete('/permissions/:name')
    @Permissions([PERMISSIONS.PERMISSION.DELETE])
    async deleteByName(request, response) {
        const { name } = request.params || {}

        await this.permissionService.delete(name)

        return response.status(200).json({ message: `Permiso "${name}" eliminado correctamente` })
    }

    @Post('/assign/permissions')
    @Permissions([PERMISSIONS.PERMISSION.ASSIGN_TO_ROLE])
    async assign(request, response) {
        const { permissions, role } = request.body || {}

        Validator.required({ permissions, role })
            .isArray({ permissions })
            .length({ role }, 2, 500)

        await this.permissionService.assign(permissions, role)

        return response.status(200).json({ message: `Permisos "${permissions.join(',')}" asignados correctamente al rol "${role}"` })
    }

    @Post('/revoke/permissions')
    @Permissions([PERMISSIONS.PERMISSION.REVOKE_FROM_ROLE])
    async revoke(request, response) {
        const { permissions, role } = request.body || {}

        Validator.required({ permissions, role })
            .isArray({ permissions })
            .length({ role }, 2, 500)

        await this.permissionService.revoke(permissions, role)

        return response.status(200).json({ message: `Permisos "${permissions.join(',')}" revocados correctamente del rol "${role}"` })
    }

    @Post('/check/permissions')
    @Permissions([PERMISSIONS.PERMISSION.CHECK_ON_ROLE])
    async check(request, response) {
        const { permissions, role } = request.body || {}

        Validator.required({ permissions, role })
            .isArray({ permissions })
            .length({ role }, 2, 500)

        const checkedPermissions = await this.permissionService.check(permissions, role)

        return response.status(200).json({ message: `Permisos "${checkedPermissions.join(',')}" verificados correctamente del rol "${role}"` })
    }

}