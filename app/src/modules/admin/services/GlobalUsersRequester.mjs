import API from '../../../core/config/api.config.mjs'
import Requester from '../../../core/services/service/Requester.mjs'

const userUrl = (id) => `${API.ADMIN_USERS.BASE}/${encodeURIComponent(id)}`

class GlobalUsersRequester {
    static async findAll({ search, role, schoolId, status, limit, offset } = {}) {
        const params = new URLSearchParams()
        if (search) params.set('search', search)
        if (role) params.set('role', role)
        if (schoolId) params.set('schoolId', schoolId)
        if (status) params.set('status', status)
        if (limit) params.set('limit', String(limit))
        if (offset) params.set('offset', String(offset))

        const query = params.toString()
        const result = await Requester.get(`${API.ADMIN_USERS.BASE}${query ? `?${query}` : ''}`)
        if (!result.ok) throw new Error(result.message || 'No se pudieron cargar los usuarios')
        return result.data
    }

    static async summary() {
        const result = await Requester.get(API.ADMIN_USERS.ENDPOINTS.SUMMARY)
        if (!result.ok) throw new Error(result.message || 'No se pudo cargar el resumen de usuarios')
        return result.data
    }

    static async findStudents(schoolId) {
        const params = new URLSearchParams({ schoolId })
        const result = await Requester.get(`${API.ADMIN_USERS.BASE}/students?${params}`)
        if (!result.ok) throw new Error(result.message || 'No se pudieron cargar los estudiantes del colegio')
        return result.data
    }

    static async create(data) {
        const result = await Requester.post(`${API.ADMIN_USERS.BASE}/`, data)
        if (!result.ok) throw new Error(result.message || 'No se pudo crear el usuario')
        return result.data
    }

    static async update(id, data) {
        const result = await Requester.patch(userUrl(id), data)
        if (!result.ok) throw new Error(result.message || 'No se pudo actualizar el usuario')
        return result.data
    }

    static async updateStatus(id, status) {
        const result = await Requester.patch(`${userUrl(id)}/status`, { status })
        if (!result.ok) throw new Error(result.message || 'No se pudo actualizar el estado del usuario')
        return result.data
    }

    static async remove(id) {
        const result = await Requester.delete(userUrl(id))
        if (!result.ok) throw new Error(result.message || 'No se pudo eliminar el usuario')
        return result.data
    }
}

export default GlobalUsersRequester
