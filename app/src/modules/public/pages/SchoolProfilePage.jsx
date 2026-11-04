import './SchoolProfilePage.css'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PlatformLogo from '../../../core/components/PlatformLogo/PlatformLogo'
import SchoolRequester from '../services/SchoolRequester.mjs'

const DEMO_SCHOOL_PROFILE = {
    code: 'colegio-san-rafael',
    name: 'Colegio San Rafael',
    city: 'Santa Marta',
    department: 'Magdalena',
    address: 'Cra. 18 #22-45, Bavaria',
    phone: '+57 605 420 1840',
    email: 'admisiones@sanrafael.edu.co',
    officeHours: 'Lunes a viernes, 7:00 a. m. – 3:00 p. m.',
    levelsOffered: 'Preescolar, básica primaria, básica secundaria y media',
    description: 'Una comunidad educativa que acompaña a cada estudiante en su desarrollo académico y personal.',
    brandColor: '#d9982b',
    enrollmentPeriod: {
        label: 'Admisiones 2026–2027',
        status: 'Abierto',
        closeDate: '31 de enero de 2027',
        academicYear: '2027'
    },
    gradePeriods: [
        { grade: 'Prejardín', level: 'Preescolar', availableSeats: 12, enrollmentFee: 420000, tuitionFee: 385000 },
        { grade: 'Transición', level: 'Preescolar', availableSeats: 8, enrollmentFee: 420000, tuitionFee: 385000 },
        { grade: '1° primaria', level: 'Primaria', availableSeats: 0, enrollmentFee: 465000, tuitionFee: 425000 },
        { grade: '6° básica', level: 'Secundaria', availableSeats: 3, enrollmentFee: 510000, tuitionFee: 465000 },
        { grade: '10° media', level: 'Media', availableSeats: 6, enrollmentFee: 545000, tuitionFee: 495000 }
    ],
    availablePlaces: 42,
    requiredDocuments: [
        'Registro civil de nacimiento',
        'Documento de identidad del estudiante',
        'Boletín de calificaciones más reciente',
        'Certificado de afiliación a salud',
        'Documentos de identidad de los acudientes'
    ]
}

const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || amount === '') return '—'
    const value = Number(amount)
    if (!Number.isFinite(value)) return '—'
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
    }).format(value)
}

const SchoolProfilePage = () => {
    const { code } = useParams()
    const [school, setSchool] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')
    const [logoFailed, setLogoFailed] = useState(false)
    const [isDemo, setIsDemo] = useState(false)

    useEffect(() => {
        let isMounted = true

        setSchool(null)
        setError('')
        setNotice('')
        setLoading(true)
        SchoolRequester.findByCode(code)
            .then((result) => {
                if (!isMounted) return
                setSchool(result)
                setIsDemo(false)
            })
            .catch((requestError) => {
                if (!isMounted) return
                if (code === DEMO_SCHOOL_PROFILE.code) {
                    setSchool(DEMO_SCHOOL_PROFILE)
                    setIsDemo(true)
                } else {
                    setError(requestError.message)
                }
            })
            .finally(() => {
                if (isMounted) setLoading(false)
            })

        return () => {
            isMounted = false
        }
    }, [code])

    useEffect(() => {
        setLogoFailed(false)
    }, [school?.logoUrl])

    const exampleProfile = school?.code === DEMO_SCHOOL_PROFILE.code && school.gradePeriods === undefined
        ? DEMO_SCHOOL_PROFILE
        : null
    const gradePeriods = school?.gradePeriods || exampleProfile?.gradePeriods || []
    const requiredDocuments = school?.requiredDocuments || exampleProfile?.requiredDocuments || []
    const enrollmentPeriod = school?.enrollmentPeriod || exampleProfile?.enrollmentPeriod
    const availablePlaces = school?.availablePlaces ?? exampleProfile?.availablePlaces

    const brandColor = /^#[\da-f]{6}$/i.test(school?.brandColor || '')
        ? school.brandColor
        : 'var(--lx-color-accent)'
    const initials = useMemo(() => (
        school?.name
            ?.trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((word) => word.charAt(0).toLocaleUpperCase('es'))
            .join('') || 'CO'
    ), [school?.name])

    return (
        <main className='lx-p-school-profile'>
            <header className='lx-p-school-profile-header'>
                <Link to='/' aria-label='ViBoxSchool home'>
                    <PlatformLogo />
                </Link>
                <nav aria-label='Navegación principal'>
                    <Link to='/'>Directorio</Link>
                    <Link to='/#como-funciona'>Cómo funciona</Link>
                    <Link className='lx-p-school-profile-signin' to='/auth'>Ingresar</Link>
                </nav>
            </header>

            {loading && <p className='lx-p-school-profile-state' role='status'>Cargando perfil del colegio...</p>}
            {!loading && error && (
                <div className='lx-p-school-profile-state lx-p-school-profile-error' role='alert'>
                    <h1>No encontramos ese colegio</h1>
                    <p>{error}</p>
                    <Link to='/'>Volver al directorio</Link>
                </div>
            )}
            {!loading && !error && school && (
                <>
                    <div className='lx-p-school-profile-breadcrumb'>
                        <Link to='/'>Directorio</Link>
                        <span aria-hidden='true'>/</span>
                        <span>{school.name}</span>
                    </div>

                    <section className='lx-p-school-profile-hero' style={{ '--school-brand-color': brandColor }}>
                        <div className='lx-p-school-profile-school'>
                            <div className='lx-p-school-profile-logo'>
                                {school.logoUrl && !logoFailed
                                    ? <img src={school.logoUrl} alt={`Logo de ${school.name}`} onError={() => setLogoFailed(true)} />
                                    : <span aria-label={`Logo de ${school.name}`}>{initials}</span>}
                            </div>
                            <div className='lx-p-school-profile-title'>
                                <span className='lx-p-school-profile-badge'><span aria-hidden='true'>✓</span> Colegio aliado</span>
                                <h1>{school.name}</h1>
                                <p>{[school.city, school.department].filter(Boolean).join(', ')}</p>
                            </div>
                        </div>
                        <div className='lx-p-school-profile-actions'>
                            <Link className='lx-p-school-profile-enroll' to={`/enroll/${encodeURIComponent(school.code)}`}>
                                Iniciar matrícula <span aria-hidden='true'>→</span>
                            </Link>
                            <button
                                className='lx-p-school-profile-download'
                                type='button'
                                onClick={() => {
                                    setNotice('La ficha de requisitos PDF de este colegio aún no está publicada.')
                                    console.info(`Solicitud de ficha de requisitos RF-01 para el colegio "${school.code}"`)
                                }}
                            >
                                Descargar ficha de requisitos <span aria-hidden='true'>↓</span>
                            </button>
                        </div>
                    </section>

                    {isDemo && (
                        <p className='lx-p-school-profile-demo' role='status'>
                            El servicio no está disponible. Se muestran datos de demostración para este colegio.
                        </p>
                    )}
                    {!isDemo && exampleProfile && (
                        <p className='lx-p-school-profile-demo' role='status'>
                            Los cupos, tarifas y documentos mostrados son datos de demostración; aún no están disponibles en la API.
                        </p>
                    )}
                    {notice && <p className='lx-p-school-profile-notice' role='status'>{notice}</p>}

                    <section className='lx-p-school-profile-content'>
                        <div className='lx-p-school-profile-main'>
                            <article className='lx-p-school-profile-card lx-p-school-profile-about'>
                                <div className='lx-p-school-profile-section-heading'>
                                    <span className='lx-p-school-profile-icon' aria-hidden='true'>▤</span>
                                    <div>
                                        <span className='lx-p-school-profile-eyebrow'>INFORMACIÓN DEL COLEGIO</span>
                                        <h2>Conoce la institución</h2>
                                    </div>
                                </div>
                                <p className='lx-p-school-profile-description'>
                                    {school.description || 'Conoce la propuesta educativa de esta institución y comunícate directamente para obtener más información.'}
                                </p>
                                <div className='lx-p-school-profile-facts'>
                                    <div>
                                        <span className='lx-p-school-profile-fact-icon' aria-hidden='true'>⌖</span>
                                        <div><strong>Ubicación</strong><span>{[school.city, school.department].filter(Boolean).join(', ') || 'No especificada'}</span></div>
                                    </div>
                                    <div>
                                        <span className='lx-p-school-profile-fact-icon' aria-hidden='true'>▧</span>
                                        <div><strong>Niveles educativos</strong><span>{school.levelsOffered || 'Consulta con el colegio'}</span></div>
                                    </div>
                                    {school.address && (
                                        <div>
                                            <span className='lx-p-school-profile-fact-icon' aria-hidden='true'>⌂</span>
                                            <div><strong>Dirección</strong><span>{school.address}</span></div>
                                        </div>
                                    )}
                                    {school.officeHours && (
                                        <div>
                                            <span className='lx-p-school-profile-fact-icon' aria-hidden='true'>◷</span>
                                            <div><strong>Horario de atención</strong><span>{school.officeHours}</span></div>
                                        </div>
                                    )}
                                </div>
                            </article>

                            <article className='lx-p-school-profile-card lx-p-school-profile-grades'>
                                <div className='lx-p-school-profile-section-heading'>
                                    <span className='lx-p-school-profile-icon' aria-hidden='true'>▦</span>
                                    <div>
                                        <span className='lx-p-school-profile-eyebrow'>ADMISIONES</span>
                                        <h2>Cupos y valores por grado</h2>
                                    </div>
                                </div>
                                {gradePeriods.length > 0 ? (
                                    <div className='lx-p-school-profile-table-scroll'>
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Grado</th>
                                                    <th>Cupos disponibles</th>
                                                    <th>Matrícula</th>
                                                    <th>Pensión mensual</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {gradePeriods.map((grade) => (
                                                    <tr key={grade.id || grade.grade}>
                                                        <td><strong>{grade.grade || grade.name}</strong>{grade.level && <small>{grade.level}</small>}</td>
                                                        <td>
                                                            {Number(grade.availableSeats ?? 0) > 0
                                                                ? <span className='lx-p-school-profile-seats'>{grade.availableSeats} cupos</span>
                                                                : <span className='lx-p-school-profile-full'>Sin cupos</span>}
                                                        </td>
                                                        <td>{formatCurrency(grade.enrollmentFee)}</td>
                                                        <td>{formatCurrency(grade.tuitionFee)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className='lx-p-school-profile-empty'>El colegio aún no ha publicado cupos ni valores por grado.</p>
                                )}
                            </article>
                        </div>

                        <aside className='lx-p-school-profile-sidebar'>
                            <article className='lx-p-school-profile-card lx-p-school-profile-enrollment-card'>
                                <span className='lx-p-school-profile-eyebrow'>PROCESO DE MATRÍCULA</span>
                                <h2>{enrollmentPeriod?.label || 'Matrículas abiertas'}</h2>
                                <span className='lx-p-school-profile-status'><i />{enrollmentPeriod?.status || 'Consulta disponibilidad'}</span>
                                {enrollmentPeriod?.closeDate && (
                                    <p>Inscripciones hasta el <strong>{enrollmentPeriod.closeDate}</strong></p>
                                )}
                                <div className='lx-p-school-profile-seat-summary'>
                                    <strong>{availablePlaces ?? '—'}</strong>
                                    <span>cupos disponibles</span>
                                </div>
                                <Link className='lx-p-school-profile-enroll lx-p-school-profile-enroll-full' to={`/enroll/${encodeURIComponent(school.code)}`}>
                                    Iniciar matrícula <span aria-hidden='true'>→</span>
                                </Link>
                            </article>

                            <article className='lx-p-school-profile-card lx-p-school-profile-documents'>
                                <div className='lx-p-school-profile-section-heading'>
                                    <span className='lx-p-school-profile-icon' aria-hidden='true'>▤</span>
                                    <div>
                                        <span className='lx-p-school-profile-eyebrow'>TEN TODO LISTO</span>
                                        <h2>Documentos requeridos</h2>
                                    </div>
                                </div>
                                {requiredDocuments.length > 0 ? (
                                    <ul>
                                        {requiredDocuments.map((document) => (
                                            <li key={typeof document === 'string' ? document : document.id || document.name}>
                                                <span aria-hidden='true'>✓</span>
                                                {typeof document === 'string' ? document : document.name}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className='lx-p-school-profile-empty'>El colegio aún no ha publicado los documentos requeridos.</p>
                                )}
                            </article>

                            <article className='lx-p-school-profile-card lx-p-school-profile-contact'>
                                <span className='lx-p-school-profile-eyebrow'>¿TIENES PREGUNTAS?</span>
                                <h2>Contacta al colegio</h2>
                                {school.phone && <a href={`tel:${school.phone}`}>{school.phone}</a>}
                                {school.email && <a href={`mailto:${school.email}`}>{school.email}</a>}
                                {!school.phone && !school.email && <p>Comunícate directamente con la institución para recibir más información.</p>}
                            </article>
                        </aside>
                    </section>
                </>
            )}

            <footer className='lx-p-school-profile-footer'>
                <Link to='/'><PlatformLogo /></Link>
                <span>© {new Date().getFullYear()} ViBoxSchool</span>
                <Link to='/'>Volver al directorio</Link>
            </footer>
        </main>
    )
}

export default SchoolProfilePage
