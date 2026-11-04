import './Context3D.css'

const Context3D = ({ children, width, height }) => {
  return (
    <div className='lx-c-context-3d' style={{ maxWidth: width, maxHeight: height }}>
      {children}
    </div>
  )
}

export default Context3D