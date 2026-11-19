import { useEffect, useMemo, useState } from 'react'
import { URL_BASE } from '../../../../core/config/api.config.mjs'
import Requester from '../../../../core/services/service/Requester.mjs'
import './PaymentPage.css'

const money = value => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(value) || 0)
const itemKey = item => `${item.concept}:${item.id}`
const dateLabel = value => value ? new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) : null
const isOverdue = value => {
    if (!value) return false
    const due = new Date(`${value.slice(0, 10)}T00:00:00`)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return due < today
}

export default function PaymentPage() {
    const [concepts, setConcepts] = useState([])
    const [references, setReferences] = useState([])
    const [student, setStudent] = useState(null)
    const [selected, setSelected] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [paymentMethod, setPaymentMethod] = useState('pse')
    const [modal, setModal] = useState(null)
    const [copied, setCopied] = useState(false)

    const load = async () => {
        setLoading(true)
        const result = await Requester.get(`${URL_BASE}/payments/payables`)
        if (result.ok) {
            setConcepts(result.data?.concepts ?? [])
            setReferences(result.data?.references ?? [])
            setStudent(result.data?.student ?? null)
            setError('')
        } else setError(result.message || 'No se pudieron cargar los conceptos pendientes.')
        setLoading(false)
    }

    useEffect(() => { load() }, [])

    const total = useMemo(() => concepts.filter(item => selected.includes(itemKey(item))).reduce((sum, item) => sum + Number(item.amount), 0), [concepts, selected])
    const chosen = concepts.filter(item => selected.includes(itemKey(item)))
    const toggle = item => setSelected(current => current.includes(itemKey(item)) ? current.filter(key => key !== itemKey(item)) : [...current, itemKey(item)])

    const generateCash = async () => {
        if (!chosen.length || saving) return
        setSaving(true)
        setError('')
        const result = await Requester.post(`${URL_BASE}/payments/cash`, { concepts: chosen.map(({ id, concept }) => ({ id, concept })) })
        if (result.ok) {
            setModal({ type: 'cash', payment: result.data })
            setCopied(false)
            setSelected([])
            await load()
        } else setError(result.message || 'No se pudo generar la referencia de pago.')
        setSaving(false)
    }

    const preparePse = async () => {
        if (!chosen.length || saving) return
        setSaving(true)
        setError('')
        const result = await Requester.post(`${URL_BASE}/payments/pse`, { concepts: chosen.map(({ id, concept }) => ({ id, concept })) })
        if (result.ok) {
            setModal({ type: 'pse' })
            await load()
        } else setError(result.message || 'No se pudo actualizar la referencia de efectivo vigente.')
        setSaving(false)
    }

    const copyReference = async () => {
        try {
            await navigator.clipboard.writeText(modal.payment.referenceNumber)
            setCopied(true)
        } catch {
            setError('No se pudo copiar automáticamente. Puedes seleccionar y copiar el número mostrado.')
        }
    }

    return <section className="lx-p-payments">
        <header className="lx-p-payments-header"><div><h1>Pagar</h1><p>Selecciona los conceptos y el medio de pago{student?.name ? ` · ${student.name}` : ''}</p></div></header>
        {error && <div className="lx-p-payments-alert" role="alert">{error}</div>}
        {loading ? <div className="lx-p-payments-empty">Cargando conceptos pendientes…</div> : !student ? <div className="lx-p-payments-empty">No encontramos un estudiante asociado a esta cuenta.</div> : <div className="lx-p-payments-layout">
            <div className="lx-p-payments-main">
                {references.length > 0 && <section className="lx-p-payments-card lx-p-payments-active-references"><h2>Referencias de efectivo pendientes</h2>{references.map(reference => <article key={reference.id} className="lx-p-payments-reference-row"><div><strong>Número de referencia</strong><b>{reference.referenceNumber}</b></div><span>{money(reference.totalAmount)}</span><ul>{reference.items.map((item, index) => <li key={`${itemKey(item)}:${index}`}>{item.label} · {money(item.appliedAmount)}</li>)}</ul></article>)}</section>}
                <section className="lx-p-payments-card"><h2>1 · Conceptos a pagar</h2>{concepts.length ? <ul className="lx-p-payments-list">{concepts.map(item => <li key={itemKey(item)}><label className="lx-p-payments-item"><input type="checkbox" checked={selected.includes(itemKey(item))} onChange={() => toggle(item)} /><span className="lx-p-payments-item-copy"><strong>{item.label}</strong>{item.dueDate && <small className={isOverdue(item.dueDate) ? 'is-overdue' : ''}>{isOverdue(item.dueDate) && <span className="lx-p-payments-overdue-badge">Vencido</span>}{isOverdue(item.dueDate) ? 'Venció' : 'Vence'} {dateLabel(item.dueDate)}</small>}</span><b>{money(item.amount)}</b></label></li>)}</ul> : <div className="lx-p-payments-no-concepts">No hay conceptos pendientes por pagar.</div>}</section>
                <section className="lx-p-payments-card"><h2>2 · Medio de pago</h2><label className={`lx-p-payments-method${paymentMethod === 'pse' ? ' is-selected' : ''}`}><input type="radio" name="payment-method" value="pse" checked={paymentMethod === 'pse'} onChange={() => setPaymentMethod('pse')} /><span className="material-symbols-rounded">account_balance</span><span className="lx-p-payments-method-copy"><strong>PSE · Pago en línea</strong><small>Débito desde tu cuenta bancaria</small></span><span className="lx-p-payments-method-tag">En desarrollo</span></label><label className={`lx-p-payments-method${paymentMethod === 'cash' ? ' is-selected' : ''}`}><input type="radio" name="payment-method" value="cash" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} /><span className="material-symbols-rounded">payments</span><span className="lx-p-payments-method-copy"><strong>Efectivo en Secretaría</strong><small>Genera una referencia y paga en la sede del colegio</small></span></label></section>
            </div>
            <aside className="lx-p-payments-card lx-p-payments-summary"><h2>Resumen del pago</h2>{chosen.map(item => <div className="lx-p-payments-summary-row" key={itemKey(item)}><span>{item.label}</span><b>{money(item.amount)}</b></div>)}<div className="lx-p-payments-total"><span>Total a pagar</span><strong>{money(total)}</strong></div><button className="lx-p-payments-pse-button" type="button" disabled={!chosen.length || saving} onClick={paymentMethod === 'cash' ? generateCash : preparePse}>{paymentMethod === 'cash' ? (saving ? 'Generando referencia…' : 'Generar referencia de efectivo') : `Pagar ${money(total)} con PSE`}</button><p>{paymentMethod === 'cash' ? 'La referencia pendiente también quedará visible en esta vista.' : 'Serás informado cuando PSE esté disponible.'}</p></aside>
        </div>}
        {modal && <div className="lx-p-payments-modal-backdrop" onClick={() => setModal(null)}><section className="lx-p-payments-modal" role="dialog" aria-modal="true" aria-labelledby="lx-payment-modal-title" onClick={event => event.stopPropagation()}><h2 id="lx-payment-modal-title">{modal.type === 'cash' ? 'Referencia de pago generada' : 'Método en desarrollo'}</h2>{modal.type === 'cash' ? <><p>Presenta este número en la secretaría para pagar {money(modal.payment.totalAmount)}.</p><strong className="lx-p-payments-modal-reference">{modal.payment.referenceNumber}</strong><div className="lx-p-payments-modal-actions"><button type="button" onClick={copyReference}>{copied ? 'Copiado' : 'Copiar referencia'}</button><button type="button" className="is-secondary" onClick={() => setModal(null)}>Cerrar</button></div></> : <><p>El pago en línea con PSE todavía no está disponible. La referencia de efectivo anterior para los conceptos seleccionados fue invalidada.</p><button type="button" onClick={() => setModal(null)}>Cerrar</button></>}</section></div>}
    </section>
}
