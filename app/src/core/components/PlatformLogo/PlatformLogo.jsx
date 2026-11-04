import './PlatformLogo.css'
import PropTypes from 'prop-types'

const PlatformLogo = ({ className = '' }) => (
    <span className={`lx-c-platform-logo ${className}`}>
        <svg
            className='lx-c-platform-logo-symbol'
            viewBox='0 0 64 64'
            role='img'
            aria-label='ViBoxSchool'
            fill='none'
        >
            <path className='lx-c-platform-logo-cube' d='M32 5 56 19v27L32 60 8 46V19L32 5Z' />
            <path className='lx-c-platform-logo-cube-side' d='m32 5 24 14-24 14L8 19 32 5Z' />
            <path className='lx-c-platform-logo-cube' d='M32 33v27M8 19v27m48-27v27' />
            <path className='lx-c-platform-logo-cap' d='m18 23 14-8 14 8-14 8-14-8Z' />
            <path className='lx-c-platform-logo-cap' d='M23 27v7c5.3 4.1 12.7 4.1 18 0v-7m5-4v8' />
            <path className='lx-c-platform-logo-book' d='M16 40c5.7-2 11.1-.9 16 3.2 4.9-4.1 10.3-5.2 16-3.2v9c-5.7-2-11.1-.9-16 3.2-4.9-4.1-10.3-5.2-16-3.2v-9Z' />
            <path className='lx-c-platform-logo-code' d='M50 25h5m-5 5h4m-4 5h5' />
            <circle className='lx-c-platform-logo-spark' cx='54' cy='17' r='2' />
            <circle className='lx-c-platform-logo-spark' cx='10' cy='48' r='2' />
        </svg>
        <span className='lx-c-platform-logo-name'>ViBoxSchool</span>
    </span>
)

PlatformLogo.propTypes = {
    className: PropTypes.string
}

export default PlatformLogo
