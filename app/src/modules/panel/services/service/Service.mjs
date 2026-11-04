import { IS_DEV_MODE } from '../../../../core/config/api.config.mjs'
import Notify from '../../../../core/lib/notify.mjs'
import { ServiceMethodNotImplementedError } from '../../scripts/handlers/errors/ServiceMethodNotImplemented.error.mjs'

class Service {
    static isDevMode = IS_DEV_MODE
    static service

    static async implements(method) {
        try {
            const result = await method()

            if (result.message) {
                if (result.ok) {
                    Notify.notice(result.message, 'success')
                }
                else {
                    Notify.notice(result.message, 'error')
                }
            }

            return result
        }
        catch (error) {
            console.log(error)
            throw new ServiceMethodNotImplementedError("El método del servicio no ha sido implementado")
        }
    }

    static async create(object) {
        return this.implements(() => this.service.create(object))
    }

    static async readAll() {
        return this.implements(async () => {
            const result = await this.service.readAll()
            return result.data || []
        })
    }

    static async read(objectId) {
        return this.implements(async () => {
            const result = await this.service.read(objectId)
            return result.data || null
        })
    }

    static async update(object) {
        return this.implements(() => this.service.update(object))
    }

    static async desactivate(objectId) {
        return this.implements(() => this.service.desactivate(objectId))
    }

    static async activate(objectId) {
        return this.implements(() => this.service.activate(objectId))
    }

}

export default Service