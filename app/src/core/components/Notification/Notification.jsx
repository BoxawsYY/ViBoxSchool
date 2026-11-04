import { useEffect, useState } from 'react'
import './Notification.css'

const Notification = ({ message = '', type = 'info', duration = 3000 }) => {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const showTimeout = setTimeout(() => setVisible(true), 10)
        const hideTimeout = setTimeout(() => setVisible(false), duration - 200)

        return () => {
            clearTimeout(showTimeout)
            clearTimeout(hideTimeout)
        }
    }, [])

    return (
        <div
            className={`lx-c-notification ${visible ? '--show' : '--hide'
                }`}
        >
            <span className={`lx-c-notification-indicator --${type}`} />
            {message}
        </div>
    )
}

export default Notification