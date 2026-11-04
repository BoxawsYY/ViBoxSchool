import { METADATA_KEYS } from "../metadata/keys.js"
import { Metadata } from "../metadata/Metadata.js"

export const Inject = (dependency: any) => {
    return (target: any, _key: any, index: number) => {

        const existing =
            Metadata.get(target, METADATA_KEYS.INJECT) || []

        existing[index] = dependency

        Metadata.set(target, METADATA_KEYS.INJECT, existing)
    }
}