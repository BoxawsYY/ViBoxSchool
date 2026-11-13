import './DevelopmentPage.css'
import PropTypes from 'prop-types'

const DevelopmentPage = ({ title }) => (
    <section className='lx-p-development' aria-labelledby='lx-p-development-title'>
        <span className='material-symbols-rounded' aria-hidden='true'>construction</span>
        <p>MÓDULO EN DESARROLLO</p>
        <h1 id='lx-p-development-title'>{title}</h1>
        <p>Estamos trabajando en esta sección. Próximamente estará disponible.</p>
    </section>
)

DevelopmentPage.propTypes = {
    title: PropTypes.string.isRequired
}

export default DevelopmentPage
