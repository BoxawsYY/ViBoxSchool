import Notify from '../lib/notify.mjs'
import { $ } from './selectors.mjs'
import { FIELDS_TRANSLATION } from '../constants/translations.mjs'

export class Validator {
    constructor({
        fields = null,
        translator = FIELDS_TRANSLATION,
        prefix = '',
        errorHandler = () => {}
    } = {}) {
        this.translator = translator
        this.fields = fields
        this.field = null
        this.prefix = prefix
        this.errorHandler = errorHandler
    }

    set(fields = null) {
        this.fields = fields
        return this
    }

    valid($field, validations) {
        try {
            validations()
            this.errorHandler({})
            return true
        }
        catch (error) {
            if ($field) $field.focus()
            this.field
                ? this.errorHandler(prev => ({ ...prev, [this.field]: error.message }))
                : Notify.notice(error.message, 'warning')
            return false
        }
    }

    every(validations = [], prefix = this.prefix, errorHandler = this.errorHandler) {
        if (!(validations instanceof Array)) {
            throw new Error('No se ha proporcionado un formato de validaciones correcto')
        }
        this.errorHandler = errorHandler
        return validations.every(([label, validate]) =>
            this.valid($(`${prefix}${label}`), () => validate())
        )
    }

    required(error = Error) {
        if (!(this.fields instanceof Object)) throw new Error('No hay campos válidos')
        Object.keys(this.fields).forEach((key) => {
            if (this.fields[key] === undefined || this.fields[key] === null || this.fields[key].toString().trim() === '') {
                this.field = key
                throw new error(`Este campo es requerido y no puede estar vacío`)
            }
            this.field = null
        })
        return this
    }

    length(min, max, error = Error) {
        if (!(this.fields instanceof Object)) throw new Error('No hay campos válidos')
        Object.keys(this.fields).forEach((key) => {
            if (this.fields[key].length < min || this.fields[key].length > max) {
                this.field = key
                throw new error(`Este campo debe tener entre ${min} y ${max} caracteres`)
            }
            this.field = null
        })
        return this
    }

    email(error = Error) {
        if (!(this.fields instanceof Object)) throw new Error('No hay campos válidos')
        Object.keys(this.fields).forEach((key) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(this.fields[key])) {
                this.field = key
                throw new error(`Este campo debe ser un email válido`)
            }
            this.field = null
        })
        return this
    }

    url(error = Error) {
        if (!(this.fields instanceof Object)) throw new Error('No hay campos válidos')
        Object.keys(this.fields).forEach((key) => {
            const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i
            if (!urlRegex.test(this.fields[key])) {
                this.field = key
                throw new error(`Este campo debe ser una URL válida`)
            }
            this.field = null
        })
        return this
    }

    type(type, error = Error) {
        if (!(this.fields instanceof Object)) throw new Error('No hay campos válidos')
        Object.keys(this.fields).forEach((key) => {
            if (typeof this.fields[key] !== type) {
                this.field = key
                throw new error(`Este campo debe ser de tipo ${type}`)
            }
            this.field = null
        })
        return this
    }

    isArray(error = Error) {
        if (!(this.fields instanceof Object)) throw new Error('No hay campos válidos')
        Object.keys(this.fields).forEach((key) => {
            if (!(this.fields[key] instanceof Array)) {
                this.field = key
                throw new error(`Este campo debe ser un array`)
            }
            this.field = null
        })
        return this
    }

    isNumeric(error = Error) {
        if (!(this.fields instanceof Object)) throw new Error('No hay campos válidos')
        Object.keys(this.fields).forEach((key) => {
            if (isNaN(this.fields[key])) {
                this.field = key
                throw new error(`Este campo debe ser un número válido`)
            }
            this.field = null
        })
        return this
    }

    isInteger(error = Error) {
        if (!(this.fields instanceof Object)) throw new Error('No hay campos válidos')
        Object.keys(this.fields).forEach((key) => {
            if (!Number.isInteger(this.fields[key])) {
                this.field = key
                throw new error(`Este campo debe ser un número entero`)
            }
            this.field = null
        })
        return this
    }

    isBoolean(error = Error) {
        if (!(this.fields instanceof Object)) throw new Error('No hay campos válidos')
        Object.keys(this.fields).forEach((key) => {
            if (typeof this.fields[key] !== 'boolean') {
                this.field = key
                throw new error(`Este campo debe ser de tipo booleano`)
            }
            this.field = null
        })
        return this
    }

    isDate(error = Error) {
        if (!(this.fields instanceof Object)) throw new Error('No hay campos válidos')
        Object.keys(this.fields).forEach((key) => {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/
            if (!dateRegex.test(this.fields[key])) {
                this.field = key
                throw new error(`Este campo debe ser una fecha válida en formato YYYY-MM-DD`)
            }
            const date = new Date(this.fields[key])
            if (isNaN(date.getTime())) {
                this.field = key
                throw new error(`Este campo no corresponde a una fecha válida`)
            }
            this.field = null
        })
        return this
    }

    isTime(error = Error) {
        if (!(this.fields instanceof Object)) throw new Error('No hay campos válidos')
        Object.keys(this.fields).forEach((key) => {
            const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/
            if (!timeRegex.test(this.fields[key])) {
                this.field = key
                throw new error(`Este campo debe ser una hora válida en formato HH:MM o HH:MM:SS`)
            }
            this.field = null
        })
        return this
    }

    isStrongPassword(error = Error) {
        if (!(this.fields instanceof Object)) throw new Error('No hay campos válidos')

        Object.keys(this.fields).forEach((key) => {
            const value = this.fields[key]
            if (value.length < 8) {
                this.field = key
                throw new error('La contraseña debe tener al menos 8 caracteres')
            }
            if (!/[a-z]/.test(value)) {
                this.field = key
                throw new error('La contraseña debe incluir al menos una letra minúscula')
            }
            if (!/[A-Z]/.test(value)) {
                this.field = key
                throw new error('La contraseña debe incluir al menos una letra mayúscula')
            }
            if (!/\d/.test(value)) {
                this.field = key
                throw new error('La contraseña debe incluir al menos un número')
            }
            if (!/[@$!%*?&#^()\-=+{}[\]|:;"'<>,.~`/]/.test(value)) {
                this.field = key
                throw new error('La contraseña debe incluir al menos un símbolo especial')
            }
            this.field = null
        })
        return this
    }

    isSamePassword(password, error = Error) {
        if (!(this.fields instanceof Object)) throw new Error('No hay campos válidos')

        Object.keys(this.fields).forEach((key) => {
            const value = this.fields[key]
            if (value != password) {
                this.field = key
                throw new error('La contraseña no coincide')
            }
            this.field = null
        })
        return this
    }

    username(error = Error) {
        if (!(this.fields instanceof Object)) throw new Error('No hay campos válidos')

        Object.keys(this.fields).forEach((key) => {
            const value = this.fields[key]
            if (!/^[a-zA-Z][a-zA-Z0-9._]*$/.test(value)) {
                this.field = key
                throw new error('Nombre de usuario inválido')
            }
            this.field = null
        })
        return this
    }

    isIn(validValues, error = Error) {
        if (!(this.fields instanceof Object)) throw new Error('No hay campos válidos')
        Object.keys(this.fields).forEach((key) => {
            if (!validValues.includes(this.fields[key])) {
                this.field = key
                throw new error(`Este campo debe ser uno de los siguientes valores: ${validValues.join(', ')}`)
            }
            this.field = null
        })
        return this
    }

    isUUID(error = Error) {
        if (!(this.fields instanceof Object)) throw new Error('No hay campos válidos')
        Object.keys(this.fields).forEach((key) => {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
            if (!uuidRegex.test(this.fields[key])) {
                this.field = key
                throw new error(`Este campo debe ser un UUID válido`)
            }
            this.field = null
        })
        return this
    }

    isPositiveInteger(error = Error) {
        if (!(this.fields instanceof Object)) throw new Error('No hay campos válidos')
        Object.keys(this.fields).forEach((key) => {
            if (!Number.isInteger(parseInt(this.fields[key])) || this.fields[key] < 0) {
                this.field = key
                throw new error(`Este campo debe ser un número entero positivo`)
            }
            this.field = null
        })
        return this
    }
}

export default Validator
