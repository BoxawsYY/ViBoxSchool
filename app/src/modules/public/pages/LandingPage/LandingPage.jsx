import './LandingPage.css'
import { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import PlatformLogo from '../../../../core/components/PlatformLogo/PlatformLogo'
import ThemeToggle from '../../../../core/components/ThemeToggle/ThemeToggle'
import SchoolRequester from '../../services/SchoolRequester.mjs'

const FREQUENT_CITIES = ['Santa Marta', 'Barranquilla', 'Cartagena', 'Bogotá']

const STEPS = [
    {
        number: '1',
        title: 'Elige tu colegio',
        description: 'Busca en el directorio y entra al perfil de la institución.'
    },
    {
        number: '2',
        title: 'Descarga los requisitos',
        description: 'Cada colegio publica su propia ficha de requisitos en PDF.'
    },
    {
        number: '3',
        title: 'Matricula sin registrarte',
        description: 'Completa el formulario y recibe tus credenciales al finalizar.'
    }
]

const matchesSearch = (school, query) => {
    if (!query) return true

    const searchable = `${school.name} ${school.city} ${school.department || ''}`.toLocaleLowerCase('es')
    return searchable.includes(query)
}

const SchoolMonogram = ({ school, className = '' }) => (
    <span
        className={`lx-p-public-school-monogram ${className}`}
        style={{ '--school-brand-color': school.brandColor || 'var(--lx-color-accent)' }}
        aria-label={`Iniciales de ${school.name}`}
    >
        {school.initials || school.name?.trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toLocaleUpperCase('es') || 'C'}
    </span>
)

SchoolMonogram.propTypes = {
    school: PropTypes.shape({
        brandColor: PropTypes.string,
        initials: PropTypes.string,
        name: PropTypes.string
    }).isRequired,
    className: PropTypes.string
}

const LandingPage = () => {
    const [schools, setSchools] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState('')
    const [search, setSearch] = useState('')

    useEffect(() => {
        let isMounted = true

        SchoolRequester.discover()
            .then((schools) => {
                if (!isMounted) return
                if (!Array.isArray(schools)) throw new Error('La respuesta del directorio no es válida')
                setSchools(schools)
            })
            .catch((error) => {
                if (isMounted) setLoadError(error.message)
            })
            .finally(() => {
                if (isMounted) setLoading(false)
            })

        return () => {
            isMounted = false
        }
    }, [])

    const normalizedSearch = search.trim().toLocaleLowerCase('es')
    const featuredSchools = useMemo(
        () => schools.filter((school) => school.isPartner !== false),
        [schools]
    )
    const visibleFeaturedSchools = useMemo(
        () => featuredSchools.filter((school) => matchesSearch(school, normalizedSearch)),
        [featuredSchools, normalizedSearch]
    )
    const visibleDirectorySchools = useMemo(
        () => schools.filter((school) => matchesSearch(school, normalizedSearch)),
        [schools, normalizedSearch]
    )

    const searchDirectory = (event) => {
        event.preventDefault()
        document.getElementById('colegios')?.scrollIntoView({ behavior: 'smooth' })
    }

    const showAllSchools = () => {
        setSearch('')
        document.getElementById('directorio')?.scrollIntoView({ behavior: 'smooth' })
    }

    return (
        <main className='lx-p-public'>
            <header className='lx-p-public-header'>
                <Link className='lx-p-public-brand' to='/' aria-label='ViBoxSchool home'>
                    <PlatformLogo />
                </Link>

                <div className='lx-p-public-header-actions'>
                    <nav className='lx-p-public-nav' aria-label='Navegación principal'>
                        <a href='#colegios'>Colegios</a>
                        <a href='#como-funciona'>Cómo funciona</a>
                        <a href='mailto:help@viboxschool.com'>Ayuda</a>
                    </nav>
                    <ThemeToggle />
                </div>

                <Link className='lx-p-public-login' to='/auth'>Ingresar</Link>
            </header>

            <section className='lx-p-public-hero' aria-labelledby='lx-p-public-title'>
                <div className='lx-p-public-hero-content'>
                    <span className='lx-p-public-hero-eyebrow'>Plataforma multi-colegio</span>
                    <h1 id='lx-p-public-title'>Encuentra tu colegio y matricula en<br className='lx-p-public-title-break' /> línea, sin crear cuenta</h1>
                    <p>Consulta requisitos, cupos y valores de cada institución y realiza la matrícula de tu<br className='lx-p-public-subtitle-break' /> hijo en minutos.</p>

                    <form className='lx-p-public-search' onSubmit={searchDirectory} role='search'>
                        <svg className='lx-p-public-search-icon' viewBox='0 0 24 24' fill='none' aria-hidden='true'>
                            <circle cx='10.8' cy='10.8' r='6.8' />
                            <path d='m16 16 4.5 4.5' />
                        </svg>
                        <label className='lx-p-public-visually-hidden' htmlFor='school-search'>Busca por nombre del colegio o ciudad</label>
                        <input
                            id='school-search'
                            type='search'
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder='Busca por nombre del colegio o ciudad...'
                        />
                        <button type='submit'>Buscar colegio</button>
                    </form>

                    <div className='lx-p-public-frequent-cities'>
                        <span>Ciudades frecuentes:</span>
                        {FREQUENT_CITIES.map((city) => (
                            <button
                                className={search.toLocaleLowerCase('es') === city.toLocaleLowerCase('es') ? 'is-selected' : ''}
                                key={city}
                                type='button'
                                onClick={() => setSearch(city)}
                            >
                                {city}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            <div className='lx-p-public-catalog'>
                <section className='lx-p-public-section lx-p-public-featured' id='colegios'>
                    <div className='lx-p-public-section-heading'>
                        <div>
                            <h2>Colegios aliados</h2>
                            <p>Instituciones destacadas con matrícula abierta</p>
                        </div>
                        <button className='lx-p-public-text-link' type='button' onClick={showAllSchools}>Ver todos</button>
                    </div>

                    <div className='lx-p-public-featured-grid'>
                        {loading && <p className='lx-p-public-empty' role='status'>Cargando colegios aliados...</p>}
                        {!loading && loadError && <p className='lx-p-public-empty' role='alert'>{loadError}</p>}
                        {visibleFeaturedSchools.map((school) => (
                            <article className='lx-p-public-featured-card' key={school.code}>
                                <div
                                    className='lx-p-public-featured-banner'
                                    style={{ '--school-brand-color': school.brandColor || 'var(--lx-color-accent)' }}
                                >
                                    <SchoolMonogram school={school} />
                                </div>
                                <div className='lx-p-public-featured-content'>
                                    <div className='lx-p-public-featured-title'>
                                        <h3>{school.name}</h3>
                                        <span className='lx-p-public-partner-badge'>Aliado</span>
                                    </div>
                                    <p className='lx-p-public-school-location'>
                                        <svg viewBox='0 0 24 24' fill='none' aria-hidden='true'>
                                            <path d='M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z' />
                                            <circle cx='12' cy='10' r='2.2' />
                                        </svg>
                                        {school.city}{school.levelsOffered ? ` · ${school.levelsOffered}` : ''}
                                    </p>
                                    <div className='lx-p-public-school-availability'>
                                        <span className={school.enrollmentOpen ? 'lx-p-public-open-badge' : 'lx-p-public-closed-badge'}>
                                            {school.enrollmentOpen ? 'Matrículas abiertas' : 'Matrículas cerradas'}
                                        </span>
                                        {school.availablePlaces != null && <span>{school.availablePlaces} cupos</span>}
                                    </div>
                                    <Link className='lx-p-public-school-action' to={`/school/${encodeURIComponent(school.code)}`}>
                                        Ver colegio
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>
                    {!loading && !loadError && visibleFeaturedSchools.length === 0 && (
                        <p className='lx-p-public-empty'>No encontramos colegios aliados para “{search}”.</p>
                    )}
                </section>

                <section className='lx-p-public-section lx-p-public-directory' id='directorio'>
                    <div className='lx-p-public-section-heading'>
                        <div>
                            <h2>Directorio de colegios</h2>
                            <p>Explora todas las instituciones registradas en la plataforma</p>
                        </div>
                        <button className='lx-p-public-text-link' type='button' onClick={showAllSchools}>Ver todos</button>
                    </div>

                    <div className='lx-p-public-directory-grid'>
                        {loading && <p className='lx-p-public-empty' role='status'>Cargando directorio...</p>}
                        {!loading && loadError && <p className='lx-p-public-empty' role='alert'>{loadError}</p>}
                        {visibleDirectorySchools.map((school) => (
                            <Link
                                className='lx-p-public-directory-card'
                                key={school.code}
                                to={`/school/${encodeURIComponent(school.code)}`}
                            >
                                <SchoolMonogram school={school} className='lx-p-public-directory-monogram' />
                                <span className='lx-p-public-directory-info'>
                                    <strong>{school.name}</strong>
                                    <span>{school.city}</span>
                                    <span className='lx-p-public-directory-places'>{school.availablePlaces} cupos disponibles</span>
                                </span>
                            </Link>
                        ))}
                    </div>
                    {!loading && !loadError && visibleDirectorySchools.length === 0 && (
                        <p className='lx-p-public-empty'>No encontramos colegios para “{search}”.</p>
                    )}
                </section>
            </div>

            <section className='lx-p-public-how' id='como-funciona'>
                <div className='lx-p-public-section lx-p-public-how-inner'>
                    <h2>¿Cómo funciona?</h2>
                    <div className='lx-p-public-steps'>
                        {STEPS.map((step) => (
                            <article className='lx-p-public-step' key={step.number}>
                                <span className='lx-p-public-step-number'>{step.number}</span>
                                <h3>{step.title}</h3>
                                <p>{step.description}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <footer className='lx-p-public-footer' id='ayuda'>
                <Link className='lx-p-public-brand lx-p-public-footer-brand' to='/' aria-label='ViBoxSchool home'>
                    <PlatformLogo />
                </Link>
                <p>© {new Date().getFullYear()} ViBoxSchool · Plataforma multi-colegio de matrículas y pensiones</p>
                <nav aria-label='Enlaces del pie de página'>
                    <a href='#politicas'>Políticas</a>
                    <span>·</span>
                    <a href='mailto:help@viboxschool.com'>Ayuda</a>
                    <span>·</span>
                    <a href='mailto:contact@viboxschool.com'>Contacto</a>
                </nav>
                <span className='lx-p-public-visually-hidden' id='politicas'>Consulta nuestras políticas de privacidad y uso.</span>
            </footer>
        </main>
    )
}

export default LandingPage
