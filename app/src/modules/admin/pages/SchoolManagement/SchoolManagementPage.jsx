import './SchoolManagementPage.css'
import { useCallback, useEffect, useMemo, useState } from 'react'
import SchoolManagementRequester from '../../services/SchoolManagementRequester.mjs'
import Modal from '../../../../core/components/Modal/Modal'

const getTokenColor = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()
const BRAND_COLORS = [
    '--lx-color-school-brand-blue',
    '--lx-color-school-brand-teal',
    '--lx-color-school-brand-berry',
    '--lx-color-school-brand-green',
    '--lx-color-school-brand-purple'
].map(getTokenColor)

const INITIAL_FORM = {
    name: '',
    nit: '',
    city: '',
    email: '',
    brandColor: BRAND_COLORS[0],
    isPartner: false
}

const STATUS_LABELS = {
    active: 'Activo',
    onboarding: 'En alta',
    suspended: 'Suspendido'
}

const SchoolManagementPage = () => {
    const [schools, setSchools] = useState([])
    const [form, setForm] = useState(INITIAL_FORM)
    const [editingSchool, setEditingSchool] = useState(null)
    const [selectedSchool, setSelectedSchool] = useState(null)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [partnerFilter, setPartnerFilter] = useState('all')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [updatingSchoolStatusId, setUpdatingSchoolStatusId] = useState(null)
    const [actionError, setActionError] = useState('')
    const [actionSuccess, setActionSuccess] = useState('')
    const [loadError, setLoadError] = useState('')
    const [formError, setFormError] = useState('')
    const [success, setSuccess] = useState('')

    const loadSchools = useCallback(async () => {
        setLoadError('')
        setLoading(true)
        try {
            const result = await SchoolManagementRequester.findAll()
            if (!Array.isArray(result)) throw new Error('La respuesta de colegios no es válida')
            setSchools(result)
        } catch (error) {
            setLoadError(error.message || 'No se pudieron cargar los colegios')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadSchools()
    }, [loadSchools])

    const filteredSchools = useMemo(() => schools.filter((school) => {
        const query = search.trim().toLocaleLowerCase('es')
        const matchesSearch = !query
            || `${school.name} ${school.city} ${school.nit}`.toLocaleLowerCase('es').includes(query)
        const matchesStatus = statusFilter === 'all' || school.status === statusFilter
        const matchesPartner = partnerFilter === 'all'
            || String(Boolean(school.isPartner)) === partnerFilter
        return matchesSearch && matchesStatus && matchesPartner
    }), [schools, search, statusFilter, partnerFilter])

    const updateForm = (event) => {
        const { name, value, checked, type } = event.target
        setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
    }

    const submit = async (event) => {
        event.preventDefault()
        setSaving(true)
        setFormError('')
        setSuccess('')
        try {
            const data = {
                ...form,
                name: form.name.trim(),
                nit: form.nit.trim(),
                city: form.city.trim(),
                email: form.email.trim()
            }
            const saved = editingSchool
                ? await SchoolManagementRequester.update(editingSchool.id, data)
                : await SchoolManagementRequester.create({ ...data, status: 'active' })
            setForm({ ...INITIAL_FORM })
            setSuccess(editingSchool
                ? `${saved.name} fue actualizado correctamente.`
                : `${saved.name} fue creado con su periodo lectivo y 12 grados configurados.`)
            setEditingSchool(null)
            await loadSchools()
        } catch (error) {
            setFormError(error.message || 'No se pudo guardar el colegio')
        } finally {
            setSaving(false)
        }
    }

    const startEditing = (school) => {
        setEditingSchool(school)
        setForm({
            name: school.name || '',
            nit: school.nit || '',
            city: school.city || '',
            email: school.email || '',
            brandColor: school.brandColor || INITIAL_FORM.brandColor,
            isPartner: Boolean(school.isPartner)
        })
        setFormError('')
        setSuccess('')
        document.getElementById('lx-school-create')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    const cancelEditing = () => {
        setEditingSchool(null)
        setForm({ ...INITIAL_FORM })
        setFormError('')
        setSuccess('')
    }

    const updateSchoolStatus = async (school) => {
        const isSuspended = school.status === 'suspended' || school.isActive === false
        const nextStatus = isSuspended ? 'active' : 'suspended'
        const confirmation = isSuspended
            ? `¿Reactivar ${school.name}? Volverá a estar disponible según su configuración de matrículas.`
            : `¿Desactivar ${school.name}? Ya no estará disponible para matrículas públicas.`
        if (!window.confirm(confirmation)) return

        setUpdatingSchoolStatusId(school.id)
        setActionError('')
        setActionSuccess('')
        try {
            const updatedSchool = await SchoolManagementRequester.updateStatus(school.id, nextStatus)
            setSchools((current) => current.map((item) => item.id === updatedSchool.id ? updatedSchool : item))
            setSelectedSchool((current) => current?.id === updatedSchool.id ? updatedSchool : current)
            setActionSuccess(`${updatedSchool.name} fue ${nextStatus === 'active' ? 'reactivado' : 'desactivado'}.`)
        } catch (error) {
            setActionError(error.message || 'No se pudo actualizar el estado del colegio')
        } finally {
            setUpdatingSchoolStatusId(null)
        }
    }

    return (
        <div className='lx-p-school-management'>
            <header className='lx-p-school-management-header'>
                <div>
                    <h1>Colegios</h1>
                    <p>{schools.length} colegios registrados · {schools.filter((school) => school.isPartner).length} aliados destacados</p>
                </div>
                <a href='#lx-school-create' className='lx-p-school-management-create-link'>Crear colegio</a>
            </header>

            <div className='lx-p-school-management-filters'>
                <label className='lx-p-school-management-search'>
                    <span className='material-symbols-rounded' aria-hidden='true'>search</span>
                    <span className='lx-p-school-management-visually-hidden'>Buscar colegio o ciudad</span>
                    <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder='Buscar colegio o ciudad...' />
                </label>
                <label>
                    <span className='lx-p-school-management-visually-hidden'>Filtrar por estado</span>
                    <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                        <option value='all'>Estado: Todos</option>
                        <option value='active'>Estado: Activo</option>
                        <option value='onboarding'>Estado: En alta</option>
                        <option value='suspended'>Estado: Suspendido</option>
                    </select>
                </label>
                <label>
                    <span className='lx-p-school-management-visually-hidden'>Filtrar por aliado</span>
                    <select value={partnerFilter} onChange={(event) => setPartnerFilter(event.target.value)}>
                        <option value='all'>Aliado: Todos</option>
                        <option value='true'>Aliado: Sí</option>
                        <option value='false'>Aliado: No</option>
                    </select>
                </label>
            </div>

            <div className='lx-p-school-management-layout'>
                <section className='lx-p-school-management-table-card' aria-label='Colegios registrados'>
                    {actionError && <p className='lx-p-school-management-alert' role='alert'>{actionError}</p>}
                    {actionSuccess && <p className='lx-p-school-management-success' role='status'>{actionSuccess}</p>}
                    {loading ? (
                        <p className='lx-p-school-management-message' role='status'>Cargando colegios...</p>
                    ) : loadError ? (
                        <div className='lx-p-school-management-message' role='alert'>
                            <p>{loadError}</p><button type='button' onClick={loadSchools}>Reintentar</button>
                        </div>
                    ) : (
                        <div className='lx-p-school-management-table-scroll'>
                            <table>
                                <thead>
                                    <tr><th>Colegio</th><th>Ciudad</th><th>Estudiantes</th><th>Estado</th><th aria-label='Acciones' /></tr>
                                </thead>
                                <tbody>
                                    {filteredSchools.map((school) => {
                                        const initials = school.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase('es')
                                        return (
                                            <tr key={school.id}>
                                                <td>
                                                    <span className='lx-p-school-management-school'>
                                                        <span className='lx-p-school-management-monogram' style={{ '--school-brand-color': school.brandColor || 'var(--lx-color-accent)' }}>{initials}</span>
                                                        <span><strong>{school.name}</strong>{school.isPartner && <small>Aliado</small>}</span>
                                                    </span>
                                                </td>
                                                <td>{school.city}</td>
                                                <td>{Number(school.studentCount || 0).toLocaleString('es-CO')}</td>
                                                <td><span className={`lx-p-school-management-status lx-p-school-management-status--${school.status}`}>{STATUS_LABELS[school.status] || school.status}</span></td>
                                                <td>
                                                    <span className='lx-p-school-management-row-actions'>
                                                        <button type='button' onClick={() => setSelectedSchool(school)} aria-label={`Ver detalles de ${school.name}`} title='Ver detalles'>
                                                            <span className='material-symbols-rounded' aria-hidden='true'>visibility</span>
                                                        </button>
                                                        <button type='button' onClick={() => startEditing(school)} aria-label={`Editar ${school.name}`} title='Editar'>
                                                            <span className='material-symbols-rounded' aria-hidden='true'>edit</span>
                                                        </button>
                                                        <button
                                                            className={`lx-p-school-management-status-action ${school.status === 'suspended' || school.isActive === false ? 'is-reactivate' : 'lx-p-school-management-deactivate'}`}
                                                            type='button'
                                                            onClick={() => updateSchoolStatus(school)}
                                                            disabled={updatingSchoolStatusId === school.id}
                                                            aria-label={`${school.status === 'suspended' || school.isActive === false ? 'Reactivar' : 'Desactivar'} ${school.name}`}
                                                            title={school.status === 'suspended' || school.isActive === false ? 'Reactivar colegio' : 'Desactivar colegio'}
                                                        >
                                                            <span className='material-symbols-rounded' aria-hidden='true'>
                                                                {school.status === 'suspended' || school.isActive === false ? 'check' : 'delete'}
                                                            </span>
                                                            <span>{school.status === 'suspended' || school.isActive === false ? 'Reactivar' : 'Desactivar'}</span>
                                                        </button>
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    {filteredSchools.length === 0 && <tr><td className='lx-p-school-management-no-results' colSpan='5'>No hay colegios que coincidan con los filtros.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <section className='lx-p-school-management-form-card' id='lx-school-create'>
                    <h2>{editingSchool ? 'Editar colegio' : 'Nuevo colegio'}</h2>
                    {formError && <p className='lx-p-school-management-alert' role='alert'>{formError}</p>}
                    {success && <p className='lx-p-school-management-success' role='status'>{success}</p>}
                    <form onSubmit={submit}>
                        <label>Nombre del colegio<input name='name' value={form.name} onChange={updateForm} required maxLength='160' /></label>
                        <div className='lx-p-school-management-fields'>
                            <label>NIT<input name='nit' value={form.nit} onChange={updateForm} required maxLength='32' /></label>
                            <label>Ciudad<input name='city' value={form.city} onChange={updateForm} required maxLength='100' /></label>
                        </div>
                        <label>Correo del rector<input name='email' type='email' value={form.email} onChange={updateForm} required maxLength='160' /></label>
                        <fieldset className='lx-p-school-management-colors'>
                            <legend>Color institucional</legend>
                            <div>
                                {BRAND_COLORS.map((color) => (
                                    <button
                                        aria-label={`Seleccionar color ${color}`}
                                        aria-pressed={form.brandColor === color}
                                        className={form.brandColor === color ? 'is-selected' : ''}
                                        key={color}
                                        onClick={() => setForm((current) => ({ ...current, brandColor: color }))}
                                        style={{ '--school-brand-color': color }}
                                        type='button'
                                    />
                                ))}
                                <label className='lx-p-school-management-custom-color' title='Color personalizado'>
                                    <input aria-label='Color institucional personalizado' name='brandColor' type='color' value={form.brandColor} onChange={updateForm} />
                                </label>
                            </div>
                        </fieldset>
                        <label className='lx-p-school-management-partner'>
                            <span><strong>Colegio aliado destacado</strong><small>Aparece en la landing global</small></span>
                            <input name='isPartner' type='checkbox' checked={form.isPartner} onChange={updateForm} />
                        </label>
                        {!editingSchool && <p className='lx-p-school-management-defaults'>Se crearán automáticamente el periodo lectivo actual, 12 grados, 30 cupos por grado, matrícula de $700.000 y pensión mensual de $380.000.</p>}
                        <div className='lx-p-school-management-actions'>
                            <button className='lx-p-school-management-cancel' type='button' onClick={cancelEditing}>Cancelar</button>
                            <button type='submit' disabled={saving}>{saving ? 'Guardando...' : editingSchool ? 'Guardar cambios' : 'Guardar colegio'}</button>
                        </div>
                    </form>
                </section>
            </div>
            <Modal
                show={Boolean(selectedSchool)}
                title='Detalles del colegio'
                size='middle'
                onClose={() => setSelectedSchool(null)}
            >
                {selectedSchool && (
                    <dl className='lx-p-school-management-details'>
                        <div><dt>Nombre</dt><dd>{selectedSchool.name}</dd></div>
                        <div><dt>NIT</dt><dd>{selectedSchool.nit || 'No registrado'}</dd></div>
                        <div><dt>Ciudad</dt><dd>{selectedSchool.city || 'No registrada'}</dd></div>
                        <div><dt>Correo del rector</dt><dd>{selectedSchool.email || 'No registrado'}</dd></div>
                        <div><dt>Color institucional</dt><dd><span className='lx-p-school-management-detail-color' style={{ '--school-brand-color': selectedSchool.brandColor || 'var(--lx-color-accent)' }} />{selectedSchool.brandColor || 'Predeterminado'}</dd></div>
                        <div><dt>Estado</dt><dd>{STATUS_LABELS[selectedSchool.status] || selectedSchool.status || 'No registrado'}</dd></div>
                    </dl>
                )}
            </Modal>
        </div>
    )
}

export default SchoolManagementPage
