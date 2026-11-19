import './NotificationSettingsPage.css'
import { useEffect, useMemo, useState } from 'react'
import Notify from '../../../../core/lib/notify.mjs'
import Switch from '../../../../core/components/Switch/Switch'
import NotificationSettingsRequester from '../../../panel/services/NotificationSettingsRequester.mjs'

const EVENT_TYPE_LABELS = {
    payment_reminder: 'Pensión por vencer',
    late_payment: 'Pensión vencida',
    documents_pending: 'Documentos pendientes',
    observation: 'Observación de documento',
    payment_confirmation: 'Pago confirmado',
    enrollment_confirmation: 'Matrícula confirmada',
    new_enrollment_request: 'Nueva solicitud de matrícula',
    payment_registered: 'Pago registrado',
    manual: 'Mensaje manual'
}

const CHANNEL_META = {
    email: { label: 'Correo', icon: 'mail' },
    whatsapp: { label: 'WhatsApp', icon: 'chat' },
    internal: { label: 'Interno', icon: 'notifications' }
}

const EVENT_TYPE_OPTIONS = Object.entries(EVENT_TYPE_LABELS)
const CHANNEL_OPTIONS = Object.entries(CHANNEL_META)

const EMPTY_FORM = {
    eventType: 'payment_reminder',
    channel: 'email',
    daysBefore: '',
    sendTime: '',
    template: ''
}

export default function NotificationSettingsPage() {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [form, setForm] = useState(EMPTY_FORM)

    useEffect(() => {
        let active = true

        const load = async () => {
            setLoading(true)
            try {
                const result = await NotificationSettingsRequester.list()
                if (!active) return
                setItems(result?.items ?? [])
                setError('')
            } catch (requestError) {
                if (active) setError(requestError.message || 'No se pudieron cargar las reglas')
            } finally {
                if (active) setLoading(false)
            }
        }

        load()
        return () => { active = false }
    }, [])

    useEffect(() => {
        if (!success) return undefined
        const timeout = window.setTimeout(() => setSuccess(''), 4000)
        return () => window.clearTimeout(timeout)
    }, [success])

    const updateForm = (field) => (event) => setForm(current => ({ ...current, [field]: event.target.value }))

    const startCreate = () => {
        setEditingId(null)
        setForm(EMPTY_FORM)
        setShowForm(true)
    }

    const startEdit = (item) => {
        setEditingId(item.id)
        setForm({
            eventType: item.eventType,
            channel: item.channel,
            daysBefore: item.daysBefore ?? '',
            sendTime: item.sendTime ?? '',
            template: item.template ?? ''
        })
        setShowForm(true)
    }

    const submit = async (event) => {
        event.preventDefault()
        if (saving) return

        setSaving(true)
        setError('')
        setSuccess('')

        const template = form.template.trim()
        if (!template) {
            setSaving(false)
            setError('La plantilla del mensaje es obligatoria')
            return
        }

        const payload = {
            eventType: form.eventType,
            channel: form.channel,
            template,
            daysBefore: form.daysBefore === '' ? null : Number.parseInt(form.daysBefore, 10),
            sendTime: form.sendTime === '' ? null : form.sendTime
        }

        try {
            const saved = editingId
                ? await NotificationSettingsRequester.update(editingId, payload)
                : await NotificationSettingsRequester.create(payload)

            setItems(current => editingId
                ? current.map(item => (item.id === editingId ? saved : item))
                : [...current, saved])
            setSuccess(editingId ? 'La regla se actualizó correctamente.' : 'La regla se creó correctamente.')
            setShowForm(false)
            setEditingId(null)
            setForm(EMPTY_FORM)
        } catch (requestError) {
            setError(requestError.message || 'No se pudo guardar la regla')
        } finally {
            setSaving(false)
        }
    }

    const toggleActive = (item) => async () => {
        const nextStatus = item.status === 'active' ? 'inactive' : 'active'
        try {
            const saved = await NotificationSettingsRequester.setStatus(item.id, nextStatus)
            setItems(current => current.map(entry => (entry.id === item.id ? saved : entry)))
        } catch (requestError) {
            Notify.notice(requestError.message || 'No se pudo cambiar el estado', 'error')
        }
    }

    const activeCount = useMemo(() => items.filter(item => item.status === 'active').length, [items])

    return (
        <section className='lx-p-notification-settings' aria-labelledby='lx-p-notification-settings-title'>
            <header className='lx-p-notification-settings-header'>
                <div>
                    <p className='lx-p-notification-settings-eyebrow'>Comunicación</p>
                    <h1 id='lx-p-notification-settings-title'>Reglas de notificaciones</h1>
                    <p>{activeCount} activa{activeCount === 1 ? '' : 's'} de {items.length} regla{items.length === 1 ? '' : 's'} del colegio. Define cuándo y por qué canal avisa el sistema.</p>
                </div>
                <button type='button' onClick={startCreate} disabled={saving}>+ Nueva regla</button>
            </header>

            {error && <div className='lx-p-notification-settings-alert is-error' role='alert'>{error}</div>}
            {success && <div className='lx-p-notification-settings-alert is-success' role='status'>{success}</div>}

            <div className='lx-p-notification-settings-layout'>
                {showForm && (
                    <form className='lx-p-notification-settings-card lx-p-notification-settings-form' onSubmit={submit}>
                        <div className='lx-p-notification-settings-card-heading'>
                            <div>
                                <h2>{editingId ? 'Editar regla' : 'Nueva regla'}</h2>
                                <p>El sistema la leerá antes de avisarle a la gente del colegio.</p>
                            </div>
                        </div>

                        <label>
                            Evento
                            <select value={form.eventType} onChange={updateForm('eventType')} required disabled={saving}>
                                {EVENT_TYPE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                            </select>
                        </label>

                        <label>
                            Canal
                            <select value={form.channel} onChange={updateForm('channel')} required disabled={saving}>
                                {CHANNEL_OPTIONS.map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
                            </select>
                        </label>

                        <div className='lx-p-notification-settings-form-row'>
                            <label>
                                Días antes (1–365)
                                <input type='number' min='1' max='365' step='1' value={form.daysBefore} onChange={updateForm('daysBefore')} placeholder='Opcional' disabled={saving} />
                            </label>
                            <label>
                                Hora de envío
                                <input type='time' value={form.sendTime} onChange={updateForm('sendTime')} disabled={saving} />
                            </label>
                        </div>

                        <label>
                            Plantilla del mensaje
                            <textarea value={form.template} onChange={updateForm('template')} maxLength={2000} required placeholder='Ej: Hola {studentName}, tu pensión vence en {daysBefore} días.' disabled={saving} />
                        </label>

                        <footer>
                            <button type='button' className='lx-p-notification-settings-cancel' onClick={() => { setShowForm(false); setEditingId(null) }} disabled={saving}>Cancelar</button>
                            <button type='submit' className='lx-p-notification-settings-submit' disabled={saving}>{saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear regla'}</button>
                        </footer>
                    </form>
                )}

                <div className='lx-p-notification-settings-list'>
                    {loading ? (
                        <div className='lx-p-notification-settings-loading'>
                            <span className='material-symbols-rounded' aria-hidden='true'>progress_activity</span>
                            <p>Cargando reglas…</p>
                        </div>
                    ) : items.length === 0 ? (
                        <div className='lx-p-notification-settings-empty'>
                            <span className='material-symbols-rounded' aria-hidden='true'>tune</span>
                            <h2>Aún no hay reglas</h2>
                            <p>Crea la primera regla de aviso del colegio con “+ Nueva regla”.</p>
                        </div>
                    ) : items.map(item => {
                        const channel = CHANNEL_META[item.channel] ?? CHANNEL_META.internal
                        const isActive = item.status === 'active'

                        return (
                            <article key={item.id} className={`lx-p-notification-settings-item${isActive ? '' : ' is-inactive'}`}>
                                <span className='lx-p-notification-settings-item-icon material-symbols-rounded' aria-hidden='true'>{channel.icon}</span>
                                <div>
                                    <div className='lx-p-notification-settings-item-title'>
                                        <h3>{EVENT_TYPE_LABELS[item.eventType] ?? item.eventType}</h3>
                                        <span className='lx-p-notification-settings-pill'>{channel.label}</span>
                                        <span className={`lx-p-notification-settings-pill${isActive ? ' is-active' : ''}`}>{isActive ? 'Activa' : 'Inactiva'}</span>
                                    </div>
                                    <p className='lx-p-notification-settings-meta'>
                                        {item.daysBefore !== null && `${item.daysBefore} día${item.daysBefore === 1 ? '' : 's'} antes`}
                                        {item.daysBefore !== null && item.sendTime && ' · '}
                                        {item.sendTime && `Hora: ${item.sendTime}`}
                                        {item.daysBefore === null && !item.sendTime && 'Sin anticipación configurada'}
                                    </p>
                                    <p className='lx-p-notification-settings-template'>{item.template}</p>
                                </div>
                                <div className='lx-p-notification-settings-item-actions'>
                                    <button type='button' className='lx-p-notification-settings-icon-button' onClick={() => startEdit(item)} aria-label='Editar regla' title='Editar regla'>
                                        <span className='material-symbols-rounded' aria-hidden='true'>edit</span>
                                    </button>
                                    <Switch checked={isActive} ariaLabel={`Activar o desactivar regla de ${EVENT_TYPE_LABELS[item.eventType] ?? item.eventType} por ${channel.label}`} action={toggleActive(item)} />
                                </div>
                            </article>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
