import API from '../../../core/config/api.config.mjs'
import Requester from '../../../core/services/service/Requester.mjs'

const BASE = API.NOTIFICATIONS.ENDPOINTS.SETTINGS

const settingsUrl = (id) => `${BASE}/${encodeURIComponent(id)}`

class NotificationSettingsRequester {
    static async list({ status } = {}) {
        const suffix = status ? `?status=${encodeURIComponent(status)}` : ''
        const result = await Requester.get(`${BASE}/${suffix}`)
        if (!result.ok) throw new Error(result.message || 'No se pudieron cargar las reglas')
        return result.data
    }

    static async create(payload) {
        const result = await Requester.post(`${BASE}/`, payload)
        if (!result.ok) throw new Error(result.message || 'No se pudo crear la regla')
        return result.data
    }

    static async update(id, payload) {
        const result = await Requester.patch(settingsUrl(id), payload)
        if (!result.ok) throw new Error(result.message || 'No se pudo actualizar la regla')
        return result.data
    }

    static async setStatus(id, status) {
        const result = await Requester.patch(`${settingsUrl(id)}/status`, { status })
        if (!result.ok) throw new Error(result.message || 'No se pudo cambiar el estado de la regla')
        return result.data
    }
}

export default NotificationSettingsRequester
