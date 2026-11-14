import { Column, Entity, Id, ManyToOne } from '../../core/orm/decorators/decorators.js'
import School from '../../schools/entities/School.entity.js'

@Entity('Grades')
export class Grade {
    @Id()
    id: string

    @Column({ type: 'string', nullable: false })
    code: string

    @Column({ type: 'string', nullable: false })
    name: string

    @Column({ type: 'number', nullable: false, default: 0 })
    sortOrder: number

    @Column({ type: 'string', nullable: false, default: 'active' })
    status: string

    @ManyToOne(() => School, { joinColumn: 'schoolId' })
    school: Partial<School>

    isActive: boolean
    isDeleted: boolean
}

export default Grade
