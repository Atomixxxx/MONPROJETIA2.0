import React from 'react';

const NotificationSystem: React.FC = () => {
    const [notifications, setNotifications] = React.useState<string[]>([]);

    const addNotification = (message: string) => {
        setNotifications((prev) => [...prev, message]);
    };

    const removeNotification = (index: number) => {
        setNotifications((prev) => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="notification-system">
            {notifications.map((notification, index) => (
                <div key={index} className="notification">
                    <span>{notification}</span>
                    <button onClick={() => removeNotification(index)}>Dismiss</button>
                </div>
            ))}
        </div>
    );
};

export default NotificationSystem;