import { Repository } from "../../core/decorators/decorators.js"
import BaseRepository from "../../core/orm/repository/Base.repository.js"
import Permission from "../entities/Permission.entity.js"

@Repository()
export class PermissionRepository extends BaseRepository<Permission> {

    constructor() {
        super(Permission)
    }

    async findManyByRoleId(roleId: string) {
        return this.raw(`
            SELECT * 
            FROM "Permissions" 
            WHERE id IN (SELECT "permissionId" FROM "RolesPermissions" WHERE "roleId" = $1) 
            AND "isActive" = true AND "isDeleted" = false
            `,
            [roleId]
        )
    }

    async findManyByUserId(userId: string) {
        return this.raw(`
            SELECT * 
            FROM "Permissions" 
            WHERE id IN (SELECT "permissionId" FROM "RolesPermissions" WHERE "roleId" IN (SELECT "roleId" FROM "UsersRoles" WHERE "userId" = $1)) 
            AND "isActive" = true AND "isDeleted" = false`,
            [userId]
        )
    }

}

export default PermissionRepository