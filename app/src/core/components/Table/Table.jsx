import { useState, useMemo } from 'react'
import './Table.css'
import Button from '../Button/Button'
import Icon from '../Icon/Icon'

function Table({
    id = 'Table',
    objects,
    mapper = (object) => object,
    attributes = [],
    include = false,
    translation = {},
    searchable = true,
    selectionable = true,
    criteria = [],
    filters = [],
    sort = [],
    actions,
    conditioners,
    onClick = (object) => { },
    whenDropdown,
    bulkActions = (selectedObjects, unselec) => [],
    empity = 'No hay datos disponibles'
}) {
    const [search, setSearch] = useState('')
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
    const [editingId, setEditingId] = useState(null)
    const [selectedItems, setSelectedItems] = useState([])
    const [filterAttr, setFilterAttr] = useState('')
    const [activeFilters, setActiveFilters] = useState({})

    let maps = objects.map(mapper)

    const data = useMemo(() => {
        if (!maps || maps.length === 0) maps = objects
        if (attributes.length > 0) {
            return maps.map((dataObject) => {
                const filtered = {}
                for (const key of Object.keys(dataObject)) {
                    if (attributes.includes(key) === include) {
                        filtered[key] = dataObject[key]
                    }
                }
                return filtered
            })
        }
        return maps
    }, [maps, attributes, include])

    const headers = useMemo(() => (data.length > 0 ? Object.keys(data[0]) : []), [data])

    const uniqueFilterValues = useMemo(() => {
        const result = {}
        filters.forEach(attr => {
            result[attr] = [...new Set(objects.map(item => item[attr]).filter(Boolean))]
        })
        return result
    }, [objects, filters])

    const filteredData = useMemo(() => {
        let result = maps.map((_, index) => ({ object: objects[index], row: data[index] }))

        for (const [key, value] of Object.entries(activeFilters)) {
            if (value) {
                result = result.filter(({ object }) => object[key] === value)
            }
        }

        const searchLower = search.toLowerCase()

        result = result.filter(({ object }) => {
            if (filterAttr) {
                const value = object[filterAttr]
                return value?.toString().toLowerCase().includes(searchLower)
            }

            return headers.some((header) => {
                const val = object[header]
                return val?.toString().toLowerCase().includes(searchLower)
            })
        })

        return result
    }, [data, headers, search, filterAttr, activeFilters, maps, objects])

    const sortedData = useMemo(() => {
        const sorted = [...filteredData]

        if (!sortConfig.key) return sorted
        const { key, direction } = sortConfig

        sorted.sort((a, b) => {
            const valA = a.object[key]
            const valB = b.object[key]

            if (!isNaN(valA) && !isNaN(valB)) {
                return direction === "asc" ? valA - valB : valB - valA
            }

            const strA = valA?.toString().toLowerCase() || ""
            const strB = valB?.toString().toLowerCase() || ""

            if (strA < strB) return direction === "asc" ? -1 : 1
            if (strA > strB) return direction === "asc" ? 1 : -1
            return 0
        })

        return sorted
    }, [filteredData, sortConfig])

    const handleSort = (key) => {
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }))
    }

    const toggleItem = (id) => {
        setSelectedItems((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        )
    }

    const toggleAll = () => {
        const allIds = sortedData.map(({ object }) => object.id)
        if (selectedItems.length === allIds.length) {
            setSelectedItems([])
        } else {
            setSelectedItems(allIds)
        }
    }

    const handleEditClick = (object) => {
        setEditingId((prev) => (prev === object.id ? null : object.id))
    }

    if (data.length === 0) {
        return empity
    }

    return (
        <div className='lx-c-table-container'>
            <div className='lx-c-table-search-container'>

                {searchable && <div className='lx-c-table-search-content'>
                    <span className='material-symbols-rounded'>search</span>
                    <input
                        type='search'
                        placeholder='Buscar'
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        className='lx-c-table-search'
                    />

                    {criteria.length > 0 && (
                        <select
                            value={filterAttr}
                            onChange={(event) => setFilterAttr(event.target.value)}
                            className='lx-c-table-filter-select'
                        >
                            <option value=''>Todos</option>
                            {criteria.map((attr) => (
                                <option key={attr} value={attr}>
                                    {translation[attr] || attr}
                                </option>
                            ))}
                        </select>
                    )}

                </div>}

                {filters.length > 0 && (
                    <div className='lx-c-table-filters'>
                        {filters.map((filterAttrName) => (
                            <div key={filterAttrName} className='lx-c-table-filter-dropdown'>
                                <label><Icon name='filter_arrow_right' size='m' />{translation[filterAttrName] || filterAttrName}</label>
                                <select
                                    value={activeFilters[filterAttrName] || ''}
                                    onChange={(event) => {
                                        const value = event.target.value
                                        setActiveFilters(prev => ({
                                            ...prev,
                                            [filterAttrName]: value || undefined,
                                        }))
                                    }}
                                >
                                    <option value=''>Todos</option>
                                    {uniqueFilterValues[filterAttrName].map((optionValue) => (
                                        <option key={optionValue} value={optionValue}>
                                            {optionValue}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>
                )}

                {conditioners && <div className='lx-c-table-conditioners'>
                    {conditioners}
                </div>}

            </div>

            {selectedItems.length > 0 && (
                <div className='lx-c-table-selection'>
                    <div className='lx-c-table-selection-indicator'>
                        (<strong>{selectedItems.length}</strong>) seleccionados
                    </div>
                    <div className='lx-c-table-selection-actions'>
                        {bulkActions(objects.filter(p => selectedItems.includes(p.id)), () => setSelectedItems([])).map((action, index) => (
                            <span key={index} className='lx-c-table-selection-action'>
                                {action}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div className='lx-c-table-content'>
                <table id={id} className='lx-c-table'>
                    <thead>
                        <tr>
                            {selectionable && <th>
                                <input
                                    type='checkbox'
                                    onChange={toggleAll}
                                    checked={selectedItems.length === sortedData.length && sortedData.length > 0}
                                />
                            </th>}
                            {headers.map((header) => (
                                <th
                                    key={header}
                                    onClick={() => sort.includes(header) && handleSort(header)}
                                    style={{ cursor: sort.includes(header) ? 'pointer' : 'default', color: sortConfig.key === header ? 'var(--lx-color-accent)' : '' }}
                                >
                                    {translation[header] || header}{' '}
                                    {sortConfig.key === header ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                                </th>
                            ))}
                            {(actions || whenDropdown) && <th></th>}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.length > 0 ? (
                            sortedData.map(({ object, row }, index) => {
                                const isChecked = selectedItems.includes(object.id)

                                return (
                                    <React.Fragment key={`${id}_${object.id}`}>
                                        <tr className={`lx-c-table-row ${isChecked ? 'selected' : ''}`}
                                            style={{ '--lx-c-table-row-index': index }}
                                            id={`${id}_${object.id}`}
                                            onClick={() => onClick(object)}
                                        >
                                            {selectionable && <td>
                                                <input
                                                    className='lx-c-table-cell-selector'
                                                    type='checkbox'
                                                    checked={isChecked}
                                                    onClick={(event) => event.stopPropagation()}
                                                    onChange={() => toggleItem(object.id)}
                                                />
                                            </td>}
                                            {headers.map((header) => (
                                                <td key={header}>{row[header] ?? ''}</td>
                                            ))}
                                            {(actions || whenDropdown) && <td>
                                                <span className='lx-c-table-cell-actions'>
                                                    {whenDropdown && <Button
                                                        size='xs'
                                                        variant='bordered'
                                                        radius='full'
                                                        onClick={(event) => {
                                                            event.stopPropagation()
                                                            handleEditClick(object)
                                                        }}
                                                    >
                                                        <span className='material-symbols-rounded' translate='no'>
                                                            {editingId === object.id ? 'arrow_drop_up' : 'arrow_drop_down'}
                                                        </span>
                                                    </Button>}
                                                    {typeof actions === 'function' && actions(object)}
                                                </span>
                                            </td>}
                                        </tr>
                                        {editingId === object.id && (
                                            <tr className='lx-c-table-edit-row'>
                                                <td colSpan={headers.length + 2}>
                                                    {typeof whenDropdown === 'function' && whenDropdown(object, () => setEditingId(null))}
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                )
                            })
                        ) : (
                            <tr>
                                <td colSpan={headers.length + 2} className='lx-c-table-empty'>
                                    Sin resultados
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {(searchable || selectionable) && <p className='lx-c-table-total'>
                <strong>Total:</strong> {sortedData.length}
            </p>}
        </div>
    )
}

export default Table
