import API from '../../../core/config/api.config.mjs'
import Requester from '../../../core/services/service/Requester.mjs'

const BASE = API.NOTIFICATIONS.BASE

class NotificationsRequester {
    static async list({ isRead, limit = 10, offset = 0 } = {}) {
        const params = new URLSearchParams()
        if (typeof isRead === 'boolean') params.set('isRead', String(isRead))
        params.set('limit', String(limit))
        params.set('offset', String(offset))

        const result = await Requester.get(`${BASE}/?${params}`)
        if (!result.ok) throw new Error(result.message || 'No se pudieron cargar las notificaciones')
        return result.data
    }

    static async unreadCount() {
        const result = await Requester.get(API.NOTIFICATIONS.ENDPOINTS.UNREAD_COUNT)
        if (!result.ok) throw new Error(result.message || 'No se pudo cargar el conteo de no leídas')
        return result.data
    }

    static async markRead(id) {
        const result = await Requester.patch(`${BASE}/${encodeURIComponent(id)}/read`)
        if (!result.ok) throw new Error(result.message || 'No se pudo marcar la notificación')
        return result.data
    }

    static async markUnread(id) {
        const result = await Requester.patch(`${BASE}/${encodeURIComponent(id)}/unread`)
        if (!result.ok) throw new Error(result.message || 'No se pudo marcar la notificación')
        return result.data
    }

    static async markAllRead() {
        const result = await Requester.patch(API.NOTIFICATIONS.ENDPOINTS.READ_ALL)
        if (!result.ok) throw new Error(result.message || 'No se pudieron marcar las notificaciones')
        return result.data
    }
}

export default NotificationsRequester
