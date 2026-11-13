import { useRef } from 'react'
import PropTypes from 'prop-types'
import './Card3D.css'

const Card3D = ({ width = '300px', height = '200px', children }) => {
  const cardRef = useRef(null)
  const lightRef = useRef(null)

  const handleMouseMove = (event) => {
    const card = cardRef.current
    const light = lightRef.current
    const rect = card.getBoundingClientRect()

    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const rotateX = -(y - centerY) / 15
    const rotateY = (x - centerX) / 15

    card.style.transform = `scale(0.9) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
    light.style.setProperty('--lx-card-light-x', `${x}px`)
    light.style.setProperty('--lx-card-light-y', `${y}px`)
  }

  const handleMouseLeave = () => {
    const card = cardRef.current
    const light = lightRef.current

    card.style.transform = 'rotateX(0deg) rotateY(0deg)'
    light.style.setProperty('--lx-card-light-x', '50%')
    light.style.setProperty('--lx-card-light-y', '50%')
  }

  return (
    <div
      ref={cardRef}
      className='lx-c-card-3d'
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ maxWidth: width, maxHeight: height }}
    >
      <div
        ref={lightRef}
        className='lx-c-card-3d-light'
      ></div>
      <div className='lx-c-card-3d-content'>
        {children}
      </div>
    </div>
  )
}

Card3D.propTypes = {
  width: PropTypes.string,
  height: PropTypes.string,
  children: PropTypes.node
}

export default Card3D
