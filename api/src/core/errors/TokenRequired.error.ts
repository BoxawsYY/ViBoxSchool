import { ERROR_CODES } from '../constants/error.constant.js'
import HandleableError, { HandleableErrorConstructor } from './Handleable.error.js'

export class TokenRequiredError extends HandleableError {
    constructor(message?: string, constructor?: HandleableErrorConstructor) {
        super({
            code: ERROR_CODES.TOKEN_REQUIRED,
            message: message || 'Token required',
            status: 401,
            ...constructor
        })
    }
}