import { Controller, Delete, Get, Inject, Permissions, Post, Put } from '../../core/decorators/decorators.js'
import Validator from '../../core/utils/Validator.js'
import { PERMISSIONS } from '../constants/authorities.js'
import UserDTO from '../dtos/User.dto.js'
import UserService from '../services/User.service.js'

@Controller('/auth/users')
export class UserController {

    constructor(
        @Inject(UserService)
        private userService: UserService
    ) { }

    @Get('/')
    @Permissions([PERMISSIONS.USER.READ])
    async findAll(request, response) {
        const users = await this.userService.findAll()

        return response.status(200).json(users.map(user => new UserDTO(user)))
    }

    @Get('/:username')
    @Permissions([PERMISSIONS.USER.READ])
    async findByUsername(request, response) {
        const { username } = request.params || {}

        Validator.required({ username })

        const user = await this.userService.findByUsername(username)

        return response.status(200).json(new UserDTO(user))
    }

    @Post('/')
    @Permissions([PERMISSIONS.USER.CREATE])
    async create(request, response) {
        const { name, username, documentType, documentNumber, gender, country, city, address, phoneNumber, email, password, birthdate, image } = request.body

        Validator
            .required({ name, username, email, password, documentType, documentNumber, phoneNumber })
            .isAlfaNumeric({ username })
            .email({ email })
            .length({ username }, 2, 50)
            .isStrongPassword({ password })
            .isDate({ birthdate })

        if (image) Validator.url({ image })

        const user = await this.userService.register({ name, username, documentType, documentNumber, gender, country, city, address, phoneNumber, email, password, birthdate, image })

        return response.status(200).json(new UserDTO(user))
    }

    @Put('/:username')
    @Permissions([PERMISSIONS.USER.UPDATE])
    async update(request, response) {
        const { username } = request.params
        const { name, documentType, documentNumber, gender, country, city, address, phoneNumber, email, birthdate, image } = request.body

        Validator
            .required({ name, username, email, documentType, documentNumber, phoneNumber })
            .isAlfaNumeric({ username })
            .email({ email })
            .length({ username }, 2, 50)
            .isDate({ birthdate })

        if (image) Validator.url({ image })

        const user = await this.userService.update(username, { name, username, documentType, documentNumber, gender, country, city, address, phoneNumber, email, birthdate, image })

        return response.status(200).json(new UserDTO(user))
    }

    @Delete('/:username')
    @Permissions([PERMISSIONS.USER.DELETE])
    async delete(request, response) {
        const { username } = request.params

        Validator.required({ username })

        await this.userService.delete(username)

        return response.status(200).json({ message: `Usuario "${username}" eliminado correctamente` })
    }

}