import { Controller, Get, Inject, Public } from '../../core/decorators/decorators.js'
import Validator from '../../core/utils/Validator.js'
import SchoolPublicDTO from '../dtos/SchoolPublic.dto.js'
import SchoolService from '../services/School.service.js'

@Controller('/schools')
export class SchoolController {

    constructor(
        @Inject(SchoolService)
        private schoolService: SchoolService
    ) { }

    @Get('/discover')
    @Public()
    async discover(request, response) {
        const schools = await this.schoolService.findDiscoverable()

        return response.status(200).json(schools.map(school => new SchoolPublicDTO(school)))
    }

    @Get('/:code')
    @Public()
    async findPublicByCode(request, response) {
        const { code } = request.params || {}

        Validator.required({ code })

        const school = await this.schoolService.findDiscoverableByCode(code)

        return response.status(200).json(new SchoolPublicDTO(school))
    }
}

export default SchoolController
