import { useState, useMemo, useRef, useEffect } from 'react'
import './SearchableDropdown.css'

const SearchableDropdown = ({
  options = [],
  initial,
  whenSelect = () => {},
  mapper = (item) => item.name || JSON.stringify(item),
  placeholder = 'Selecciona una opción',
}) => {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState(initial || null)
  const dropdownRef = useRef(null)

  const filteredOptions = useMemo(() => {
    const lowerSearch = search.toLowerCase()
    return options.filter((option) =>
      Object.values(option).some((val) =>
        String(val).toLowerCase().includes(lowerSearch)
      )
    )
  }, [search, options])

  const handleSelect = (item) => {
    setSelected(item)
    whenSelect(item)
    setIsOpen(false)
    setSearch('')
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className='dropdown-container' ref={dropdownRef}>
      <div className='dropdown-display' onClick={() => setIsOpen((prev) => !prev)}>
        {selected ? mapper(selected) : placeholder}
      </div>
      {isOpen && (
        <div className='dropdown-menu'>
          <input
            type='text'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='dropdown-search'
            placeholder='Buscar...'
          />
          <div className='dropdown-options'>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((item, index) => (
                <div
                  key={index}
                  onClick={() => handleSelect(item)}
                  className='dropdown-option'
                >
                  {mapper(item)}
                </div>
              ))
            ) : (
              <div className='dropdown-no-results'>Sin resultados</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchableDropdown
