import './GlobalUsersPage.css'
import { useCallback, useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import GlobalUsersRequester from '../../services/GlobalUsersRequester.mjs'
import SchoolManagementRequester from '../../services/SchoolManagementRequester.mjs'
import Modal from '../../../../core/components/Modal/Modal'
import { useAuth } from '../../../../core/contexts/AuthContext'

const PAGE_SIZE = 10

const ROLES = {
    Guardian: { label: 'Padre de Familia', tone: 'neutral' },
    Secretary: { label: 'Secretaría', tone: 'accent' },
    Rector: { label: 'Rector', tone: 'success' },
    Admin: { label: 'Administrador', tone: 'warning' }
}

const STATUS = {
    active: { label: 'Activo', tone: 'success' },
    blocked: { label: 'Bloqueado', tone: 'danger' }
}

const DOCUMENT_TYPES = [
    { value: 'CC', label: 'Cédula de ciudadanía' },
    { value: 'CE', label: 'Cédula de extranjería' },
    { value: 'PP', label: 'Pasaporte' },
    { value: 'TI', label: 'Tarjeta de identidad' }
]

const GENDERS = [
    { value: 'F', label: 'Femenino' },
    { value: 'M', label: 'Masculino' },
    { value: 'O', label: 'Otro' }
]

const RELATIONSHIPS = [
    { value: 'mother', label: 'Madre' },
    { value: 'father', label: 'Padre' },
    { value: 'guardian', label: 'Acudiente' },
    { value: 'other', label: 'Otro' }
]

const INITIAL_FORM = {
    name: '',
    documentType: 'CC',
    documentNumber: '',
    gender: '',
    birthdate: '',
    email: '',
    phoneNumber: '',
    country: 'Colombia',
    city: '',
    address: '',
    role: 'Guardian',
    schoolId: '',
    studentId: '',
    relationship: '',
    username: '',
    password: '',
    image: ''
}

const toDateInput = (value) => (value ? String(value).slice(0, 10) : '')

const formatDate = (value) => {
    if (!value) return null
    const date = new Date(value)
    return Number.isNaN(date.getTime())
        ? null
        : date.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
}

const isSchoolRole = (role) => role !== 'Admin'
const isGuardianRole = (role) => role === 'Guardian'

const formatLastAccess = (value) => {
    if (!value) return 'Nunca'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Nunca'

    const time = date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })
    const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
    const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86400000)

    if (days <= 0) return `Hoy ${time}`
    if (days === 1) return `Ayer ${time}`
    if (days < 30) return `Hace ${days} días`
    return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

const formatNumber = (value) => Number(value || 0).toLocaleString('es-CO')

const SummaryCard = ({ label, value, detail, icon, tone }) => (
    <article className='lx-p-global-users-kpi'>
        <div className='lx-p-global-users-kpi-head'>
            <span>{label}</span>
            <span className={`lx-p-global-users-kpi-icon is-${tone}`}>
                <span className='material-symbols-rounded' aria-hidden='true'>{icon}</span>
            </span>
        </div>
        <strong>{formatNumber(value)}</strong>
        <small>{detail}</small>
    </article>
)

SummaryCard.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.number,
    detail: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
    tone: PropTypes.string.isRequired
}

const GlobalUsersPage = () => {
    const { session } = useAuth()
    const currentUserId = session?.user?.id

    const [users, setUsers] = useState([])
    const [total, setTotal] = useState(0)
    const [summary, setSummary] = useState(null)
    const [schools, setSchools] = useState([])
    const [page, setPage] = useState(0)

    const [searchInput, setSearchInput] = useState('')
    const [search, setSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState('')
    const [schoolFilter, setSchoolFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')

    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState('')
    const [actionError, setActionError] = useState('')
    const [actionSuccess, setActionSuccess] = useState('')

    const [formOpen, setFormOpen] = useState(false)
    const [editingUser, setEditingUser] = useState(null)
    const [form, setForm] = useState(INITIAL_FORM)
    const [formError, setFormError] = useState('')
    const [saving, setSaving] = useState(false)

    const [students, setStudents] = useState([])
    const [studentsLoading, setStudentsLoading] = useState(false)
    const [studentsError, setStudentsError] = useState('')

    const [selectedUser, setSelectedUser] = useState(null)
    const [pendingAction, setPendingAction] = useState(null)
    const [processing, setProcessing] = useState(false)

    // Búsqueda con pequeño retraso para no consultar en cada tecla.
    useEffect(() => {
        const timeout = setTimeout(() => {
            setSearch(searchInput.trim())
            setPage(0)
        }, 300)
        return () => clearTimeout(timeout)
    }, [searchInput])

    const loadUsers = useCallback(async () => {
        setLoadError('')
        setLoading(true)
        try {
            const result = await GlobalUsersRequester.findAll({
                search,
                role: roleFilter,
                schoolId: schoolFilter,
                status: statusFilter,
                limit: PAGE_SIZE,
                offset: page * PAGE_SIZE
            })
            if (!Array.isArray(result?.items)) throw new Error('La respuesta de usuarios no es válida')
            setUsers(result.items)
            setTotal(result.total || 0)
        } catch (error) {
            setLoadError(error.message || 'No se pudieron cargar los usuarios')
        } finally {
            setLoading(false)
        }
    }, [search, roleFilter, schoolFilter, statusFilter, page])

    const loadSummary = useCallback(async () => {
        try {
            setSummary(await GlobalUsersRequester.summary())
        } catch {
            setSummary(null)
        }
    }, [])

    useEffect(() => {
        loadUsers()
    }, [loadUsers])

    useEffect(() => {
        loadSummary()
        SchoolManagementRequester.findAll()
            .then((result) => setSchools(Array.isArray(result) ? result : []))
            .catch(() => setSchools([]))
    }, [loadSummary])

    // Estudiantes del colegio elegido, solo cuando el rol es Padre de familia.
    useEffect(() => {
        if (!formOpen || !isGuardianRole(form.role) || !form.schoolId) {
            setStudents([])
            setStudentsError('')
            return undefined
        }

        let cancelled = false
        setStudentsLoading(true)
        setStudentsError('')
        GlobalUsersRequester.findStudents(form.schoolId)
            .then((result) => { if (!cancelled) setStudents(Array.isArray(result) ? result : []) })
            .catch((error) => { if (!cancelled) setStudentsError(error.message || 'No se pudieron cargar los estudiantes') })
            .finally(() => { if (!cancelled) setStudentsLoading(false) })

        return () => { cancelled = true }
    }, [formOpen, form.role, form.schoolId])

    const sortedSchools = useMemo(
        () => [...schools].sort((a, b) => a.name.localeCompare(b.name, 'es')),
        [schools]
    )

    const refresh = async () => {
        await Promise.all([loadUsers(), loadSummary()])
    }

    const changeFilter = (setter) => (event) => {
        setter(event.target.value)
        setPage(0)
    }

    const openCreate = () => {
        setEditingUser(null)
        setForm({ ...INITIAL_FORM })
        setFormError('')
        setFormOpen(true)
    }

    const openEdit = (user) => {
        setEditingUser(user)
        setForm({
            name: user.name || '',
            documentType: user.documentType || 'CC',
            documentNumber: user.documentNumber || '',
            gender: user.gender || '',
            birthdate: toDateInput(user.birthdate),
            email: user.email || '',
            phoneNumber: user.phoneNumber || '',
            country: user.country || '',
            city: user.city || '',
            address: user.address || '',
            role: user.role || 'Guardian',
            schoolId: user.schoolId || '',
            studentId: user.studentId || '',
            relationship: user.relationship || '',
            username: user.username || '',
            password: '',
            image: user.image || ''
        })
        setFormError('')
        setFormOpen(true)
    }

    const closeForm = () => {
        if (saving) return
        setFormOpen(false)
        setEditingUser(null)
    }

    const updateForm = (event) => {
        const { name, value } = event.target
        setForm((current) => ({
            ...current,
            [name]: value,
            ...(name === 'role' && !isSchoolRole(value) ? { schoolId: '' } : {}),
            // Al cambiar de colegio o de rol, el estudiante elegido deja de ser válido.
            ...((name === 'schoolId' || (name === 'role' && !isGuardianRole(value))) ? { studentId: '' } : {})
        }))
    }

    const submit = async (event) => {
        event.preventDefault()
        setFormError('')

        if (isSchoolRole(form.role) && !form.schoolId) {
            setFormError('Selecciona el colegio al que pertenece el usuario.')
            return
        }
        if (isGuardianRole(form.role) && (!form.studentId || !form.relationship)) {
            setFormError('Selecciona el estudiante a cargo y el parentesco.')
            return
        }

        setSaving(true)
        try {
            const data = {
                name: form.name.trim(),
                documentType: form.documentType,
                documentNumber: form.documentNumber.trim(),
                gender: form.gender,
                birthdate: form.birthdate,
                email: form.email.trim(),
                phoneNumber: form.phoneNumber.trim(),
                country: form.country.trim(),
                city: form.city.trim(),
                address: form.address.trim(),
                role: form.role,
                schoolId: isSchoolRole(form.role) ? form.schoolId : null,
                ...(isGuardianRole(form.role) ? { studentId: form.studentId, relationship: form.relationship } : {}),
                username: form.username.trim(),
                image: form.image.trim(),
                ...(form.password ? { password: form.password } : {})
            }
            const saved = editingUser
                ? await GlobalUsersRequester.update(editingUser.id, data)
                : await GlobalUsersRequester.create(data)

            setActionError('')
            setActionSuccess(editingUser
                ? `${saved.name} fue actualizado correctamente.`
                : `${saved.name} fue creado correctamente.`)
            setFormOpen(false)
            setEditingUser(null)
            await refresh()
        } catch (error) {
            setFormError(error.message || 'No se pudo guardar el usuario')
        } finally {
            setSaving(false)
        }
    }

    const confirmAction = async () => {
        if (!pendingAction) return
        const { type, user } = pendingAction

        setProcessing(true)
        setActionError('')
        setActionSuccess('')
        try {
            if (type === 'delete') {
                await GlobalUsersRequester.remove(user.id)
                setActionSuccess(`${user.name} fue eliminado.`)
                if (users.length === 1 && page > 0) setPage(page - 1)
            } else {
                const nextStatus = user.status === 'blocked' ? 'active' : 'blocked'
                await GlobalUsersRequester.updateStatus(user.id, nextStatus)
                setActionSuccess(`${user.name} fue ${nextStatus === 'active' ? 'desbloqueado' : 'bloqueado'}.`)
            }
            setPendingAction(null)
            setSelectedUser(null)
            await refresh()
        } catch (error) {
            setActionError(error.message || 'No se pudo completar la acción')
            setPendingAction(null)
        } finally {
            setProcessing(false)
        }
    }

    const from = total === 0 ? 0 : page * PAGE_SIZE + 1
    const to = Math.min((page + 1) * PAGE_SIZE, total)
    const hasFilters = Boolean(search || roleFilter || schoolFilter || statusFilter)

    const renderRole = (role) => {
        const config = ROLES[role] || { label: role || 'Sin rol', tone: 'neutral' }
        return <span className={`lx-p-global-users-pill is-${config.tone}`}>{config.label}</span>
    }

    const renderStatus = (status) => {
        const config = STATUS[status] || STATUS.active
        return <span className={`lx-p-global-users-pill is-${config.tone}`}>{config.label}</span>
    }

    const pendingIsDelete = pendingAction?.type === 'delete'
    const pendingIsUnblock = pendingAction?.type === 'status' && pendingAction.user.status === 'blocked'

    return (
        <div className='lx-p-global-users'>
            <header className='lx-p-global-users-header'>
                <div>
                    <h1>Usuarios globales</h1>
                    <p>{formatNumber(summary?.total ?? total)} usuarios en toda la plataforma</p>
                </div>
                <button type='button' className='lx-p-global-users-primary' onClick={openCreate}>Crear usuario</button>
            </header>

            <section className='lx-p-global-users-kpis' aria-label='Resumen de usuarios por rol'>
                <SummaryCard
                    label='Padres de familia'
                    value={summary?.guardians?.users}
                    detail={`En ${formatNumber(summary?.guardians?.schools)} colegios`}
                    icon='person'
                    tone='accent'
                />
                <SummaryCard label='Secretarías' value={summary?.secretaries?.users} detail='Una o más por colegio' icon='description' tone='accent' />
                <SummaryCard label='Rectores' value={summary?.rectors?.users} detail='Uno por colegio' icon='shield' tone='success' />
                <SummaryCard label='Administradores' value={summary?.admins?.users} detail='Acceso global' icon='lock' tone='warning' />
            </section>

            <div className='lx-p-global-users-filters'>
                <label className='lx-p-global-users-search'>
                    <span className='material-symbols-rounded' aria-hidden='true'>search</span>
                    <span className='lx-p-global-users-visually-hidden'>Buscar por nombre o correo</span>
                    <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder='Buscar por nombre o correo...' />
                </label>
                <label>
                    <span className='lx-p-global-users-visually-hidden'>Filtrar por rol</span>
                    <select value={roleFilter} onChange={changeFilter(setRoleFilter)}>
                        <option value=''>Rol: Todos</option>
                        {Object.entries(ROLES).map(([value, config]) => (
                            <option key={value} value={value}>Rol: {config.label}</option>
                        ))}
                    </select>
                </label>
                <label>
                    <span className='lx-p-global-users-visually-hidden'>Filtrar por colegio</span>
                    <select value={schoolFilter} onChange={changeFilter(setSchoolFilter)}>
                        <option value=''>Colegio: Todos</option>
                        <option value='platform'>Colegio: Plataforma</option>
                        {sortedSchools.map((school) => (
                            <option key={school.id} value={school.id}>Colegio: {school.name}</option>
                        ))}
                    </select>
                </label>
                <label>
                    <span className='lx-p-global-users-visually-hidden'>Filtrar por estado</span>
                    <select value={statusFilter} onChange={changeFilter(setStatusFilter)}>
                        <option value=''>Estado: Todos</option>
                        <option value='active'>Estado: Activo</option>
                        <option value='blocked'>Estado: Bloqueado</option>
                    </select>
                </label>
            </div>

            <section className='lx-p-global-users-table-card' aria-label='Usuarios registrados'>
                {actionError && <p className='lx-p-global-users-alert' role='alert'>{actionError}</p>}
                {actionSuccess && <p className='lx-p-global-users-success' role='status'>{actionSuccess}</p>}

                {loadError ? (
                    <div className='lx-p-global-users-message' role='alert'>
                        <p>{loadError}</p>
                        <button type='button' onClick={loadUsers}>Reintentar</button>
                    </div>
                ) : (
                    <div className={`lx-p-global-users-table-scroll ${loading ? 'is-loading' : ''}`} aria-busy={loading}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Usuario</th>
                                    <th>Rol</th>
                                    <th>Colegio</th>
                                    <th>Estado</th>
                                    <th>Último acceso</th>
                                    <th aria-label='Acciones' />
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => {
                                    const isSelf = user.id === currentUserId
                                    const isBlocked = user.status === 'blocked'
                                    return (
                                        <tr key={user.id}>
                                            <td>
                                                <span className='lx-p-global-users-user'>
                                                    <strong>{user.name}</strong>
                                                    <small>{user.email}</small>
                                                </span>
                                            </td>
                                            <td>{renderRole(user.role)}</td>
                                            <td>{user.schoolName || (user.role === 'Admin' ? 'Plataforma' : 'Sin colegio')}</td>
                                            <td>{renderStatus(user.status)}</td>
                                            <td className='lx-p-global-users-muted'>{formatLastAccess(user.lastLogin)}</td>
                                            <td>
                                                <span className='lx-p-global-users-row-actions'>
                                                    <button type='button' onClick={() => setSelectedUser(user)} aria-label={`Ver detalles de ${user.name}`} title='Ver detalles'>
                                                        <span className='material-symbols-rounded' aria-hidden='true'>visibility</span>
                                                    </button>
                                                    <button type='button' onClick={() => openEdit(user)} aria-label={`Editar ${user.name}`} title='Editar'>
                                                        <span className='material-symbols-rounded' aria-hidden='true'>edit</span>
                                                    </button>
                                                    <button
                                                        type='button'
                                                        className={isBlocked ? 'is-positive' : 'is-warning'}
                                                        onClick={() => setPendingAction({ type: 'status', user })}
                                                        disabled={isSelf}
                                                        aria-label={`${isBlocked ? 'Desbloquear' : 'Bloquear'} a ${user.name}`}
                                                        title={isSelf ? 'No puedes bloquear tu propia cuenta' : isBlocked ? 'Desbloquear' : 'Bloquear'}
                                                    >
                                                        <span className='material-symbols-rounded' aria-hidden='true'>{isBlocked ? 'lock_open' : 'block'}</span>
                                                    </button>
                                                    <button
                                                        type='button'
                                                        className='is-danger'
                                                        onClick={() => setPendingAction({ type: 'delete', user })}
                                                        disabled={isSelf}
                                                        aria-label={`Eliminar a ${user.name}`}
                                                        title={isSelf ? 'No puedes eliminar tu propia cuenta' : 'Eliminar'}
                                                    >
                                                        <span className='material-symbols-rounded' aria-hidden='true'>delete</span>
                                                    </button>
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })}
                                {!loading && users.length === 0 && (
                                    <tr>
                                        <td className='lx-p-global-users-no-results' colSpan='6'>
                                            {hasFilters ? 'No hay usuarios que coincidan con los filtros.' : 'Aún no hay usuarios registrados.'}
                                        </td>
                                    </tr>
                                )}
                                {loading && users.length === 0 && (
                                    <tr><td className='lx-p-global-users-no-results' colSpan='6'>Cargando usuarios...</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {!loadError && total > 0 && (
                    <footer className='lx-p-global-users-pagination'>
                        <span>Mostrando {from}–{to} de {formatNumber(total)}</span>
                        <div>
                            <button type='button' onClick={() => setPage(page - 1)} disabled={page === 0 || loading}>Anterior</button>
                            <button type='button' onClick={() => setPage(page + 1)} disabled={to >= total || loading}>Siguiente</button>
                        </div>
                    </footer>
                )}
            </section>

            <Modal show={formOpen} title={editingUser ? 'Editar usuario' : 'Nuevo usuario'} size='middle' onClose={closeForm}>
                <form className='lx-p-global-users-form' onSubmit={submit}>
                    {formError && <p className='lx-p-global-users-alert' role='alert'>{formError}</p>}
                    <p className='lx-p-global-users-form-hint'>Los campos marcados con * son obligatorios.</p>

                    <fieldset className='lx-p-global-users-form-section'>
                        <legend>Datos personales</legend>
                        <label>Nombre completo *<input name='name' value={form.name} onChange={updateForm} required minLength='2' maxLength='120' /></label>
                        <div className='lx-p-global-users-fields'>
                            <label>Tipo de documento
                                <select name='documentType' value={form.documentType} onChange={updateForm}>
                                    {DOCUMENT_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                                </select>
                            </label>
                            <label>Número de documento<input name='documentNumber' value={form.documentNumber} onChange={updateForm} maxLength='32' /></label>
                        </div>
                        <div className='lx-p-global-users-fields'>
                            <label>Género
                                <select name='gender' value={form.gender} onChange={updateForm}>
                                    <option value=''>Sin especificar</option>
                                    {GENDERS.map((gender) => <option key={gender.value} value={gender.value}>{gender.label}</option>)}
                                </select>
                            </label>
                            <label>Fecha de nacimiento<input name='birthdate' type='date' value={form.birthdate} onChange={updateForm} max={new Date().toISOString().slice(0, 10)} /></label>
                        </div>
                    </fieldset>

                    <fieldset className='lx-p-global-users-form-section'>
                        <legend>Contacto</legend>
                        <div className='lx-p-global-users-fields'>
                            <label>Correo electrónico *<input name='email' type='email' value={form.email} onChange={updateForm} required maxLength='160' /></label>
                            <label>Teléfono<input name='phoneNumber' type='tel' value={form.phoneNumber} onChange={updateForm} maxLength='32' /></label>
                        </div>
                        <div className='lx-p-global-users-fields'>
                            <label>País<input name='country' value={form.country} onChange={updateForm} maxLength='80' /></label>
                            <label>Ciudad<input name='city' value={form.city} onChange={updateForm} maxLength='100' /></label>
                        </div>
                        <label>Dirección<input name='address' value={form.address} onChange={updateForm} maxLength='200' /></label>
                    </fieldset>

                    <fieldset className='lx-p-global-users-form-section'>
                        <legend>Acceso a la plataforma</legend>
                        <div className='lx-p-global-users-fields'>
                            <label>Rol *
                                <select name='role' value={form.role} onChange={updateForm} required>
                                    {Object.entries(ROLES).map(([value, config]) => (
                                        <option key={value} value={value}>{config.label}</option>
                                    ))}
                                </select>
                            </label>
                            {isSchoolRole(form.role) ? (
                                <label>Colegio *
                                    <select name='schoolId' value={form.schoolId} onChange={updateForm} required>
                                        <option value=''>Selecciona un colegio</option>
                                        {sortedSchools.map((school) => (
                                            <option key={school.id} value={school.id}>{school.name}</option>
                                        ))}
                                    </select>
                                </label>
                            ) : (
                                <label>Colegio<input value='Plataforma (acceso global)' disabled /></label>
                            )}
                        </div>
                        {isGuardianRole(form.role) && (
                            <div className='lx-p-global-users-student'>
                                <div className='lx-p-global-users-fields'>
                                    <label>Estudiante a cargo *
                                        <select
                                            name='studentId'
                                            value={form.studentId}
                                            onChange={updateForm}
                                            required
                                            disabled={!form.schoolId || studentsLoading || students.length === 0}
                                        >
                                            <option value=''>
                                                {!form.schoolId
                                                    ? 'Primero elige el colegio'
                                                    : studentsLoading
                                                        ? 'Cargando estudiantes...'
                                                        : students.length === 0 ? 'Sin estudiantes' : 'Selecciona un estudiante'}
                                            </option>
                                            {students.map((student) => (
                                                <option key={student.id} value={student.id}>
                                                    {student.name}{student.documentNumber ? ` · ${student.documentType || ''} ${student.documentNumber}` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <label>Parentesco *
                                        <select name='relationship' value={form.relationship} onChange={updateForm} required>
                                            <option value=''>Selecciona</option>
                                            {RELATIONSHIPS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                                        </select>
                                    </label>
                                </div>
                                {studentsError && <small className='lx-p-global-users-field-error'>{studentsError}</small>}
                                {form.schoolId && !studentsLoading && !studentsError && students.length === 0 && (
                                    <small className='lx-p-global-users-field-error'>
                                        Este colegio aún no tiene estudiantes. Primero se debe matricular uno desde el wizard de matrícula.
                                    </small>
                                )}
                                {!form.schoolId && <small>Solo se muestran los estudiantes del colegio seleccionado.</small>}
                            </div>
                        )}
                        <label>
                            Usuario *
                            <input
                                name='username'
                                value={form.username}
                                onChange={updateForm}
                                required
                                minLength='3'
                                maxLength='80'
                                pattern='[a-zA-Z0-9][a-zA-Z0-9._@\-]{2,79}'
                                title='Entre 3 y 80 caracteres: letras, números, punto, guion, guion bajo o @'
                                autoComplete='off'
                                placeholder='Ej.: maria.ortiz'
                            />
                            <small>Con este usuario o con el correo se inicia sesión. Letras, números, punto, guion, guion bajo o @.</small>
                        </label>
                        <label>
                            {editingUser ? 'Nueva contraseña' : 'Contraseña *'}
                            <input
                                name='password'
                                type='password'
                                value={form.password}
                                onChange={updateForm}
                                required={!editingUser}
                                minLength='8'
                                autoComplete='new-password'
                            />
                            <small>
                                {editingUser ? 'Déjala vacía para mantener la actual. ' : ''}
                                Mínimo 8 caracteres con letras, números y un símbolo (@$!%*?&).
                            </small>
                        </label>
                        <label>
                            Foto (URL)
                            <input name='image' type='url' value={form.image} onChange={updateForm} maxLength='500' placeholder='https://...' />
                        </label>
                    </fieldset>
                    <div className='lx-p-global-users-form-actions'>
                        <button type='button' className='lx-p-global-users-secondary' onClick={closeForm} disabled={saving}>Cancelar</button>
                        <button type='submit' className='lx-p-global-users-primary' disabled={saving}>
                            {saving ? 'Guardando...' : editingUser ? 'Guardar cambios' : 'Guardar usuario'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal show={Boolean(selectedUser)} title='Detalles del usuario' size='middle' onClose={() => setSelectedUser(null)}>
                {selectedUser && (
                    <dl className='lx-p-global-users-details'>
                        <div><dt>Nombre</dt><dd>{selectedUser.name}</dd></div>
                        <div><dt>Correo</dt><dd>{selectedUser.email}</dd></div>
                        <div><dt>Usuario</dt><dd>{selectedUser.username}</dd></div>
                        <div><dt>Rol</dt><dd>{renderRole(selectedUser.role)}</dd></div>
                        <div><dt>Colegio</dt><dd>{selectedUser.schoolName || 'Plataforma'}</dd></div>
                        {selectedUser.role === 'Guardian' && (
                            <>
                                <div><dt>Estudiante a cargo</dt><dd>{selectedUser.studentName || 'Sin estudiante asociado'}</dd></div>
                                <div><dt>Parentesco</dt><dd>{RELATIONSHIPS.find((item) => item.value === selectedUser.relationship)?.label || 'No registrado'}</dd></div>
                            </>
                        )}
                        <div><dt>Documento</dt><dd>{selectedUser.documentNumber ? `${selectedUser.documentType || ''} ${selectedUser.documentNumber}`.trim() : 'No registrado'}</dd></div>
                        <div><dt>Género</dt><dd>{GENDERS.find((gender) => gender.value === selectedUser.gender)?.label || 'No registrado'}</dd></div>
                        <div><dt>Fecha de nacimiento</dt><dd>{formatDate(selectedUser.birthdate) || 'No registrada'}</dd></div>
                        <div><dt>Teléfono</dt><dd>{selectedUser.phoneNumber || 'No registrado'}</dd></div>
                        <div><dt>País</dt><dd>{selectedUser.country || 'No registrado'}</dd></div>
                        <div><dt>Ciudad</dt><dd>{selectedUser.city || 'No registrada'}</dd></div>
                        <div><dt>Dirección</dt><dd>{selectedUser.address || 'No registrada'}</dd></div>
                        <div><dt>Estado</dt><dd>{renderStatus(selectedUser.status)}</dd></div>
                        <div><dt>Último acceso</dt><dd>{formatLastAccess(selectedUser.lastLogin)}</dd></div>
                    </dl>
                )}
            </Modal>

            <Modal
                show={Boolean(pendingAction)}
                title={pendingIsDelete ? 'Eliminar usuario' : pendingIsUnblock ? 'Desbloquear usuario' : 'Bloquear usuario'}
                size='middle'
                onClose={() => !processing && setPendingAction(null)}
            >
                {pendingAction && (
                    <div className='lx-p-global-users-confirm'>
                        <p>
                            {pendingIsDelete
                                ? <>¿Eliminar a <strong>{pendingAction.user.name}</strong>? Ya no podrá iniciar sesión ni aparecerá en el listado.</>
                                : pendingIsUnblock
                                    ? <>¿Desbloquear a <strong>{pendingAction.user.name}</strong>? Podrá volver a iniciar sesión.</>
                                    : <>¿Bloquear a <strong>{pendingAction.user.name}</strong>? No podrá iniciar sesión hasta que lo desbloquees.</>}
                        </p>
                        <div className='lx-p-global-users-form-actions'>
                            <button type='button' className='lx-p-global-users-secondary' onClick={() => setPendingAction(null)} disabled={processing}>Cancelar</button>
                            <button
                                type='button'
                                className={pendingIsUnblock ? 'lx-p-global-users-primary' : 'lx-p-global-users-danger'}
                                onClick={confirmAction}
                                disabled={processing}
                            >
                                {processing ? 'Procesando...' : pendingIsDelete ? 'Eliminar' : pendingIsUnblock ? 'Desbloquear' : 'Bloquear'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    )
}

export default GlobalUsersPage
