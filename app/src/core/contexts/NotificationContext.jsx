import { createContext, useContext, useState } from 'react'
import Notifications from '../components/Notifications/Notifications'
import Notification from '../components/Notification/Notification'

const NotificationContext = createContext()

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([])

    const notice = (message, type = 'info', duration = 3000) => {
        const id = Date.now() + Math.random()
        const newNotification = { id, message, type: type, duration: duration }

        setNotifications(prev => [...prev, newNotification])

        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id))
        }, duration)
    }

    return (
        <NotificationContext.Provider value={{ notice }}>
            <Notifications>
                {notifications.map(n => (
                    <Notification key={n.id} {...n} />
                ))}
            </Notifications>
            {children}
        </NotificationContext.Provider>
    )
}

export const useNotification = () => useContext(NotificationContext)