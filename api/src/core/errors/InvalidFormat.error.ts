import { ERROR_CODES } from '../constants/error.constant.js'
import HandleableError, { HandleableErrorConstructor } from './Handleable.error.js'

export class InvalidFormatError extends HandleableError {
    constructor(message?: string, constructor?: HandleableErrorConstructor) {
        super({
            code: ERROR_CODES.INVALID_FORMAT,
            message: message || 'Invalid format',
            status: 400,
            ...constructor
        })
    }
}