import { Controller, Inject, Public, Post, Get, Patch } from '../../core/decorators/decorators.js'
import Validator from '../../core/utils/Validator.js'
import UserDTO from '../dtos/User.dto.js'
import UserService from '../services/User.service.js'

@Controller('/auth')
export class AuthenticationController {

    constructor(
        @Inject(UserService)
        private userService: UserService,
    ) { }

    @Public()
    @Post('/register')
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
        const { username, password } = request.body || {}

        Validator
            .required({ username, password })
            .length({ username }, 2, 50)

        const { token, user, roles, permissions } = await this.userService.login({ username, password })

        return response
            .cookie('accessToken', token, {
                httpOnly: true,
                sameSite: 'lax',
                maxAge: 1000 * 60 * 60 * 24
            })
            .status(201)
            .json({
                token,
                user: {
                    ...new UserDTO({ ...user, isOnline: true, lastLogin: new Date() }),
                    roles,
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
        const user = await this.userService.findById(request.user?.id)

        return response.status(200).json(new UserDTO(user))
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