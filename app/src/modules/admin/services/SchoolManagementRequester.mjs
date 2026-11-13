import API from '../../../core/config/api.config.mjs'
import Requester from '../../../core/services/service/Requester.mjs'

class SchoolManagementRequester {
    static async findAll() {
        const result = await Requester.get(API.SCHOOLS.BASE)
        if (!result.ok) throw new Error(result.message || 'No se pudieron cargar los colegios')
        return result.data
    }

    static async create(data) {
        const result = await Requester.post(`${API.SCHOOLS.BASE}/`, data)
        if (!result.ok) throw new Error(result.message || 'No se pudo crear el colegio')
        return result.data
    }

    static async update(id, data) {
        const result = await Requester.patch(`${API.SCHOOLS.BASE}/${encodeURIComponent(id)}`, data)
        if (!result.ok) throw new Error(result.message || 'No se pudo actualizar el colegio')
        return result.data
    }

    static async deactivate(id) {
        const result = await Requester.patch(`${API.SCHOOLS.BASE}/${encodeURIComponent(id)}/deactivate`, {})
        if (!result.ok) throw new Error(result.message || 'No se pudo desactivar el colegio')
        return result.data
    }

    static async updateStatus(id, status) {
        const result = await Requester.patch(
            `${API.SCHOOLS.BASE}/${encodeURIComponent(id)}/status`,
            { status }
        )
        if (!result.ok) throw new Error(result.message || 'No se pudo actualizar el estado del colegio')
        return result.data
    }
}

export default SchoolManagementRequester
