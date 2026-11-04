import API from '../../../core/config/api.config.mjs'
import Requester from '../../../core/services/service/Requester.mjs'

class SchoolRequester {

    static async discover() {
        const result = await Requester.get(API.SCHOOLS.ENDPOINTS.DISCOVER, { useAuth: false })

        if (!result.ok) throw new Error(result.message || 'No se pudieron cargar los colegios')

        return result.data
    }

    static async findByCode(code) {
        const url = `${API.SCHOOLS.BASE}/${encodeURIComponent(code)}`
        const result = await Requester.get(url, { useAuth: false })

        if (!result.ok) throw new Error(result.message || 'No se pudo cargar el colegio')

        return result.data
    }
}

export default SchoolRequester
