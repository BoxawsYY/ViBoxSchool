import { ERROR_CODES } from "../constants/error.constant.js"
import { Middleware } from "../decorators/middleware.decorator.js"
import HandleableError from "../errors/Handleable.error.js"

@Middleware()
export class ErrorMiddleware {
    public static handle(error, request, response, next) {

        console.error(error)

        if (error instanceof HandleableError) {
            console.error({
                error: error.toJSON(),
                path: request.originalUrl,
                user: request.user?.id
            })
            return response.status(error.status).json(error.toJSON())
        }

        const handled = {
            code: ERROR_CODES.INTERNAL_ERROR,
            message: 'Internal Server Error',
            status: 500,
            type: error.constructor.name || 'Error'
        }

        console.error(handled)

        return response.status(500).json(handled)
    }
}

export default ErrorMiddleware