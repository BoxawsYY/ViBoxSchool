import { Column, Entity, Id } from '../../core/orm/decorators/decorators.js'

@Entity('Pensions')
export class Pension {
    @Id() id: string
    @Column({ type: 'uuid', nullable: false }) schoolId: string
    @Column({ type: 'uuid', nullable: false }) enrollmentId: string
    @Column({ type: 'date', nullable: false }) billingMonth: Date
    @Column({ type: 'date', nullable: false }) dueDate: Date
    @Column({ type: 'decimal', nullable: false }) amount: string
    @Column({ type: 'decimal', nullable: false, default: '0' }) lateFee: string
    @Column({ type: 'uuid', nullable: true }) lateFeeSettingId: string
    @Column({ type: 'string', nullable: false, default: 'pending' }) status: string
}

export default Pension
