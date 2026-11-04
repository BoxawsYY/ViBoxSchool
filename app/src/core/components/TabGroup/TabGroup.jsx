import './TabGroup.css'
import { useState } from 'react'

const TabGroup = ({ tabs, options = [], onClick, activeIndex: controlledIndex }) => {
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
    <div className='lx-c-tab-group'>
      {tabs.map((label, index) => (
        <div
          key={index}
          className={`lx-c-tab-group-tab ${
            index === currentIndex ? 'active' : 'inactive'
          }`}
          onClick={() => handleClick(index)}
        >
          {label}
        </div>
      ))}
    </div>
  )
}

export default TabGroup
