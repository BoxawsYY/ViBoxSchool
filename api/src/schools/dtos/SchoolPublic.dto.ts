import School from '../entities/School.entity.js'

export class SchoolPublicDTO {
    code: string
    name: string
    city: string
    department: string
    address: string
    phone: string
    email: string
    officeHours: string
    levelsOffered: string
    description: string
    logoUrl: string
    brandColor: string

    constructor(school: School) {
        this.code = school.code
        this.name = school.name
        this.city = school.city
        this.department = school.department
        this.address = school.address
        this.phone = school.phone
        this.email = school.email
        this.officeHours = school.officeHours
        this.levelsOffered = school.levelsOffered
        this.description = school.description
        this.logoUrl = school.logoUrl
        this.brandColor = school.brandColor
    }
}

export default SchoolPublicDTO
