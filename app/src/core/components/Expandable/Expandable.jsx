import './Expandable.css'
import { useEffect, useRef, useState } from 'react'

const Expandable = ({
  summary,
  children,
  defaultOpen = false,
  autoOpenOnChildrenChange = false,
  className = ''
}) => {
  const [open, setOpen] = useState(defaultOpen)
  const idRef = useRef(`lx-expandable-${Math.random().toString(36).slice(2, 9)}`)

  useEffect(() => {
    if (!autoOpenOnChildrenChange) return

    const hasChildren = !!(
      children &&
      String(children).trim().length > 0
    )

    if (hasChildren && !open) setOpen(true)
  }, [children, autoOpenOnChildrenChange, open])

  return (
    <div className={`lx-c-expandable ${className}`}>
      <button
        type='button'
        aria-expanded={open}
        aria-controls={idRef.current}
        onClick={() => setOpen(v => !v)}
        className='lx-c-expandable-header'
      >
        <h2 className='lx-c-expandable-summary'>{summary}</h2>
        <svg
          className={`lx-c-expandable-icon ${open ? 'open' : ''}`}
          viewBox='0 0 20 20'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
          aria-hidden
        >
          <path d='M5 8.5L10 13.5L15 8.5' stroke='currentColor' strokeWidth='1.6' strokeLinecap='round' strokeLinejoin='round' />
        </svg>
      </button>

      {open && (
        <div
          id={idRef.current}
          className='lx-c-expandable-content'
        >
          <div className='lx-c-expandable-body'>{children}</div>
        </div>
      )}
    </div>
  )
}

export default Expandable
