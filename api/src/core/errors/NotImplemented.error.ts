import { ERROR_CODES } from '../constants/error.constant.js'
import HandleableError, { HandleableErrorConstructor } from './Handleable.error.js'

export class NotImplementedError extends HandleableError {
    constructor(message?: string, constructor?: HandleableErrorConstructor) {
        super({
            code: ERROR_CODES.NOT_IMPLEMENTED,
            message: message || 'Not implemented',
            status: 501,
            ...constructor
        })
    }
}