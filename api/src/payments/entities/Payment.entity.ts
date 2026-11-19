import { Column, Entity, Id } from '../../core/orm/decorators/decorators.js'

@Entity('Payments')
export class Payment {
    @Id() id: string
    @Column({ type: 'uuid', nullable: false }) schoolId: string
    @Column({ type: 'uuid', nullable: false }) payerGuardianId: string
    @Column({ type: 'uuid', nullable: true }) registeredById: string
    @Column({ type: 'date', nullable: false }) paidAt: Date
    @Column({ type: 'decimal', nullable: false }) totalAmount: string
    @Column({ type: 'string', nullable: false }) method: string
    @Column({ type: 'string', nullable: false }) channel: string
    @Column({ type: 'string', nullable: true }) transactionReference: string
    @Column({ type: 'string', nullable: false, default: 'pending' }) status: string
}

export default Payment
