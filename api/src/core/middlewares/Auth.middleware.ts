import jwt from "jsonwebtoken"
import { Inject, Middleware } from "../decorators/decorators.js"
import BlockedTokenService from "../../auth/services/BlockedToken.service.js"
import PermissionService from "../../auth/services/Permission.service.js"
import RoleService from "../../auth/services/Role.service.js"
import UserService from "../../auth/services/User.service.js"
import { TokenRequiredError } from "../errors/TokenRequired.error.js"
import { UnauthorizedError } from "../errors/Unauthorized.error.js"
import UserDTO from "../../auth/dtos/User.dto.js"
import HandleableError from "../errors/Handleable.error.js"

@Middleware()
export class AuthMiddleware {

    constructor(
        @Inject(UserService)
        private userService: UserService,
        @Inject(RoleService)
        private roleService: RoleService,
        @Inject(PermissionService)
        private permissionService: PermissionService,
        @Inject(BlockedTokenService)
        private blockedTokenService: BlockedTokenService
    ) { }

    async auth(request) {

        const token = request.headers['authorization'] || request.cookies?.accessToken

        if (!token) throw new TokenRequiredError('Se requiere un token de acceso')
        if (await this.blockedTokenService.existsBlockedTokenByToken(token)) throw new UnauthorizedError('Token bloqueado')

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET)

            const roles = await this.roleService.findManyByUserId(decoded.userId)
            const permissions = await this.permissionService.findManyByUserId(decoded.userId)
            const user = await this.userService.findById(decoded.userId)

            if (!user.isAuthorized) throw new UnauthorizedError('El usuario está desautorizado')
            if (user.isDeleted) throw new UnauthorizedError('El usuario está eliminado')
            if (!user.isActive) throw new UnauthorizedError('El usuario está desactivado')

            request.user = new UserDTO(user)

            request.user.roles = [...new Set(
                roles.filter(role => role.isActive).map(role => role.name)
            )]

            request.user.permissions = [...new Set(
                permissions.filter(permission => permission.isActive).map(permission => permission.name)
            )]

        } catch (error) {
            if (error instanceof HandleableError) {
                throw error
            }
            if (error.name === 'TokenExpiredError') {
                throw new UnauthorizedError('Token expirado')
            }
            throw new UnauthorizedError('Token inválido')
        }

    }

}

export default AuthMiddleware