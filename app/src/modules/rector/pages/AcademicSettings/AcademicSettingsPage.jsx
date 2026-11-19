import { useEffect, useState } from 'react'
import API from '../../../../core/config/api.config.mjs'
import Requester from '../../../../core/services/service/Requester.mjs'
import Switch from '../../../../core/components/Switch/Switch'
import './AcademicSettingsPage.css'

const FREQUENCIES = [
  ['monthly', 'Mensual'], ['bimonthly', 'Bimestral'], ['quarterly', 'Trimestral'],
  ['semiannual', 'Semestral'], ['annual', 'Anual']
]
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const currentYear = new Date().getFullYear()
const EMPTY_SETTINGS = {
  enrollmentPeriod: { startDate: `${currentYear}-01-01`, endDate: `${currentYear}-12-31`, lateFeePercentage: 5, lateFeeDay: 5, applyLateFee: true, pensionStartMonth: 1, pensionEndMonth: 10 },
  gradePeriods: []
}

const AcademicSettingsPage = () => {
  const [settings, setSettings] = useState(EMPTY_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showInactive, setShowInactive] = useState(false)

  useEffect(() => {
    let active = true
    Requester.get(`${API.SCHOOLS.BASE}/me/academic-settings?includeInactive=${showInactive}`).then(result => {
      if (!active) return
      if (!result.ok) throw new Error(result.message || 'No se pudieron cargar los parámetros académicos.')
      setSettings({
        enrollmentPeriod: { ...EMPTY_SETTINGS.enrollmentPeriod, ...(result.data?.enrollmentPeriod || {}) },
        gradePeriods: result.data?.gradePeriods || []
      })
    }).catch(requestError => {
      if (active) setError(requestError.message || 'No se pudieron cargar los parámetros académicos.')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [showInactive])

  useEffect(() => {
    if (!success) return undefined
    const timeout = window.setTimeout(() => setSuccess(''), 4000)
    return () => window.clearTimeout(timeout)
  }, [success])

  const updatePeriod = event => setSettings(current => ({
    ...current,
    enrollmentPeriod: { ...current.enrollmentPeriod, [event.target.name]: event.target.type === 'number' ? Number(event.target.value) : event.target.value }
  }))
  const updateGrade = (index, field, value) => setSettings(current => ({
    ...current,
    gradePeriods: current.gradePeriods.map((grade, gradeIndex) => gradeIndex === index
      ? { ...grade, [field]: field === 'name' || field === 'billingFrequency' ? value : Number(value) }
      : grade)
  }))
  const addGrade = () => setSettings(current => ({
    ...current,
    gradePeriods: [...current.gradePeriods, {
      gradeId: null,
      name: `Nuevo grado ${current.gradePeriods.filter(grade => grade.name.startsWith('Nuevo grado')).length + 1}`,
      isActive: true,
      maxCapacity: 30,
      enrolledCount: 0,
      enrollmentFee: 700000,
      tuitionFee: 380000,
      billingFrequency: 'monthly'
    }]
  }))
  const save = async event => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const result = await Requester.patch(`${API.SCHOOLS.BASE}/me/academic-settings`, settings)
      if (!result.ok) throw new Error(result.message || 'No se pudieron guardar los parámetros académicos.')
      setSettings(result.data)
      setSuccess('Los parámetros académicos se guardaron correctamente.')
    } catch (requestError) {
      setError(requestError.message || 'No se pudieron guardar los parámetros académicos.')
    } finally {
      setSaving(false)
    }
  }

  const toggleGrade = async grade => {
    if (!grade.gradeId) return
    setError('')
    const result = await Requester.patch(
      `${API.SCHOOLS.BASE}/me/academic-settings/grades/${grade.gradeId}/status`,
      { isActive: !grade.isActive }
    )
    if (!result.ok) {
      setError(result.message || 'No se pudo actualizar el estado del grado.')
      return
    }
    setSettings(current => ({
      ...current,
      gradePeriods: current.gradePeriods
        .map(item => item.gradeId === grade.gradeId ? { ...item, isActive: result.data.isActive } : item)
        .filter(item => showInactive || item.isActive)
    }))
  }

  const periodStatus = (() => {
    const today = new Date().toISOString().slice(0, 10)
    const { startDate, endDate } = settings.enrollmentPeriod
    return startDate <= today && today <= endDate ? 'Abierto' : 'Cerrado'
  })()

  return <main className="lx-p-academic-settings">
    <header className="lx-p-academic-settings-header">
      <div><span className="lx-p-academic-eyebrow">ADMINISTRACIÓN DEL COLEGIO</span><h1>Parámetros académico-financieros</h1><p>Grados, cupos, valores y periodos de matrícula</p></div>
      <button form="lx-academic-settings-form" type="submit" disabled={saving || loading}>{saving ? 'Guardando…' : 'Guardar cambios'}</button>
    </header>
    {error && <p className="lx-p-academic-alert is-error" role="alert">{error}</p>}
    {success && <p className="lx-p-academic-alert is-success" role="status">{success}</p>}
    {loading ? <p role="status">Cargando parámetros académicos…</p> : <form id="lx-academic-settings-form" onSubmit={save}>
      <div className="lx-p-academic-layout">
        <section className="lx-p-academic-card lx-p-academic-grade-card">
          <div className="lx-p-academic-card-heading"><div><h2>Grados y cupos</h2><p>Edita cupos, matrícula y pensión para cada grado.</p></div><label className="lx-p-academic-inactive-toggle">Mostrar grados inactivos<Switch checked={showInactive} ariaLabel="Mostrar grados inactivos" action={() => setShowInactive(value => !value)} /></label></div>
          <div className="lx-p-academic-table-wrap"><table className="lx-p-academic-table">
            <thead><tr><th>Grado</th><th>Cupo máximo</th><th>Matriculados</th><th>Valor matrícula</th><th>Pensión</th><th>Periodicidad</th><th>Estado</th></tr></thead>
            <tbody>{settings.gradePeriods.map((grade, index) => <tr className={grade.isActive === false ? 'is-inactive' : ''} key={grade.gradeId || `new-${index}`}>
              <td><input aria-label={`Nombre del grado ${index + 1}`} className="lx-p-academic-grade-name" value={grade.name} onChange={event => updateGrade(index, 'name', event.target.value)} required maxLength={60} /></td>
              <td><input aria-label={`Cupo máximo ${grade.name}`} type="number" min="0" step="1" value={grade.maxCapacity} onChange={event => updateGrade(index, 'maxCapacity', event.target.value)} required /></td>
              <td><span className="lx-p-academic-enrolled">{grade.enrolledCount || 0}</span></td>
              <td><input aria-label={`Valor de matrícula ${grade.name}`} type="number" min="0" step="1000" value={grade.enrollmentFee} onChange={event => updateGrade(index, 'enrollmentFee', event.target.value)} required /></td>
              <td><input aria-label={`Pensión ${grade.name}`} type="number" min="0" step="1000" value={grade.tuitionFee} onChange={event => updateGrade(index, 'tuitionFee', event.target.value)} required /></td>
              <td><select aria-label={`Periodicidad ${grade.name}`} value={grade.billingFrequency} onChange={event => updateGrade(index, 'billingFrequency', event.target.value)}>{FREQUENCIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></td>
              <td><button className="lx-p-academic-grade-status" type="button" disabled={!grade.gradeId} onClick={() => toggleGrade(grade)}>{grade.isActive === false ? 'Reactivar' : 'Eliminar'}</button></td>
            </tr>)}</tbody>
          </table></div>
          <button className="lx-p-academic-add" type="button" onClick={addGrade}>＋ Agregar grado</button>
        </section>

        <aside className="lx-p-academic-side">
          <section className="lx-p-academic-card">
            <h2>Periodo de matrícula {settings.enrollmentPeriod.academicYear || currentYear}</h2>
            <label>Fecha de apertura<input name="startDate" type="date" value={String(settings.enrollmentPeriod.startDate || '').slice(0, 10)} onChange={updatePeriod} required /></label>
            <label>Fecha de cierre<input name="endDate" type="date" value={String(settings.enrollmentPeriod.endDate || '').slice(0, 10)} onChange={updatePeriod} required /></label>
            <span className={`lx-p-academic-period-status ${periodStatus === 'Abierto' ? 'is-open' : ''}`}>{periodStatus}</span>
          </section>
          <section className="lx-p-academic-card lx-p-academic-month-range">
            <h2>Rango de pensiones</h2>
            <p>Define los meses que tendrán cuotas de pensión este año lectivo.</p>
            <div className="lx-p-academic-month-fields">
              <label>Mes de inicio<select name="pensionStartMonth" value={settings.enrollmentPeriod.pensionStartMonth} onChange={updatePeriod}>{MONTHS.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}</select></label>
              <label>Mes de fin<select name="pensionEndMonth" value={settings.enrollmentPeriod.pensionEndMonth} onChange={updatePeriod}>{MONTHS.map((month, index) => <option key={month} value={index + 1} disabled={index + 1 < settings.enrollmentPeriod.pensionStartMonth}>{month}</option>)}</select></label>
            </div>
          </section>
          <section className="lx-p-academic-card lx-p-academic-late-fee">
            <h2>Recargo por mora</h2>
            <div className="lx-p-academic-late-fields"><label>Porcentaje<input name="lateFeePercentage" type="number" min="0" max="100" step="0.1" value={settings.enrollmentPeriod.lateFeePercentage} onChange={updatePeriod} required /><small>%</small></label>
              <label>Día límite<input name="lateFeeDay" type="number" min="1" max="31" step="1" value={settings.enrollmentPeriod.lateFeeDay} onChange={updatePeriod} required /><small>de cada mes</small></label></div>
            <div className="lx-p-academic-late-toggle"><div><strong>Aplicar recargo automáticamente</strong><small>Se suma al estado de cuenta del padre</small></div><Switch checked={settings.enrollmentPeriod.applyLateFee} ariaLabel="Aplicar recargo por mora automáticamente" action={() => setSettings(current => ({ ...current, enrollmentPeriod: { ...current.enrollmentPeriod, applyLateFee: !current.enrollmentPeriod.applyLateFee } }))} /></div>
          </section>
        </aside>
      </div>
    </form>}
  </main>
}

export default AcademicSettingsPage
