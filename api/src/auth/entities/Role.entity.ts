import { Entity, Id, Column, ManyToMany } from "../../core/orm/decorators/decorators.js"
import Permission from "./Permission.entity.js"
import User from "./User.entity.js"

@Entity('Roles')
export class Role {

    @Id()
    id: string

    @Column({ type: 'string', nullable: false })
    name: string

    @Column({ type: 'string', nullable: false })
    alias: string

    @Column({ type: 'string', nullable: true })
    description: string

    status: string

    isActive: boolean

    isDeleted: boolean

    createdAt: Date

    createdBy: string

    updatedAt: Date

    updatedBy: string

    deletedAt: Date

    deletedBy: string

    @ManyToMany(() => Permission, {
        joinTable: {
            name: "RolesPermissions",
            joinColumn: "roleId",
            inverseJoinColumn: "permissionId"
        },
        owner: true,
        eager: true
    })
    permissions: Permission[]

    @ManyToMany(() => User, {
        joinTable: {
            name: "UsersRoles",
            joinColumn: "roleId",
            inverseJoinColumn: "userId"
        }
    })
    users: User[]

}

export default Role