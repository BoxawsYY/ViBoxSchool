import './Modal.css'
import { useEffect, useState } from 'react'
import Button from '../Button/Button'
import Loader from '../Loader/Loader'

const Modal = ({ show, title, position = 'center', size = 'middle', children, onClose }) => {
  const [active, setActive] = useState(show)

  useEffect(() => {
    let timeout
    if (show) {
      setActive(true)
    } else {
      timeout = setTimeout(() => setActive(false), 500)
    }
    return () => clearTimeout(timeout)
  }, [show])


  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.()
      }
    }
    if (show) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [show])

  const handleBackdropClick = (event) => {
    if (event.target.classList.contains('lx-c-modal')) {
      onClose?.()
    }
  }

  if (!active) return null

  return (
    <div
      className={`lx-c-modal ${position} ${size} ${show ? '--active' : '--inactive'}`}
      onClick={handleBackdropClick}
    >
      <div className='lx-c-modal-container'>
        <Loader loading={!show} animated={false} />
        <div className='lx-c-modal-header'>
          <h3>{title}</h3>
          <Button size='xs' color='auto' variant='plain' icon onClick={onClose}>
            <span className='material-symbols-rounded' translate='no'>close</span>
          </Button>
        </div>
        <div className='lx-c-modal-content'>
          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal