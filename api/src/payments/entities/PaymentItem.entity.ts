import { Column, Entity, Id } from '../../core/orm/decorators/decorators.js'

@Entity('PaymentItems')
export class PaymentItem {
    @Id() id: string
    @Column({ type: 'uuid', nullable: false }) schoolId: string
    @Column({ type: 'uuid', nullable: false }) paymentId: string
    @Column({ type: 'string', nullable: false }) concept: string
    @Column({ type: 'uuid', nullable: true }) pensionId: string
    @Column({ type: 'uuid', nullable: true }) enrollmentId: string
    @Column({ type: 'decimal', nullable: false }) appliedAmount: string
    @Column({ type: 'string', nullable: false, default: 'active' }) status: string
}

export default PaymentItem
