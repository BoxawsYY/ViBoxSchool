import { useState } from 'react'

export function useForm(initialValues = {}, initialErrors = {}) {
  const [form, setForm] = useState(initialValues)
  const [errors, setErrors] = useState(initialErrors)

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    })
    if(errors[name]) {
      const { [name]: removed, ...rest } = errors
      setErrors(rest)
    }
  }

  const resetForm = () => {
    setForm(initialValues)
    setErrors(initialErrors)
  }

  const clearForm = () => {
    setForm({})
    setErrors({})
  }

  return {
    form,
    errors,
    handleChange,
    resetForm,
    clearForm,
    setForm,
    setErrors
  }
}
