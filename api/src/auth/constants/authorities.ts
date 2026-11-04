export const ROLES = {
    GUEST: 'Guest',
    USER: 'User',
    ADMIN: 'Admin'
}

export const PERMISSIONS = {

    PERMISSION: {
        READ: 'ReadPermissions',
        CREATE: 'CreatePermissions',
        UPDATE: 'UpdatePermissions',
        DELETE: 'DeletePermissions',
        ASSIGN_TO_ROLE: 'AssignPermissionsToRole',
        CHECK_ON_ROLE: 'CheckPermissionsOnRole',
        REVOKE_FROM_ROLE: 'RevokePermissionsFromRole'
    },

    ROLE: {
        READ: 'ReadRoles',
        CREATE: 'CreateRoles',
        UPDATE: 'UpdateRoles',
        DELETE: 'DeleteRoles',
        ASSIGN_TO_USER: 'AssignRolesToUser',
        CHECK_ON_USER: 'CheckRolesOnUser',
        REVOKE_FROM_USER: 'RevokeRolesFromUser'
    },

    USER: {
        READ: 'ReadUsers',
        CREATE: 'CreateUsers',
        UPDATE: 'UpdateUsers',
        DELETE: 'DeleteUsers'
    }

}