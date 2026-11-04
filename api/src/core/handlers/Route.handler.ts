import { Metadata } from '../metadata/Metadata.js'
import { METADATA_KEYS } from '../metadata/keys.js'
import { UnauthorizedError } from '../errors/Unauthorized.error.js'
import { Handler } from '../decorators/handler.decorator.js'
import AuthMiddleware from '../middlewares/Auth.middleware.js'

@Handler()
export class RouteHandler {

    constructor(
        private method: Function,
        private instance: any,
        private middleware: any
    ) { }

    async execute(request, response, next) {
        try {
            const isPublic = Metadata.get(this.method, METADATA_KEYS.PUBLIC)
            const auth = Metadata.get(this.method, METADATA_KEYS.AUTH)

            if (!isPublic) {
                await this.middleware.auth(request)
            }

            if (auth) {
                const { roles = [], permissions = [] } = auth

                if (roles.length && !roles.some(role => request.user?.roles?.includes(role))) {
                    throw new UnauthorizedError('No tienes los roles necesarios')
                }

                if (permissions.length && !permissions.every(permission => request.user?.permissions?.includes(permission))) {
                    throw new UnauthorizedError('No tienes los permisos necesarios')
                }
            }

            await this.method.call(this.instance, request, response, next)

        } catch (err) {
            next(err)
        }
    }
}

export default RouteHandler