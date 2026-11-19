import { Inject, Service } from '../../core/decorators/decorators.js'
import { AlreadyExistError } from '../../core/errors/AlreadyExist.error.js'
import { NotFoundError } from '../../core/errors/NotFound.error.js'
import { ForbiddenError } from '../../core/errors/Forbidden.error.js'
import School from '../entities/School.entity.js'
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

    async findAllForAdmin() {
        return this.schoolRepository.findAllForAdmin()
    }

    async findForRector(schoolId: string) {
        const school = await this.schoolRepository.findById(schoolId)
        if (!school || school.isDeleted) throw new NotFoundError('El colegio no existe')
        return school
    }

    async updateForRector(userSchoolId: string, data: Partial<School>) {
        if (!userSchoolId) throw new ForbiddenError('El usuario no tiene acceso a un colegio')
        const school = await this.findForRector(userSchoolId)
        const updated = await this.schoolRepository.updateSchool(school.id, data)
        if (!updated) throw new NotFoundError('El colegio no existe')
        return updated
    }

    async getAcademicSettingsForRector(schoolId: string, includeInactive = false) {
        await this.findForRector(schoolId)
        return this.schoolRepository.findAcademicSettings(schoolId, includeInactive)
    }

    async setGradeActiveForRector(schoolId: string, gradeId: string, isActive: boolean) {
        await this.findForRector(schoolId)
        const grade = await this.schoolRepository.setGradeActive(schoolId, gradeId, isActive)
        if (!grade) throw new NotFoundError('El grado no existe en este colegio')
        return grade
    }

    async saveAcademicSettingsForRector(schoolId: string, settings: {
        enrollmentPeriod: { startDate: string, endDate: string, lateFeePercentage: number, lateFeeDay: number, applyLateFee: boolean, pensionStartMonth: number, pensionEndMonth: number },
        gradePeriods: Array<{ gradeId?: string, name: string, maxCapacity: number, enrollmentFee: number, tuitionFee: number, billingFrequency: string }>
    }) {
        await this.findForRector(schoolId)
        return this.schoolRepository.saveAcademicSettings(schoolId, settings)
    }

    async create(data: Partial<School>) {
        const code = data.code || String(data.name)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')

        const existingCode = await this.schoolRepository.findOneBy('code', code, true)
        if (existingCode) throw new AlreadyExistError(`El código "${code}" ya está registrado`)
        const existingNit = await this.schoolRepository.findOneBy('nit', data.nit, true)
        if (existingNit) throw new AlreadyExistError(`El NIT "${data.nit}" ya está registrado`)

        return this.schoolRepository.createSchoolWithAcademicDefaults({
            ...data,
            code,
            isActive: true,
            isDeleted: false,
            status: 'active'
        })
    }

    async update(id: string, data: Partial<School>) {
        const school = await this.schoolRepository.findById(id)
        if (!school) throw new NotFoundError('El colegio no existe')

        const duplicateNit = await this.schoolRepository.findOneBy('nit', data.nit, true)
        if (duplicateNit && duplicateNit.id !== id) {
            throw new AlreadyExistError(`El NIT "${data.nit}" ya está registrado`)
        }

        const updated = await this.schoolRepository.updateSchool(id, data)
        if (!updated) throw new NotFoundError('El colegio no existe')
        return updated
    }

    async deactivate(id: string) {
        return this.updateStatus(id, 'suspended')
    }

    async updateStatus(id: string, status: 'active' | 'suspended') {
        const school = await this.schoolRepository.findById(id)
        if (!school || school.isDeleted) throw new NotFoundError('El colegio no existe')
        const isActive = status === 'active'
        if (school.status === status && school.isActive === isActive) return school

        const updated = await this.schoolRepository.updateSchool(id, {
            status,
            isActive
        })
        if (!updated) throw new NotFoundError('El colegio no existe')
        return updated
    }
}

export default SchoolService
