import { Metadata } from '../metadata/Metadata.js'
import { METADATA_KEYS } from '../metadata/keys.js'

export const Repository = () => {
    return (target: any) => {
        Metadata.set(target, METADATA_KEYS.REPOSITORY, true)
    }
}