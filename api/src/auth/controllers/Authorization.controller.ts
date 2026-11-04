import { Controller, Get, Post, Permissions, Inject } from '../../core/decorators/decorators.js'
import { ForbiddenError } from '../../core/errors/Forbidden.error.js'
import { NotFoundError } from '../../core/errors/NotFound.error.js'
import Validator from '../../core/utils/Validator.js'
import { PERMISSIONS } from '../constants/authorities.js'
import UserDTO from '../dtos/User.dto.js'
import PermissionService from '../services/Permission.service.js'
import RoleService from '../services/Role.service.js'
import UserService from '../services/User.service.js'

@Controller('/auth')
export class AuthorizationController {

    constructor(
        @Inject(UserService)
        private userService: UserService,
        @Inject(RoleService)
        private roleService: RoleService,
        @Inject(PermissionService)
        private permissionService: PermissionService
    ) { }

    @Get('/session')
    async session(request, response) {
        return response.status(200).json({ token: request.headers['authorization'] || request.cookies.accessToken, user: request.user })
    }

    @Get('/session/roles')
    async roles(request, response) {
        const roles = await this.roleService.findManyByUserId(request.user?.id)
        return response.status(200).json(roles.map(role => role.name))
    }

    @Get('/session/permissions')
    async permissions(request, response) {
        const permissions = await this.permissionService.findManyByUserId(request.user?.id)
        return response.status(200).json(permissions.map(permission => permission.name))
    }

    @Post('/authorize/:username')
    @Permissions([PERMISSIONS.USER.UPDATE])
    async authorize(request, response) {
        const { username } = request.params || {}

        Validator.required({ username })

        const userFound = await this.userService.findByUsername(username)
        if (!userFound) throw new NotFoundError(`El usuario "${username}" que intenta autorizar no existe`)

        const user = await this.userService.update(username, { isAuthorized: true })

        return response.status(200).json({ ...(new UserDTO(user)), message: `El usuario "${user.name}" ha sido autorizado exitosamente` })
    }

    @Post('/disauthorize/:username')
    @Permissions([PERMISSIONS.USER.UPDATE])
    async disauthorize(request, response) {
        const { username } = request.params || {}

        Validator.required({ username })

        const userFound = await this.userService.findByUsername(username)
        if (!userFound) throw new NotFoundError(`El usuario "${username}" que intenta desautorizar no existe`)

        if (userFound.id === request.user.id) throw new ForbiddenError('No puedes desautorizarte a ti mismo')

        const user = await this.userService.update(username, { isAuthorized: false })

        return response.status(200).json({ ...(new UserDTO(user)), message: `El usuario "${user.name}" ha sido desautorizado exitosamente` })
    }

}