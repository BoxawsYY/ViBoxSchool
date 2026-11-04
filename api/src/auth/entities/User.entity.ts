import { Entity, Id, Column, OneToMany, ManyToMany } from "../../core/orm/decorators/decorators.js"
import BlockedToken from "./BlockedToken.entity.js"
import Role from "./Role.entity.js"

@Entity('Users')
export class User {

    @Id()
    id: string

    @Column({ type: 'string', nullable: false })
    name: string

    @Column({ type: 'string', nullable: false, unique: true })
    username: string

    @Column({ type: 'string' })
    documentType: string

    @Column({ type: 'string' })
    documentNumber: string

    @Column({ type: 'string' })
    gender: string

    @Column({ type: 'string' })
    country: string

    @Column({ type: 'string' })
    city: string

    @Column({ type: 'string' })
    address: string

    @Column({ type: 'string' })
    phoneNumber: string

    @Column({ type: 'string', nullable: false })
    email: string

    @Column({ type: 'string', nullable: false })
    password: string

    @Column({ type: 'date' })
    birthdate: Date

    @Column({ type: 'string' })
    image: string

    @Column({ type: 'date', nullable: false, default: 'NOW()' })
    registerDate: Date

    @Column({ type: 'date' })
    lastLogin: Date

    @Column({ type: 'boolean', nullable: false, default: true })
    isAuthorized: boolean

    @Column({ type: 'boolean', nullable: false, default: false })
    isOnline: boolean


    @OneToMany(() => BlockedToken, 'userId')
    blockedTokens: BlockedToken[]

    status: string

    isActive: boolean

    isDeleted: boolean

    createdAt: Date

    createdBy: string

    updatedAt: Date

    updatedBy: string

    deletedAt: Date

    deletedBy: string

    @ManyToMany(() => Role, {
        joinTable: {
            name: "UsersRoles",
            joinColumn: "userId",
            inverseJoinColumn: "roleId"
        },
        owner: true,
        eager: true
    })
    roles: Role[]

}

export default User