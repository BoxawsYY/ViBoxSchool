import { Column, Entity, Id, ManyToOne } from '../../core/orm/decorators/decorators.js'
import School from '../../schools/entities/School.entity.js'
import Student from './Student.entity.js'
import Guardian from './Guardian.entity.js'

@Entity('StudentGuardians')
export class StudentGuardian {
    @Id()
    id: string

    @Column({ type: 'string', nullable: false })
    relationship: string

    @Column({ type: 'boolean', nullable: false, default: false })
    isPaymentResponsible: boolean

    @Column({ type: 'string', nullable: false, default: 'active' })
    status: string

    @ManyToOne(() => School, { joinColumn: 'schoolId' })
    school: Partial<School>

    @ManyToOne(() => Student, { joinColumn: 'studentId' })
    student: Partial<Student>

    @ManyToOne(() => Guardian, { joinColumn: 'guardianId' })
    guardian: Partial<Guardian>

    isActive: boolean
    isDeleted: boolean
}

export default StudentGuardian
