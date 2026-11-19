import { Column, Entity, Id, ManyToOne } from '../../core/orm/decorators/decorators.js'
import School from '../../schools/entities/School.entity.js'
import User from '../../auth/entities/User.entity.js'

@Entity('EnrollmentPeriods')
export class EnrollmentPeriod {
    @Id()
    id: string

    @Column({ type: 'number', nullable: false })
    academicYear: number

    @Column({ type: 'date', nullable: false })
    startDate: Date

    @Column({ type: 'date', nullable: false })
    endDate: Date

    @Column({ type: 'string', nullable: false, default: 'open' })
    status: string

    @Column({ type: 'decimal', nullable: true })
    lateFeePercentage: string

    @Column({ type: 'number', nullable: true })
    lateFeeDay: number

    @Column({ type: 'number', nullable: false, default: 1 })
    pensionStartMonth: number

    @Column({ type: 'number', nullable: false, default: 10 })
    pensionEndMonth: number

    @Column({ type: 'boolean', nullable: true })
    applyLateFee: boolean

    @ManyToOne(() => School, { joinColumn: 'schoolId' })
    school: Partial<School>

    @ManyToOne(() => User, { joinColumn: 'definedById' })
    definedBy: Partial<User>

    isActive: boolean
    isDeleted: boolean
}

export default EnrollmentPeriod
