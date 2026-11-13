import { Column, Entity, Id, ManyToOne } from '../../core/orm/decorators/decorators.js'
import School from '../../schools/entities/School.entity.js'
import Grade from './Grade.entity.js'
import EnrollmentPeriod from './EnrollmentPeriod.entity.js'

@Entity('GradePeriods')
export class GradePeriod {
    @Id()
    id: string

    @Column({ type: 'number', nullable: false })
    maxCapacity: number

    @Column({ type: 'decimal', nullable: false })
    enrollmentFee: string

    @Column({ type: 'decimal', nullable: false })
    tuitionFee: string

    @Column({ type: 'string', nullable: false })
    billingFrequency: string

    @Column({ type: 'number', nullable: false, default: 10 })
    installmentCount: number

    @Column({ type: 'string', nullable: false, default: 'active' })
    status: string

    @ManyToOne(() => School, { joinColumn: 'schoolId' })
    school: Partial<School>

    @ManyToOne(() => Grade, { joinColumn: 'gradeId' })
    grade: Partial<Grade>

    @ManyToOne(() => EnrollmentPeriod, { joinColumn: 'periodId' })
    period: Partial<EnrollmentPeriod>

    isActive: boolean
    isDeleted: boolean
}

export default GradePeriod
