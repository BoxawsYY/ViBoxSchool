import './InputSearch.css'
import { filterRenderedElements } from '../../utils/novato.mjs'
import { $ } from '../../utils/selectors.mjs'

const InputSearch = ({ placeholder = 'Buscar', context, element }) => {
  return (
    <div className='lx-c-table-search-content'>
        <span className='material-symbols-rounded'>search</span>
        <input
            type='search'
            placeholder={placeholder}
            onChange={(event) => filterRenderedElements(event.target.value, $(context), element)}
            className='lx-c-table-search'
        />
    </div>
  )
}

export default InputSearch