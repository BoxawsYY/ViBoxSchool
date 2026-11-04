import { Controller, Inject, Permissions, Get, Post, Put, Delete, Patch } from '../../core/decorators/decorators.js'
import Validator from '../../core/utils/Validator.js'
import { PERMISSIONS } from '../constants/authorities.js'
import RoleService from '../services/Role.service.js'

@Controller('/auth')
export class RoleController {

    constructor(
        @Inject(RoleService)
        private roleService: RoleService
    ) { }

    @Get('/roles')
    @Permissions([PERMISSIONS.ROLE.READ])
    async getAll(request, response) {
        const roles = await this.roleService.findAll()

        return response.status(200).json(roles)
    }

    @Post('/roles')
    @Permissions([PERMISSIONS.ROLE.CREATE])
    async postOne(request, response) {
        const { name, alias, description } = request.body || {}

        Validator
            .required({ name, alias })
            .length({ name, alias }, 2, 500)

        const role = await this.roleService.create({ name, alias, description })

        return response.status(201).json(role)
    }

    @Get('/roles/:name')
    @Permissions([PERMISSIONS.ROLE.READ])
    async getByName(request, response) {
        const { name } = request.params || {}

        Validator
            .required({ name })
            .length({ name }, 2, 500)

        const role = await this.roleService.findByName(name)

        return response.status(200).json(role)
    }

    @Put('/roles/:name')
    @Permissions([PERMISSIONS.ROLE.UPDATE])
    async putByName(request, response) {
        const { name } = request.params || {}
        const { alias, description } = request.body || {}

        Validator
            .required({ name, alias })
            .length({ name, alias }, 2, 500)

        const role = await this.roleService.update(name, { name, alias, description })

        return response.status(200).json(role)
    }

    @Delete('/roles/:name')
    @Permissions([PERMISSIONS.ROLE.DELETE])
    async deleteByName(request, response) {
        const { name } = request.params || {}

        await this.roleService.delete(name)

        return response.status(200).json({ message: `Rol "${name}" eliminado correctamente` })
    }

    @Patch('/activate/roles/:name')
    @Permissions([PERMISSIONS.ROLE.UPDATE])
    async activate(request, response) {
        const { name } = request.params

        const role = await this.roleService.activate(name)

        return response.status(200).json(role)
    }

    @Patch('/deactivate/roles/:name')
    @Permissions([PERMISSIONS.ROLE.UPDATE])
    async deactivate(request, response) {
        const { name } = request.params

        const role = await this.roleService.deactivate(name)

        return response.status(200).json(role)
    }

    @Post('/assign/roles')
    @Permissions([PERMISSIONS.ROLE.ASSIGN_TO_USER])
    async assign(request, response) {
        const { roles, username } = request.body || {}

        Validator.required({ roles, username })
            .isArray({ roles })
            .length({ username }, 2, 500)

        await this.roleService.assign(roles, username)

        return response.status(200).json({ message: `Roles "${roles.join(',')}" asignados correctamente al usuario "${username}"` })
    }

    @Post('/revoke/roles')
    @Permissions([PERMISSIONS.ROLE.REVOKE_FROM_USER])
    async revoke(request, response) {
        const { roles, username } = request.body || {}

        Validator.required({ roles, username })
            .isArray({ roles })
            .length({ username }, 2, 500)

        await this.roleService.revoke(roles, username)

        return response.status(200).json({ message: `Roles "${roles.join(',')}" revocados correctamente del usuario "${username}"` })
    }

    @Post('/check/roles')
    @Permissions([PERMISSIONS.ROLE.CHECK_ON_USER])
    async check(request, response) {
        const { roles, username } = request.body || {}

        Validator.required({ roles, username })
            .isArray({ roles })
            .length({ username }, 2, 500)

        const checkedRoles = await this.roleService.check(roles, username)

        return response.status(200).json({ message: `Roles "${checkedRoles.join(',')}" verificados correctamente del usuario "${username}"` })
    }

}