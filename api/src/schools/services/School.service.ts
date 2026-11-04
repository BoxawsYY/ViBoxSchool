import { Inject, Service } from '../../core/decorators/decorators.js'
import { NotFoundError } from '../../core/errors/NotFound.error.js'
import SchoolRepository from '../repositories/School.repository.js'

@Service()
export class SchoolService {

    constructor(
        @Inject(SchoolRepository)
        private schoolRepository: SchoolRepository
    ) { }

    async findDiscoverable() {
        return this.schoolRepository.findDiscoverable()
    }

    async findDiscoverableByCode(code: string) {
        const school = await this.schoolRepository.findDiscoverableByCode(code)

        if (!school) throw new NotFoundError('El colegio no existe o no está disponible públicamente')

        return school
    }
}

export default SchoolService
