import { Entity, Id, Column, ManyToMany } from "../../core/orm/decorators/decorators.js"
import Role from "./Role.entity.js"

@Entity('Permissions')
export class Permission {

    @Id()
    id: string

    @Column({ type: 'string', nullable: false })
    name: string

    @Column({ type: 'string', nullable: false })
    alias: string

    @Column({ type: 'string', nullable: true })
    description: string

    @Column({ type: 'string', nullable: true, default: 'Access' })
    type: string

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
            name: "RolesPermissions",
            joinColumn: "permissionId",
            inverseJoinColumn: "roleId"
        }
    })
    roles: Role[]

}

export default Permission