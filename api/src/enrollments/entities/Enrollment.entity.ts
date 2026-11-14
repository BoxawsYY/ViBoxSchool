import { Column, Entity, Id, ManyToOne } from '../../core/orm/decorators/decorators.js'
import School from '../../schools/entities/School.entity.js'
import User from '../../auth/entities/User.entity.js'
import Student from './Student.entity.js'
import GradePeriod from './GradePeriod.entity.js'
import EnrollmentPeriod from './EnrollmentPeriod.entity.js'

@Entity('Enrollments')
export class Enrollment {
    @Id()
    id: string

    @Column({ type: 'string', nullable: false })
    fileNumber: string

    @Column({ type: 'date', nullable: false })
    requestedAt: Date

    @Column({ type: 'date', nullable: true })
    enrolledAt: Date

    @Column({ type: 'decimal', nullable: false })
    agreedFee: string

    @Column({ type: 'string', nullable: false, default: 'morning' })
    shift: string

    @Column({ type: 'string', nullable: false, default: 'pending' })
    status: string

    @ManyToOne(() => School, { joinColumn: 'schoolId' })
    school: Partial<School>

    @ManyToOne(() => Student, { joinColumn: 'studentId' })
    student: Partial<Student>

    @ManyToOne(() => GradePeriod, { joinColumn: 'gradePeriodId' })
    gradePeriod: Partial<GradePeriod>

    @ManyToOne(() => EnrollmentPeriod, { joinColumn: 'periodId' })
    period: Partial<EnrollmentPeriod>

    @ManyToOne(() => User, { joinColumn: 'registeredById' })
    registeredBy: Partial<User>

    isActive: boolean
    isDeleted: boolean
}

export default Enrollment
