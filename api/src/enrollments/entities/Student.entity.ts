import { Column, Entity, Id, ManyToOne } from '../../core/orm/decorators/decorators.js'
import School from '../../schools/entities/School.entity.js'

@Entity('Students')
export class Student {
    @Id()
    id: string

    @Column({ type: 'string', nullable: true })
    code: string

    @Column({ type: 'string', nullable: false })
    documentType: string

    @Column({ type: 'string', nullable: false })
    documentNumber: string

    @Column({ type: 'string', nullable: false })
    name: string

    @Column({ type: 'string', nullable: true })
    gender: string

    @Column({ type: 'date', nullable: true })
    birthDate: Date

    @Column({ type: 'string', nullable: true })
    phone: string

    @Column({ type: 'string', nullable: true })
    address: string

    @Column({ type: 'string', nullable: true })
    previousSchool: string

    @Column({ type: 'string', nullable: false, default: 'active' })
    status: string

    @ManyToOne(() => School, { joinColumn: 'schoolId' })
    school: Partial<School>

    isActive: boolean
    isDeleted: boolean
}

export default Student
