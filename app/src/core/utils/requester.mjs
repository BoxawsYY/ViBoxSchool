const MAX_RETRIES = 2
const RETRY_DELAY = 500

class Requester {

    static isDevMode = true

    static async method(url, request, options = {}) {
        const {
            retry = true,
            retries = 0,
            abortController = null
        } = options

        if (!url || typeof url !== 'string') {
            const message = 'URL inválida proporcionada al método.'
            return {
                ok: false,
                status: 400,
                message,
                data: null,
                page: null,
                max_page: null,
                total: null
            }
        }

        try {
            if (abortController) request.signal = abortController.signal
            const response = await fetch(url, request)
            const status = response.status
            const contentType = response.headers.get('Content-Type') || ''
            let data = null

            if (status !== 204 && contentType.includes('application/json')) {
                data = await response.json()
            } else if (status !== 204 && contentType.includes('text/plain')) {
                const text = await response.text()
                data = { message: text }
            }

            const result = {
                ok: response.ok,
                status,
                message: data?.message || (response.ok ? null : 'Ha ocurrido un error de comunicación con el servidor y no se ha completado la solicitud, por favor, intente nuevamente más tarde.'),
                data: data?.data ?? data ?? null,
                page: data?.page ?? null,
                max_page: data?.max_page ?? null,
                total: data?.total ?? null
            }

            return result

        } catch (error) {
            if (retry && retries < MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retries + 1)))
                return await this.method(url, request, { ...options, retries: retries + 1 })
            }

            const message = error.message || 'Fallo de red o servidor inalcanzable.'

            return {
                ok: false,
                status: 500,
                message,
                data: null,
                page: null,
                max_page: null,
                total: null
            }
        }
    }

    static async get(url, options = {}) {
        const request = {
            method: 'GET',
            mode: 'cors',
            headers: this.getHeaders()
        }
        return await this.method(url, request, options)
    }

    static async post(url, body, options = {}) {
        const request = {
            method: 'POST',
            mode: 'cors',
            headers: this.getHeaders(),
            body: JSON.stringify(body)
        }
        return await this.method(url, request, options)
    }

    static async put(url, body, options = {}) {
        const request = {
            method: 'PUT',
            mode: 'cors',
            headers: this.getHeaders(),
            body: JSON.stringify(body)
        }
        return await this.method(url, request, options)
    }

    static async delete(url, options = {}) {
        const request = {
            method: 'DELETE',
            mode: 'cors',
            headers: this.getHeaders()
        }
        return await this.method(url, request, options)
    }

    static async patch(url, body, options = {}) {
        const request = {
            method: 'PATCH',
            mode: 'cors',
            headers: this.getHeaders(),
            body: JSON.stringify(body)
        }
        return await this.method(url, request, options)
    }

    static withAbort() {
        const abortController = new AbortController()

        return {
            controller: abortController,
            get: (url, options = {}) =>
                this.get(url, { ...options, abortController }),
            post: (url, body, options = {}) =>
                this.post(url, body, { ...options, abortController }),
            put: (url, body, options = {}) =>
                this.put(url, body, { ...options, abortController }),
            delete: (url, options = {}) =>
                this.delete(url, { ...options, abortController }),
            patch: (url, body, options = {}) =>
                this.patch(url, body, { ...options, abortController }),
        }
    }

    static async postMultipart(url, body, options = {}) {
        const session = JSON.parse(window.localStorage.getItem('session'))
        const request = {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Authorization': session.access_token ? `Bearer ${session.access_token}` : ''
            },
            body
        }
        return await this.method(url, request, options)
    }

    static async putMultipart(url, body, options = {}) {
        const session = JSON.parse(window.localStorage.getItem('session'))
        const request = {
            method: 'PUT',
            mode: 'cors',
            headers: {
                'Authorization': session.access_token ? `Bearer ${session.access_token}` : ''
            },
            body
        }
        return await this.method(url, request, options)
    }

    static getHeaders() {
        const session = JSON.parse(window.localStorage.getItem('session'))
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': session.access_token ? `Bearer ${session.access_token}` : ''
        }
        return headers
    }
}

export default Requester
