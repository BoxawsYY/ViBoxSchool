import School from '../entities/School.entity.js'

type SchoolPublicData = School & {
    availablePlaces?: number
    enrollmentOpen?: boolean
    enrollmentPeriod?: Record<string, any> | null
    gradePeriods?: Record<string, any>[]
    requiredDocuments?: Record<string, any>[]
}

export class SchoolPublicDTO {
    code: string
    name: string
    city: string
    department: string
    address: string
    phone: string
    email: string
    secretaryEmail: string
    officeHours: string
    levelsOffered: string
    description: string
    logoUrl: string
    brandColor: string
    isPartner: boolean
    availablePlaces: number
    enrollmentOpen: boolean
    enrollmentPeriod?: Record<string, any> | null
    gradePeriods?: Record<string, any>[]
    requiredDocuments?: Record<string, any>[]

    constructor(school: SchoolPublicData) {
        this.code = school.code
        this.name = school.name
        this.city = school.city
        this.department = school.department
        this.address = school.address
        this.phone = school.phone
        this.email = school.email
        this.secretaryEmail = school.secretaryEmail
        this.officeHours = school.officeHours
        this.levelsOffered = school.levelsOffered
        this.description = school.description
        this.logoUrl = school.logoUrl
        this.brandColor = school.brandColor
        this.isPartner = school.isPartner
        this.availablePlaces = school.availablePlaces ?? 0
        this.enrollmentOpen = school.enrollmentOpen ?? false
        if (school.enrollmentPeriod !== undefined) this.enrollmentPeriod = school.enrollmentPeriod
        if (school.gradePeriods !== undefined) this.gradePeriods = school.gradePeriods
        if (school.requiredDocuments !== undefined) this.requiredDocuments = school.requiredDocuments
    }
}

export default SchoolPublicDTO
