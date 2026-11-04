const LOCAL_SESSION_KEY = 'session'

export default class Requester {

    static readToken() {
        try {
            const session = JSON.parse(localStorage.getItem(LOCAL_SESSION_KEY))
            return session?.token || null
        } catch {
            return null
        }
    }

    static setToken(token) {
        try {
            if (!token) {
                localStorage.removeItem(LOCAL_SESSION_KEY)
            } else {
                localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify({ token }))
            }
        } catch {}
    }

    static clearToken() {
        Requester.setToken(null)
    }

    static buildHeaders(customHeaders = {}, useAuth = true) {
        const headers = {
            Accept: 'application/json',
            ...customHeaders,
        }

        if (!('Content-Type' in headers) && (customHeaders.bodyIsJson ?? true)) {
            headers['Content-Type'] = 'application/json'
        }

        if (useAuth) {
            const token = Requester.readToken()
            if (token) {
                headers['Authorization'] = token
            }
        }

        return headers
    }

    static async doFetch(method, url, options = {}) {
        const {
            params,
            data,
            headers: customHeaders = {},
            useAuth = true,
            timeout = 0,
            rawBody = false,
        } = options

        // Query params
        let finalUrl = url
        if (params) {
            const query = new URLSearchParams()
            Object.entries(params).forEach(([k, v]) => {
                if (v === undefined || v === null || v === '') return
                if (Array.isArray(v)) v.forEach(item => query.append(k, item))
                else query.append(k, v)
            })
            const qs = query.toString()
            if (qs) finalUrl += (finalUrl.includes('?') ? '&' : '?') + qs
        }

        // Headers + body
        const headers = Requester.buildHeaders(customHeaders, useAuth)
        let body

        if (data !== undefined) {
            if (rawBody) body = data
            else if (data instanceof FormData) {
                body = data
                delete headers['Content-Type']
            }
            else if (typeof data === 'object' && headers['Content-Type']?.includes('application/json')) {
                body = JSON.stringify(data)
            }
            else body = data
        }

        // Timeout
        const controller = timeout ? new AbortController() : null
        if (controller) {
            setTimeout(() => controller.abort(), timeout)
        }

        // Fetch options
        const fetchOptions = {
            method,
            headers,
            body,
            mode: 'cors',
            signal: controller?.signal
        }

        // Execute fetch
        let res
        try {
            res = await fetch(finalUrl, fetchOptions)
        } catch (err) {
            if (err.name === 'AbortError') {
                throw {
                    status: 408,
                    message: 'Request timeout',
                    body: null
                }
            }
            throw err
        }

        // Parse body
        const contentType = res.headers.get('content-type') || ''
        let parsedBody

        if (contentType.includes('application/json')) {
            parsedBody = await res.json().catch(() => null)
        } else {
            parsedBody = await res.text()
        }

        // Handle errors
        if (!res.ok) {
            const error = {
                status: res.status,
                message: parsedBody?.message || `Error ${res.status}`,
                body: parsedBody
            }

            // if (res.status === 401 || res.status === 403) {
            //     Requester.clearToken()
            //     location.href = '/auth'
            // }

            throw error
        }

        return parsedBody
    }

    static async process(method, url, options = {}) {
        const timestamp = new Date().toISOString()

        try {
            const data = await Requester.doFetch(method, url, options)

            return {
                ok: true,
                status: 200,
                data,
                message: data?.message || null,
                method: method.toUpperCase(),
                url,
                timestamp,
            }

        } catch (err) {
            return {
                ok: false,
                status: err.status || 500,
                data: null,
                message: err.message || 'Error interno',
                error: err.body || null,
                method: method.toUpperCase(),
                url,
                timestamp,
            }
        }
    }

    static get(url, opts = {}) {
        return Requester.process('GET', url, opts)
    }

    static post(url, data, opts = {}) {
        return Requester.process('POST', url, { ...opts, data })
    }

    static put(url, data, opts = {}) {
        return Requester.process('PUT', url, { ...opts, data })
    }

    static patch(url, data, opts = {}) {
        return Requester.process('PATCH', url, { ...opts, data })
    }

    static delete(url, opts = {}) {
        return Requester.process('DELETE', url, opts)
    }
}