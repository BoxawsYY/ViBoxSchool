import './ButtonGroup.css'
import { useState } from 'react'

const ButtonGroup = ({ buttons, options = [], onClick, activeIndex: controlledIndex }) => {
  const [internalIndex, setInternalIndex] = useState(0)

  const isControlled = controlledIndex !== undefined
  const currentIndex = isControlled ? controlledIndex : internalIndex

  const handleClick = (index) => {
    if (!isControlled) {
      setInternalIndex(index)
    }
    if (onClick) {
      onClick(options[index], index)
    }
  }

  return (
    <div className='lx-c-button-group'>
      {buttons.map((label, index) => (
        <button
          key={index}
          className={`lx-c-button-group-button ${
            index === currentIndex ? 'active' : ''
          }`}
          onClick={() => handleClick(index)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export default ButtonGroup
