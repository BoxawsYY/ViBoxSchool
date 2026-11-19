import { useEffect, useState } from 'react'
import API from '../../../../core/config/api.config.mjs'
import Requester from '../../../../core/services/service/Requester.mjs'
import Switch from '../../../../core/components/Switch/Switch'
import './SchoolSettingsPage.css'

const EDITABLE_FIELDS = [
  ['name', 'Nombre del colegio', true],
  ['city', 'Ciudad', true],
  ['department', 'Departamento', true],
  ['address', 'Dirección', false],
  ['phone', 'Teléfono', false],
  ['email', 'Correo electrónico', true],
  ['officeHours', 'Horario de atención', false],
  ['description', 'Descripción', false],
  ['logoUrl', 'URL del logo', false]
]
const LEVEL_OPTIONS = ['Preescolar', 'Básica Primaria (1° a 5°)', 'Básica Secundaria (6° a 9°)', 'Media (10° a 11°)']
const EMPTY_FORM = Object.fromEntries(EDITABLE_FIELDS.map(([key]) => [key, '']).concat([['levelsOffered', []], ['brandColor', '#438ad6']]))

const parseLevels = value => {
  if (!value) return []
  if (value.trim().toLocaleLowerCase('es') === 'preescolar a 11°') return [...LEVEL_OPTIONS]
  const stored = value.split(',').map(item => item.trim())
  return LEVEL_OPTIONS.filter(level => stored.includes(level))
}

export default function SchoolSettingsPage() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let active = true
    Requester.get(`${API.SCHOOLS.BASE}/me`).then(result => {
      if (!active) return
      setForm({
        ...Object.fromEntries(Object.keys(EMPTY_FORM).map(key => [key, result.data?.[key] ?? EMPTY_FORM[key]])),
        levelsOffered: parseLevels(result.data?.levelsOffered)
      })
    }).catch(requestError => {
      if (active) setError(requestError.message || 'No se pudo cargar la configuración del colegio.')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!success) return undefined
    const timeout = window.setTimeout(() => setSuccess(''), 4000)
    return () => window.clearTimeout(timeout)
  }, [success])

  const updateField = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }))
  const toggleLevel = level => setForm(current => ({
    ...current,
    levelsOffered: current.levelsOffered.includes(level)
      ? current.levelsOffered.filter(item => item !== level)
      : LEVEL_OPTIONS.filter(item => current.levelsOffered.includes(item) || item === level)
  }))
  const submit = async event => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const payload = { ...form, levelsOffered: form.levelsOffered.join(', ') }
      const result = await Requester.patch(`${API.SCHOOLS.BASE}/me`, payload)
      setForm(current => ({
        ...current,
        ...Object.fromEntries(Object.keys(EMPTY_FORM).filter(key => key !== 'levelsOffered').map(key => [key, result.data?.[key] ?? current[key]])),
        levelsOffered: parseLevels(result.data?.levelsOffered ?? payload.levelsOffered)
      }))
      setSuccess('La configuración del colegio se actualizó correctamente.')
    } catch (requestError) {
      setError(requestError.message || 'No se pudo guardar la configuración.')
    } finally {
      setSaving(false)
    }
  }

  return <main className="lx-p-school-settings">
    <header className="lx-p-school-settings-heading"><span className="material-symbols-rounded">tune</span><div><h1>Configuración del Colegio</h1><p>Actualiza la información institucional visible para las familias.</p></div></header>
    {error && <p className="lx-p-school-settings-alert is-error" role="alert">{error}</p>}
    {success && <p className="lx-p-school-settings-alert is-success" role="status">{success}</p>}
    {loading ? <p role="status">Cargando información del colegio…</p> : <form className="lx-p-school-settings-card" onSubmit={submit}>
      <div className="lx-p-school-settings-grid">
        {EDITABLE_FIELDS.map(([key, label, required]) => <label className={key === 'description' ? 'is-wide' : ''} key={key}>{label}
          {key === 'description' ? <textarea name={key} value={form[key]} onChange={updateField} rows={4} maxLength={2000} />
            : <input name={key} type={key === 'email' ? 'email' : 'text'} value={form[key]} onChange={updateField} required={required} maxLength={key === 'name' ? 160 : 500} />}
        </label>)}
        <fieldset className="lx-p-school-settings-levels"><legend>Niveles ofrecidos</legend><div>
          {LEVEL_OPTIONS.map(level => <div className="lx-p-school-settings-level-option" key={level}><span>{level}</span><Switch checked={form.levelsOffered.includes(level)} ariaLabel={`Ofrece nivel ${level}`} action={() => toggleLevel(level)} /></div>)}
        </div></fieldset>
        <label>Color institucional<div className="lx-p-school-settings-color"><input aria-label="Color institucional" type="color" name="brandColor" value={form.brandColor} onChange={updateField} /><span>{form.brandColor}</span></div></label>
      </div>
      <footer><button type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</button></footer>
    </form>}
  </main>
}
