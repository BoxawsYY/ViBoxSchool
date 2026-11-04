import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { Inject, Service } from "../../core/decorators/decorators.js"
import UserRepository from "../repositories/User.repository.js"
import RoleRepository from '../repositories/Role.repository.js'
import PermissionRepository from '../repositories/Permission.repository.js'
import BlockedTokenRepository from '../repositories/BlockedToken.repository.js'
import User from "../entities/User.entity.js"
import { NotFoundError } from '../../core/errors/NotFound.error.js'
import { UnauthorizedError } from '../../core/errors/Unauthorized.error.js'
import { InvalidCredentialError } from '../../core/errors/InvalidCredentials.error.js'
import { AlreadyExistError } from '../../core/errors/AlreadyExist.error.js'

@Service()
export class UserService {

    constructor(
        @Inject(UserRepository)
        private userRepository: UserRepository,
        @Inject(RoleRepository)
        private roleRepository: RoleRepository,
        @Inject(PermissionRepository)
        private permissionRepository: PermissionRepository,
        @Inject(BlockedTokenRepository)
        private blockedTokenRepository: BlockedTokenRepository
    ) { }

    async findAll() {
        return await this.userRepository.findAll()
    }

    async findById(id: string) {
        const user = await this.userRepository.findById(id)

        if (!user) throw new NotFoundError('El usuario no existe')

        return user
    }

    async findByUsername(username: string) {
        const user = await this.userRepository.findOneBy('username', username)

        if (!user) throw new NotFoundError('El username no corresponde a ningún usuario registrado')

        return user
    }

    async register(user: Partial<User>, roleName: string = 'Guest') {

        const userExists = await this.userRepository.findOneBy('username', user.username)
        if (userExists) throw new AlreadyExistError(`El usuario "${user.username}" ya existe`)

        const { password, ...rest } = user
        const hashedPassword = await bcrypt.hash(password, 10)

        const role = await this.roleRepository.findOneBy('name', roleName)

        if (!role) throw new NotFoundError('El rol no existe')

        return await this.userRepository.create({ ...rest, password: hashedPassword, roles: [role] })
    }

    async modify(user: User, data: Partial<User>) {
        for (const key in data) {
            if (data[key] !== undefined) user[key] = data[key]
        }

        return await this.userRepository.update(user.id, user)
    }

    async update(username: string, user: Partial<User>) {
        const userExists = await this.userRepository.findOneBy('username', username)

        if (!userExists) throw new NotFoundError(`El usuario "${username}" no existe`)

        return await this.userRepository.update(userExists.id, user)
    }

    async delete(username: string) {
        const user = await this.userRepository.findOneBy('username', username)

        if (!user) throw new NotFoundError(`El usuario "${username}" no existe`)

        return await this.userRepository.delete(user.id)
    }

    async login({ username, password }) {
        const user = await this.userRepository.findOneBy('username', username)

        if (!user) throw new NotFoundError('El username no corresponde a ningún usuario registrado')
        if (!user.isAuthorized) throw new UnauthorizedError('El usuario no está autorizado para iniciar sesión')
        if (user.isDeleted) throw new UnauthorizedError('El usuario ha sido eliminado')
        if (!user.isActive) throw new UnauthorizedError('El usuario ha sido desactivado')
        if (!(await bcrypt.compare(password, user.password))) throw new InvalidCredentialError('El password no corresponde al username registrado')

        let roles = await this.roleRepository.findManyByUserId(user.id)
        let permissions = await this.permissionRepository.findManyByUserId(user.id)

        roles = [...new Set(roles.filter(role => role.isActive).map(role => role.name))]
        permissions = [...new Set(permissions.filter(permission => permission.isActive).map(permission => permission.name))]

        const token = jwt.sign({
            userId: user.id,
            name: user.name,
            username: user.username,
            email: user.email,
            roles,
            permissions,
        }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN
        })

        await this.userRepository.update(user.id, { isOnline: true, lastLogin: new Date() })

        return { token, user, roles, permissions }
    }

    async logout(token: string, userId: string) {
        const decoded = jwt.decode(token)
        const expiration =
            decoded &&
                typeof decoded !== 'string' &&
                typeof decoded.exp === 'number'
                ? new Date(decoded.exp * 1000)
                : new Date()

        await this.blockedTokenRepository.create({ token, expiration })
        const user = await this.userRepository.findById(userId)

        if (user) await this.userRepository.update(user.id, { isOnline: false })
    }

    async reset(userId: string, oldPassword: string, newPassword: string) {
        const user = await this.userRepository.findById(userId)

        if (!user) throw new NotFoundError('El usuario no existe')

        if (!(await bcrypt.compare(oldPassword, user.password))) throw new InvalidCredentialError('El password no corresponde al username registrado')

        const hashedPassword = await bcrypt.hash(newPassword, 10)

        return await this.userRepository.update(user.id, { password: hashedPassword })
    }

}

export default UserService