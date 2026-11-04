import { useLocation, useNavigate } from 'react-router-dom'

export const useQueryParams = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const getParams = () => new URLSearchParams(location.search)

  const setParam = (key, value, options = {}) => {
    const params = getParams()
    params.set(key, value)
    navigate(`${location.pathname}?${params.toString()}`, {
      replace: options.replace || true,
    })
  }

  const deleteParam = (key, options = {}) => {
    const params = getParams()
    params.delete(key)
    const query = params.toString()
    const newPath = query ? `${location.pathname}?${query}` : location.pathname
    navigate(newPath, {
      replace: options.replace || true,
    })
  }

  const getParam = (key) => {
    return getParams().get(key)
  }

  const getAll = () => {
    const entries = {}
    for (const [key, value] of getParams().entries()) {
      entries[key] = value
    }
    return entries
  }

  return { setParam, deleteParam, getParam, getAll }
}
