import { Repository } from '../../core/decorators/decorators.js'
import BaseRepository from '../../core/orm/repository/Base.repository.js'
import School from '../entities/School.entity.js'

const PUBLIC_SCHOOL_FIELDS = [
    'code',
    'name',
    'city',
    'department',
    'address',
    'phone',
    'email',
    'officeHours',
    'levelsOffered',
    'description',
    'logoUrl',
    'brandColor'
]

@Repository()
export class SchoolRepository extends BaseRepository<School> {

    constructor() {
        super(School)
    }

    async findDiscoverable() {
        return this.query({
            select: PUBLIC_SCHOOL_FIELDS,
            where: {
                status: 'active',
                isActive: true,
                isPartner: true
            },
            orderBy: {
                field: 'name',
                direction: 'ASC'
            }
        })
    }

    async findDiscoverableByCode(code: string) {
        const [school] = await this.query({
            select: PUBLIC_SCHOOL_FIELDS,
            where: {
                code,
                status: 'active',
                isActive: true,
                isPartner: true
            },
            limit: 1
        })

        return school || null
    }
}

export default SchoolRepository
