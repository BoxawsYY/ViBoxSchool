import { Metadata } from '../metadata/Metadata.js'
import { METADATA_KEYS } from '../metadata/keys.js'

export const Roles = (roles: string[]) => {
    return (target: any, key: string) => {

        const method = target[key]

        Metadata.merge(method, METADATA_KEYS.AUTH, {
            roles
        })
    }
}

export const Permissions = (permissions: string[]) => {
    return (target: any, key: string) => {

        const method = target[key]

        Metadata.merge(method, METADATA_KEYS.AUTH, {
            permissions
        })
    }
}