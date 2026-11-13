import { Controller, Inject, Public, Post, Get, Patch, Roles } from '../../core/decorators/decorators.js'
import { ROLES } from '../constants/authorities.js'
import { UnauthorizedError } from '../../core/errors/Unauthorized.error.js'
import Validator from '../../core/utils/Validator.js'
import UserDTO from '../dtos/User.dto.js'
import UserService from '../services/User.service.js'

@Controller('/auth')
export class AuthenticationController {
    private readonly demoAccounts = {
        parent: { username: 'demo.padre', role: 'Guardian' },
        secretary: { username: 'demo.secretaria', role: 'Secretary' },
        principal: { username: 'demo.rector', role: 'Rector' },
        admin: { username: 'demo.admin', role: ROLES.ADMIN }
    }

    constructor(
        @Inject(UserService)
        private userService: UserService,
    ) { }

    @Post('/register')
    @Roles([ROLES.ADMIN])
    async register(request, response) {
        const { name, username, documentType, documentNumber, gender, country, city, address, phoneNumber, email, password, birthdate, image } = request.body || {}

        Validator
            .required({ name, username, email, password, documentType, documentNumber, phoneNumber })
            .isAlfaNumeric({ username })
            .email({ email })
            .length({ username }, 2, 50)
            .isStrongPassword({ password })
            .isDate({ birthdate })

        if (image) Validator.url({ image })

        const user = await this.userService.register({ name, username, documentType, documentNumber, gender, country, city, address, phoneNumber, email, password, birthdate, image })

        return response.status(201).json(new UserDTO(user))
    }

    @Public()
    @Post('/login')
    async login(request, response) {
        const { username, password, role } = request.body || {}

        Validator
            .required({ username, password, role })
            .length({ username }, 2, 100)

        const { token, user, roles, permissions } = await this.userService.login({ username, password, role })

        return response
            .cookie('accessToken', token, {
                httpOnly: true,
                sameSite: 'lax',
                maxAge: 1000 * 60 * 60 * 24
            })
            .status(200)
            .json({
                token,
                user: {
                    ...new UserDTO({ ...user, isOnline: true, lastLogin: new Date() }),
                    roles,
                    role: roles[0] || null,
                    permissions
                }
            })
    }

    @Public()
    @Post('/demo-login')
    async demoLogin(request, response) {
        const { profile } = request.body || {}
        const account = this.demoAccounts[profile]
        const password = process.env.VIBOX_DEMO_PASSWORD

        if (process.env.DEMO_LOGIN_ENABLED !== 'true' || !password) {
            throw new UnauthorizedError('El acceso de prueba no está habilitado')
        }
        if (!account) throw new UnauthorizedError('El perfil de prueba no es válido')

        const { token, user, roles, permissions } = await this.userService.login({
            username: account.username,
            password,
            role: account.role
        })

        return response
            .cookie('accessToken', token, {
                httpOnly: true,
                sameSite: 'lax',
                maxAge: 1000 * 60 * 60 * 24
            })
            .status(200)
            .json({
                token,
                user: {
                    ...new UserDTO({ ...user, isOnline: true, lastLogin: new Date() }),
                    roles,
                    role: roles[0] || null,
                    permissions
                }
            })
    }

    @Post('/logout')
    async logout(request, response) {
        const token = request.headers['authorization'] || request.cookies?.accessToken

        Validator.required({ token })

        await this.userService.logout(token, request.user?.id)

        return response.clearCookie('accessToken').status(200).json({ message: 'Sesión cerrada correctamente' })
    }

    @Get('/me')
    async me(request, response) {
        const user = new UserDTO(request.user)

        return response.status(200).json({
            user: {
                ...user,
                roles: request.user?.roles || [],
                role: request.user?.roles?.[0] || null,
                permissions: request.user?.permissions || []
            }
        })
    }

    @Patch('/modify')
    async modify(request, response) {
        const { name, username, documentType, documentNumber, gender, country, city, address, phoneNumber, email, birthdate, image } = request.body || {}

        Validator
            .required({ name, username, email, documentType, documentNumber, phoneNumber })
            .isAlfaNumeric({ username })
            .email({ email })
            .length({ username }, 2, 50)

        if (birthdate !== undefined) Validator.isDate({ birthdate })
        if (image) Validator.url({ image })

        const user = await this.userService.modify(request.user, { name, username, documentType, documentNumber, gender, country, city, address, phoneNumber, email, birthdate, image })

        return response.status(200).json(new UserDTO(user))
    }

    @Patch('/reset')
    async reset(request, response) {
        const { oldPassword, newPassword } = request.body || {}

        Validator
            .required({ oldPassword, newPassword })
            .isStrongPassword({ newPassword })

        await this.userService.reset(request.user?.id, oldPassword, newPassword)

        return response.status(200).json({ message: 'Contraseña restablecida correctamente' })
    }

}