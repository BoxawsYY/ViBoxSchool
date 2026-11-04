import fs from 'fs'
import path from 'path'
import { pathToFileURL, fileURLToPath } from 'url'
import { Metadata } from '../metadata/Metadata.js'
import { METADATA_KEYS } from '../metadata/keys.js'
import { Router } from '../decorators/router.decorator.js'
import CoreContainer from '../container/Core.container.js'
import AuthMiddleware from '../middlewares/Auth.middleware.js'
import RouteHandler from '../handlers/Route.handler.js'

@Router()
export class CoreRouter {

    constructor(
        private app: any,
        private prefix: string = ''
    ) { }

    async explore() {
        const __filename = fileURLToPath(import.meta.url)
        const __dirname = path.dirname(__filename)

        const baseDir = path.resolve(__dirname, '../../')
        const files = this.scan(baseDir)

        for (const file of files) {
            const module = await import(pathToFileURL(file).href)

            for (const exported of Object.values(module)) {

                const controller = exported as any

                if (!Metadata.has(controller, METADATA_KEYS.BASE_PATH)) continue

                console.log('[Router] ✔ Controller registered ', { controller: controller.name, basePath: Metadata.get(controller, METADATA_KEYS.BASE_PATH) })
                this.register(controller)
            }
        }
    }

    private register(controller: any) {

        const basePath = Metadata.get(controller, METADATA_KEYS.BASE_PATH)
        const instance = CoreContainer.get(controller)
        const middleware = CoreContainer.get(AuthMiddleware)

        const methods = Object.getOwnPropertyNames(controller.prototype)

        for (const methodName of methods) {

            if (methodName === 'constructor') continue

            const method = controller.prototype[methodName]
            const route = Metadata.get(method, METADATA_KEYS.ROUTE)

            if (!route) continue

            const { method: httpMethod, path } = route

            const handler = new RouteHandler(method, instance, middleware)

            this.app[httpMethod](
                `${this.prefix}${basePath}${path}`,
                handler.execute.bind(handler)
            )

            console.log(
                '[Router] ✔ Route mapped',
                {
                    method: httpMethod.toUpperCase(),
                    fullPath: `${this.prefix}${basePath}${path}`
                }
            )
        }
    }

    private scan(dir: string, files: string[] = []) {
        const entries = fs.readdirSync(dir)

        for (const entry of entries) {
            const fullPath = path.join(dir, entry)

            if (fs.statSync(fullPath).isDirectory()) {
                this.scan(fullPath, files)
            } else if (
                entry.endsWith('.controller.ts') ||
                entry.endsWith('.controller.js')
            ) {
                files.push(fullPath)
            }
        }

        return files
    }
}

export default CoreRouter