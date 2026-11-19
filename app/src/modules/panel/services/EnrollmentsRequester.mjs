import API from '../../../core/config/api.config.mjs'
import Requester from '../../../core/services/service/Requester.mjs'

const BASE = API.ENROLLMENTS.BASE

class EnrollmentsRequester {
    static async reviewQueue() {
        const result = await Requester.get(`${BASE}/review-queue`)
        if (!result.ok) throw new Error(result.message || 'No se pudieron cargar los expedientes')
        return result.data
    }

    static async update(enrollmentId, data) {
        const result = await Requester.patch(`${BASE}/${encodeURIComponent(enrollmentId)}`, data)
        if (!result.ok) throw new Error(result.message || 'No se pudo actualizar el expediente')
        return result.data
    }

    static async detail(enrollmentId) {
        const result = await Requester.get(`${BASE}/${encodeURIComponent(enrollmentId)}/documents`)
        if (!result.ok) throw new Error(result.message || 'No se pudo cargar el expediente')
        return result.data
    }
}

export default EnrollmentsRequester
