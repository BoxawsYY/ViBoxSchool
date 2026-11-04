import './DetailItem.css'

const DetailItem = ({ icon, title = 'Detalle', content = 'Sin detalle' }) => (
  <div className='lx-c-detail-item'>
    <div className='lx-c-detail-item-header'>
        {icon && <span className='material-symbols-rounded' translate='no'>{icon}</span>}
        {title}
    </div>
    <div className='lx-c-detail-item-body'>
        {content}
    </div>
  </div>
)

export default DetailItem