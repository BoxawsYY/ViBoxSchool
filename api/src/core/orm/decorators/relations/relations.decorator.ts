import { Metadata } from '../../../metadata/Metadata.js'
import { METADATA_KEYS } from '../../../metadata/keys.js'
import { JoinTableConfig } from '../../metadata/orm.metadata.js'

export interface RelationOptions {
    joinTable?: string | JoinTableConfig
    joinColumn?: string
    inverse?: string
    owner?: boolean
    eager?: boolean
}

function addRelation(target: any, propertyKey: string, type: 'OneToMany' | 'ManyToOne' | 'OneToOne' | 'ManyToMany', targetTypeFn: () => Function, options: RelationOptions = {}) {
    const relations = Metadata.get(target.constructor, METADATA_KEYS.RELATIONS) || {}
    relations[propertyKey] = { type, target: targetTypeFn, ...options }
    Metadata.set(target.constructor, METADATA_KEYS.RELATIONS, relations)
}

export function OneToMany(targetType: () => Function, optionsOrInverse?: string | RelationOptions) {
    return function (target: any, propertyKey: string) {
        let options: RelationOptions = {}
        if (typeof optionsOrInverse === 'string') {
            options.inverse = optionsOrInverse
        } else if (optionsOrInverse) {
            options = { ...optionsOrInverse }
        }
        addRelation(target, propertyKey, 'OneToMany', targetType, options)
    }
}

export function ManyToOne(targetType: () => Function, optionsOrInverse?: string | RelationOptions) {
    return function (target: any, propertyKey: string) {
        let options: RelationOptions = {}
        if (typeof optionsOrInverse === 'string') {
            options.inverse = optionsOrInverse
        } else if (optionsOrInverse) {
            options = { ...optionsOrInverse }
        }
        addRelation(target, propertyKey, 'ManyToOne', targetType, options)
    }
}

export function OneToOne(targetType: () => Function, optionsOrInverse?: string | RelationOptions) {
    return function (target: any, propertyKey: string) {
        let options: RelationOptions = {}
        if (typeof optionsOrInverse === 'string') {
            options.inverse = optionsOrInverse
        } else if (optionsOrInverse) {
            options = { ...optionsOrInverse }
        }
        addRelation(target, propertyKey, 'OneToOne', targetType, options)
    }
}

export function ManyToMany(targetType: () => Function, optionsOrJoinTable?: string | RelationOptions, inverseProperty?: string) {
    return function (target: any, propertyKey: string) {
        let options: RelationOptions = {}
        if (typeof optionsOrJoinTable === 'string') {
            options.joinTable = optionsOrJoinTable
            if (inverseProperty) {
                options.inverse = inverseProperty
            }
        } else if (optionsOrJoinTable) {
            options = { ...optionsOrJoinTable }
        }
        addRelation(target, propertyKey, 'ManyToMany', targetType, options)
    }
}
