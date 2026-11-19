import { useEffect, useMemo, useState } from 'react'
import { URL_BASE } from '../../../../core/config/api.config.mjs'
import Requester from '../../../../core/services/service/Requester.mjs'
import Button from '../../../../core/components/Button/Button'
import Input from '../../../../core/components/Input/Input'
import Textarea from '../../../../core/components/Textarea/Textarea'
import './CashPaymentPage.css'

const money = value => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(value) || 0)
const itemKey = item => `${item.concept}:${item.id}`
const today = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
const initials = value => String(value || '').split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase()

export default function CashPaymentPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [student, setStudent] = useState(null)
  const [concepts, setConcepts] = useState([])
  const [selected, setSelected] = useState([])
  const [reference, setReference] = useState('')
  const [received, setReceived] = useState('')
  const [paymentDate, setPaymentDate] = useState(today())
  const [observations, setObservations] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [receipt, setReceipt] = useState(null)

  const chosen = useMemo(() => concepts.filter(item => selected.includes(itemKey(item))), [concepts, selected])
  const subtotal = chosen.filter(item => item.concept !== 'late_fee').reduce((sum, item) => sum + Number(item.amount), 0)
  const surcharge = chosen.filter(item => item.concept === 'late_fee').reduce((sum, item) => sum + Number(item.amount), 0)
  const total = subtotal + surcharge
  const change = Math.max(0, Number(received || 0) - total)
  const balance = concepts.reduce((sum, item) => sum + Number(item.amount), 0)

  useEffect(() => {
    const value = query.trim()
    if (value.length < 2) { setResults([]); return undefined }
    let active = true
    const timer = setTimeout(async () => {
      setLoading(true)
      setError('')
      const [studentResult, referenceResult] = await Promise.all([
        Requester.get(`${URL_BASE}/payments/students?q=${encodeURIComponent(value)}`),
        /^VB[\w-]+$/i.test(value) ? Requester.get(`${URL_BASE}/payments/reference/${encodeURIComponent(value)}`) : Promise.resolve({ ok: false })
      ])
      if (!active) return
      const matches = studentResult.ok ? studentResult.data.map(item => ({ type: 'student', ...item })) : []
      if (referenceResult.ok) matches.unshift({ type: 'reference', ...referenceResult.data })
      setResults(matches)
      if (!studentResult.ok && !referenceResult.ok) setError(studentResult.message || 'No se pudo realizar la búsqueda.')
      setLoading(false)
    }, 250)
    return () => { active = false; clearTimeout(timer) }
  }, [query])

  const loadStudent = async (studentId, pendingReference = null) => {
    setLoading(true)
    setError('')
    const result = await Requester.get(`${URL_BASE}/payments/students/${studentId}/payables`)
    if (!result.ok) {
      setError(result.message || 'No se pudieron consultar las deudas del estudiante.')
      setLoading(false)
      return
    }
    const data = result.data
    const payableItems = data.concepts || []
    setStudent({ ...data.student, balance: payableItems.reduce((sum, item) => sum + Number(item.amount), 0) })
    setConcepts(payableItems)
    setResults([])
    setReference(pendingReference?.referenceNumber || '')
    if (pendingReference) {
      setSelected(pendingReference.items.map(item => `${item.concept}:${item.concept === 'enrollment_fee' ? item.enrollmentId : item.pensionId}`))
      setReceived(pendingReference.totalAmount)
    } else {
      setSelected([])
      setReceived('')
    }
    setLoading(false)
  }

  const selectResult = item => {
    if (item.type === 'reference') return loadStudent(item.studentId, item)
    return loadStudent(item.id)
  }

  const toggleConcept = item => {
    setSelected(current => current.includes(itemKey(item)) ? current.filter(key => key !== itemKey(item)) : [...current, itemKey(item)])
  }

  const register = async () => {
    if (!student || !chosen.length || Number(received) < total || loading) return
    setError('')
    setLoading(true)
    const result = await Requester.post(`${URL_BASE}/payments/cash/register`, {
      studentId: student.id,
      referenceNumber: reference || undefined,
      concepts: chosen.map(({ id, concept }) => ({ id, concept })),
      amountReceived: Number(received),
      paymentDate,
      observations
    })
    if (result.ok) {
      setReceipt(result.data)
      setStudent(null)
      setConcepts([])
      setSelected([])
      setReference('')
      setQuery('')
      setReceived('')
      setObservations('')
    } else setError(result.message || 'No se pudo registrar el pago.')
    setLoading(false)
  }

  const downloadReceipt = async () => {
    setError('')
    try {
      const response = await fetch(`${URL_BASE}/payments/receipts/${receipt.receiptId}`, {
        headers: { Authorization: Requester.readToken() || '' }
      })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.message || 'No se pudo descargar el comprobante.')
      }
      const objectUrl = URL.createObjectURL(await response.blob())
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = `comprobante-${receipt.receiptNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
    } catch (downloadError) {
      setError(downloadError.message || 'No se pudo descargar el comprobante.')
    }
  }

  const cancel = () => {
    setStudent(null); setConcepts([]); setSelected([]); setReference(''); setReceived(''); setObservations('')
  }

  return <main className="lx-secretary-cash">
    <header className="lx-cash-page-header">
      <h1>Registrar pago en efectivo</h1>
      <p>Busca al estudiante, selecciona los conceptos y emite el comprobante</p>
    </header>

    {error && <div className="lx-cash-error" role="alert">{error}</div>}

    <div className="lx-cash-layout">
      <div className="lx-cash-left-column">
        <section className="lx-cash-card lx-cash-student-card">
          <h2>1 · Estudiante</h2>
          <div className="lx-cash-search-wrap">
            <span className="material-symbols-rounded" aria-hidden="true">search</span>
            <Input id="cash-payment-search" value={query} label="Buscar por nombre, documento, expediente o referencia..." type="search" autoComplete="off" onChange={event => { setQuery(event.target.value); setStudent(null); setConcepts([]); setSelected([]); setReference(''); setLoading(false) }} />
            {(results.length > 0 || loading && query.trim().length >= 2) && <div className="lx-cash-search-results" role="listbox">
              {loading && <div className="lx-cash-search-status">Buscando…</div>}
              {results.map(item => <button type="button" role="option" key={`${item.type}:${item.id}`} onClick={() => selectResult(item)}>
                <span className="lx-cash-search-result-icon material-symbols-rounded">{item.type === 'reference' ? 'receipt_long' : 'person'}</span>
                <span className="lx-cash-search-result-copy"><b>{item.type === 'reference' ? `Referencia ${item.referenceNumber}` : item.name}</b><small>{item.type === 'reference' ? `${item.studentName} · ${money(item.totalAmount)} · Pendiente` : `${item.documentType || ''} ${item.documentNumber || ''} · Expediente ${item.fileNumber || '—'}`}</small></span>
                <span className="material-symbols-rounded">chevron_right</span>
              </button>)}
              {!loading && !results.length && <div className="lx-cash-search-status">Sin resultados para esta búsqueda.</div>}
            </div>}
          </div>
          {student && <div className="lx-cash-selected-student">
            <span className="lx-cash-avatar">{initials(student.name)}</span>
            <span className="lx-cash-selected-student-copy"><b>{student.name}{student.grade ? ` · ${student.grade}` : ''}</b><small>{student.fileNumber || 'Sin expediente'} · Acudiente: {student.guardianName || 'No registrado'}</small></span>
            <span className="lx-cash-balance">Saldo {money(student.balance ?? balance)}</span>
          </div>}
        </section>

        {student && <>
          <section className="lx-cash-card lx-cash-concepts-card">
            <h2>2 · Conceptos a cobrar</h2>
            {concepts.length ? <ul className="lx-cash-items">{concepts.map(item => <li key={itemKey(item)}><label>
              <input type="checkbox" checked={selected.includes(itemKey(item))} onChange={() => toggleConcept(item)} />
              <span className="lx-cash-concept-copy"><b>{item.label}</b><small className={item.concept === 'late_fee' ? 'is-late' : ''}>{item.concept === 'late_fee' ? 'Recargo por mora' : item.dueDate ? `Vence ${new Date(`${item.dueDate.slice(0, 10)}T12:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'Pendiente de pago'}</small></span>
              <strong className={item.concept === 'late_fee' ? 'is-late' : ''}>{money(item.amount)}</strong>
            </label></li>)}</ul> : <p className="lx-cash-no-items">Este estudiante no tiene conceptos pendientes.</p>}
          </section>
          <section className="lx-cash-card lx-cash-payment-data">
            <h2>3 · Datos del pago</h2>
            <div className="lx-cash-payment-fields">
              <label><span>Valor recibido</span><input type="number" min="0" value={received} onChange={event => setReceived(event.target.value)} placeholder={money(total)} /></label>
              <label><span>Fecha de pago</span><input type="date" value={paymentDate} onChange={event => setPaymentDate(event.target.value)} /></label>
            </div>
            <Textarea id="cash-payment-observations" value={observations} label="Observaciones" onChange={event => setObservations(event.target.value)} rows={2} />
          </section>
        </>}
      </div>

      <aside className="lx-cash-card lx-cash-summary">
        <h2>Resumen y comprobante</h2>
        {chosen.length ? <div className="lx-cash-summary-items">{chosen.map(item => <div className={`lx-cash-summary-row${item.concept === 'late_fee' ? ' is-late' : ''}`} key={itemKey(item)}><span>{item.label}</span><b>{money(item.amount)}</b></div>)}</div> : <p className="lx-cash-summary-empty">Selecciona conceptos para ver el detalle del pago.</p>}
        <div className="lx-cash-summary-subtotal"><span>Subtotal</span><b>{money(subtotal)}</b></div>
        {surcharge > 0 && <div className="lx-cash-summary-surcharge"><span>Recargo por mora</span><b>{money(surcharge)}</b></div>}
        <div className="lx-cash-summary-total"><span>Total a registrar</span><strong>{money(total)}</strong></div>
        <div className="lx-cash-summary-amount"><span>Valor recibido</span><b>{money(received)}</b></div>
        <div className="lx-cash-summary-amount"><span>Cambio</span><b>{money(change)}</b></div>
        <Button color="accent" size="l" width="full" disabled={!student || !chosen.length || Number(received) < total || loading} onClick={register}>Registrar pago y generar comprobante</Button>
        <Button color="accent" variant="plain" size="m" width="full" disabled={!student || loading} onClick={cancel}>Cancelar</Button>
        <p className="lx-cash-summary-note">Se emitirá un comprobante PDF con número consecutivo y se notificará al acudiente.</p>
      </aside>
    </div>

    {receipt && <div className="lx-cash-modal-backdrop"><section className="lx-cash-modal" role="dialog" aria-modal="true"><h2>Pago registrado</h2><p>Comprobante {receipt.receiptNumber} · Referencia {receipt.referenceNumber}</p><p>Total recibido: <b>{money(receipt.totalAmount)}</b> · Cambio: <b>{money(receipt.changeAmount)}</b></p><p>Correo al acudiente: {receipt.email?.sent ? 'enviado' : 'pendiente/no disponible'}</p><Button color="accent" variant="bordered" width="full" onClick={downloadReceipt}><span className="material-symbols-rounded" aria-hidden="true">download</span> Descargar comprobante PDF</Button><Button color="accent" onClick={() => setReceipt(null)}>Cerrar</Button></section></div>}
  </main>
}
