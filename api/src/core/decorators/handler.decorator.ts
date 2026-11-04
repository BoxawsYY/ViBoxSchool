import { Metadata } from '../metadata/Metadata.js'
import { METADATA_KEYS } from '../metadata/keys.js'

export const Handler = () => {
    return (target: any) => {
        Metadata.set(target, METADATA_KEYS.HANDLER, true)
    }
}