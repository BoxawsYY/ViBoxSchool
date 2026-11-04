import { Metadata } from '../metadata/Metadata.js'
import { METADATA_KEYS } from '../metadata/keys.js'

export const Router = () => {
    return (target: any) => {
        Metadata.set(target, METADATA_KEYS.ROUTER, true)
    }
}