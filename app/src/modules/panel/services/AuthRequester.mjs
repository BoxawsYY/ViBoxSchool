import API from '../../../core/config/api.config.mjs';
import Notify from '../../../core/lib/notify.mjs';
import Requester from '../../../core/services/service/Requester.mjs';

class AuthRequester extends Requester {

    static async getPermissions() {
        const result = await super.get(API.AUTH.ENDPOINTS.PERMISSIONS)
        return result.data
    }

    static async getRoles() {
        const result = await super.get(API.AUTH.ENDPOINTS.ROLES)
        return result.data
    }

    static async createRole(role) {
        const result = await super.post(API.AUTH.ENDPOINTS.ROLES, role)
        return result.data
    }

    static async updateRole(role) {
        const result = await super.put(`${API.AUTH.ENDPOINTS.ROLES}/${role.name}`, role)

        if (result.message) {
            Notify.notice(
                result.message || 'No se pudo actualizar el rol',
                result.ok ? 'info' : 'error'
            )
        }

        return result.data
    }

    static async deleteRole(role) {
        const result = await super.delete(`${API.AUTH.ENDPOINTS.ROLES}/${role.name}`)

        if (result.message) {
            Notify.notice(
                result.message || 'No se pudo eliminar el rol',
                result.ok ? 'info' : 'error'
            )
        }

        return result.ok
    }

    static async activateRole(role) {
        const result = await super.patch(`${API.AUTH.ENDPOINTS.ACTIVATE_ROLE}/${role.name}`)

        if (result.message) {
            Notify.notice(
                result.message || 'No se pudo activar el rol',
                result.ok ? 'info' : 'error'
            )
        }

        return result.data
    }

    static async deactivateRole(role) {
        const result = await super.patch(`${API.AUTH.ENDPOINTS.DEACTIVATE_ROLE}/${role.name}`)

        if (result.message) {
            Notify.notice(
                result.message || 'No se pudo desactivar el rol',
                result.ok ? 'info' : 'error'
            )
        }

        return result.data
    }

    static async assignPermissionToRole(role, permission) {
        const result = await super.post(API.AUTH.ENDPOINTS.ASSIGN_PERMISSION_TO_ROLE, {
            role: role.name,
            permissions: [permission.name]
        })

        if (result.message) {
            Notify.notice(
                result.message || 'No se pudo asignar el permiso al rol',
                result.ok ? 'info' : 'error'
            )
        }

        return result.ok
    }

    static async revokePermissionFromRole(role, permission) {
        const result = await super.post(API.AUTH.ENDPOINTS.REVOKE_PERMISSION_FROM_ROLE, {
            role: role.name,
            permissions: [permission.name]
        })

        if (result.message) {
            Notify.notice(
                result.message || 'No se pudo revocar el permiso al rol',
                result.ok ? 'info' : 'error'
            )
        }

        return result.ok
    }

    static async getUsers() {
        const result = await super.get(API.AUTH.ENDPOINTS.USERS)
        return result.data
    }

    static async createUser(user) {
        const result = await super.post(API.AUTH.ENDPOINTS.USERS, user)
        return result.data
    }

    static async updateUser(user) {
        const result = await super.put(`${API.AUTH.ENDPOINTS.USERS}/${user.username}`, user)

        if (result.message) {
            Notify.notice(
                result.message || 'No se pudo actualizar el usuario',
                result.ok ? 'info' : 'error'
            )
        }

        return result.data
    }

    static async deleteUser(user) {
        const result = await super.delete(`${API.AUTH.ENDPOINTS.USERS}/${user.username}`)

        if (result.message) {
            Notify.notice(
                result.message || 'No se pudo eliminar el usuario',
                result.ok ? 'info' : 'error'
            )
        }

        return result.ok
    }

    static async authorizeUser(user) {
        const result = await super.post(`${API.AUTH.ENDPOINTS.AUTHORIZE}/${user.username}`)

        if (result.message) {
            Notify.notice(
                result.message || 'No se pudo autorizar el usuario',
                result.ok ? 'info' : 'error'
            )
        }

        return result.data
    }

    static async disauthorizeUser(user) {
        const result = await super.post(`${API.AUTH.ENDPOINTS.DISAUTHORIZE}/${user.username}`)

        if (result.message) {
            Notify.notice(
                result.message || 'No se pudo desautorizar el usuario',
                result.ok ? 'info' : 'error'
            )
        }

        return result.data
    }

    static async assignRoleToUser(user, role) {
        const result = await super.post(API.AUTH.ENDPOINTS.ASSIGN_ROLE_TO_USER, {
            username: user.username,
            roles: [role.name]
        })

        if (result.message) {
            Notify.notice(
                result.message || 'No se pudo asignar el rol al usuario',
                result.ok ? 'info' : 'error'
            )
        }

        return result.ok
    }

    static async revokeRoleFromUser(user, role) {
        const result = await super.post(API.AUTH.ENDPOINTS.REVOKE_ROLE_FROM_USER, {
            username: user.username,
            roles: [role.name]
        })

        if (result.message) {
            Notify.notice(
                result.message || 'No se pudo revocar el rol al usuario',
                result.ok ? 'info' : 'error'
            )
        }

        return result.ok
    }

}

export default AuthRequester