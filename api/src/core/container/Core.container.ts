import 'reflect-metadata'
import { Metadata } from '../metadata/Metadata.js'
import { METADATA_KEYS } from '../metadata/keys.js'

export class CoreContainer {

    private static instances = new Map()

    static get<T>(target: new (...args: any[]) => T): T {

        if (this.instances.has(target)) {
            return this.instances.get(target)
        }

        const isService = Metadata.has(target, METADATA_KEYS.SERVICE)
        const isController = Metadata.has(target, METADATA_KEYS.CONTROLLER)
        const isRepository = Metadata.has(target, METADATA_KEYS.REPOSITORY)
        const isRouter = Metadata.has(target, METADATA_KEYS.ROUTER)
        const isHandler = Metadata.has(target, METADATA_KEYS.HANDLER)
        const isMiddleware = Metadata.has(target, METADATA_KEYS.MIDDLEWARE)

        if (!isService && !isController && !isRepository && !isRouter && !isHandler && !isMiddleware) {
            throw new Error(`Class ${target.name} is not injectable`)
        }

        const injectOverrides =
            Metadata.get(target, METADATA_KEYS.INJECT) || []

        const dependencies = injectOverrides.map(dependency => {
            return CoreContainer.get(dependency)
        })

        const instance = new target(...dependencies)

        this.instances.set(target, instance)

        return instance
    }
}

export default CoreContainer