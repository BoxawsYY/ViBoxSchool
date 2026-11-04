class Mocker {
    
    static async response({
                ok = true,
                status = 200,
                message = null,
                data = null,
                page = 1,
                max_page = 1,
                total = 1
            }) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        return { ok, status, message, data, page, max_page, total }
    }

    static async readAll() {
        return this.response({ data: this.mocks })
    }

    static async read(id) {
        return this.response({ data: this.mocks.find(object => object.id === id) })
    }

    static async create(object) {
        return await this.response({
            message: 'Creado correctamente.',
            data: {
                ...object,
                id: new Date().getTime(),
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: null
            }
        })
    }    

    static async update(object) {
        return await this.response({
            message: 'Actualizado correctamente.',
            data: object
        })
    }    

    static async activate() {
        return await this.response({ message: 'Activado correctamente.' })
    }

    static async desactivate() {
        return await this.response({ message: 'Desactivado correctamente.' })
    }

}

export default Mocker