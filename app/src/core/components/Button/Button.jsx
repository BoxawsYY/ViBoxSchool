
import './Button.css'
import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'

const Button = ({
  color = 'accent',
  variant = 'solid',
  size = 'm',
  radius,
  disabled = false,
  loading = false,
  width = 'fit',
  icon = false,
  children,
  onClick,
}) => {
  const [button, setButton] = useState({
    color,
    variant,
    size,
    radius,
    disabled,
    loading,
    width,
    icon,
  })

  useEffect(() => {
    setButton({
      color,
      variant,
      size,
      radius: radius || { xxxs: 'none', xxs: 'xxxs', xs: 'xxs', s: 'xs', m: 's', l: 'm', xl: 'l', xxl: 'xl', xxxl: 'full' }[size] || 'full',
      disabled,
      loading,
      width,
      icon,
    })
  }, [color, variant, size, radius, disabled, loading, width, icon])

  const setLoading = (value) => {
    setButton((prevButton) => ({
      ...prevButton,
      loading: value,
    }))
  }

  const className = [
    'lx-c-button',
    `lx-c-button-${button.color}`,
    `lx-c-button-${button.variant}`,
    `lx-c-button-size-${button.size}`,
    `lx-c-button-radius-${button.radius}`,
    `lx-c-button-width-${button.width}`,
    button.icon && 'lx-c-button-icon',
    button.disabled && 'lx-c-button-status-disabled',
    button.loading && 'lx-c-button-status-loading',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      className={className}
      onClick={async (event) => {
        event.stopPropagation()
        event.preventDefault()
        if (typeof onClick === 'function') {
          setLoading(true)
          try {
            await onClick(event)
          }
          catch(error) {
            console.log(error)
          }
          setLoading(false)
        }
      }}
      disabled={button.disabled || button.loading}
    >
      {button.loading && <div className='lx-c-button-loader'>
        <span className='lx-c-button-loader-spinner' />
      </div>}
      <div className="lx-c-button-content">{children}</div>
    </button>
  )
}

Button.propTypes = {
  color: PropTypes.oneOf([
    'accent',
    'auto',
    'black',
    'white',
    'gray',
    'success',
    'warning',
    'danger',
  ]),
  variant: PropTypes.oneOf(['solid', 'bordered', 'plain', 'dimed', 'stroke', 'ghost']),
  size: PropTypes.oneOf(['xxxs', 'xxs', 'xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl']),
  radius: PropTypes.oneOf([
    'xxxs',
    'xxs',
    'xs',
    's',
    'm',
    'l',
    'xl',
    'xxl',
    'xxxl',
    'auto',
    'full',
    'circle',
    'none',
  ]),
  width: PropTypes.oneOf(['full', 'fit']),
  icon: PropTypes.bool,
  children: PropTypes.node,
  onClick: PropTypes.func,
}

export default Button
