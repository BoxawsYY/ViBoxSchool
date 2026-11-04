import { Metadata } from '../metadata/Metadata.js'
import { METADATA_KEYS } from '../metadata/keys.js'

export const Controller = (basePath: string) => {
    return (target: any) => {
        Metadata.set(target, METADATA_KEYS.CONTROLLER, true)
        Metadata.set(target, METADATA_KEYS.BASE_PATH, basePath)
    }
}