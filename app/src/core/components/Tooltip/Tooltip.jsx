import './Tooltip.css'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

const Tooltip = ({ children, content, position = 'bottom' }) => {
  const [visible, setVisible] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const ref = useRef(null)

  useEffect(() => {
    if (visible && ref.current) {
      const rect = ref.current.getBoundingClientRect()
      setCoords({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height
      })
    }
  }, [visible])

  return (
    <div
      ref={ref}
      className='lx-c-tooltip'
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}

      {visible &&
        createPortal(
          <div
            className={`lx-c-tooltip-box lx-c-tooltip-${position}`}
            style={{
              position: 'absolute',
              top:
                position === 'bottom'
                  ? coords.top + coords.height + 8
                  : coords.top - 30,
              left: coords.left + coords.width / 2
            }}
          >
            {content}
          </div>,
          document.body
        )}
    </div>
  )
}

export default Tooltip