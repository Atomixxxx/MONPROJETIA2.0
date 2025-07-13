import React from 'react';

const ConnectionStatus: React.FC = () => {
    const [isConnected, setIsConnected] = React.useState<boolean>(false);

    React.useEffect(() => {
        const handleConnectionChange = (status: boolean) => {
            setIsConnected(status);
        };

        // Simulate connection status change
        const interval = setInterval(() => {
            handleConnectionChange(prev => !prev);
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div>
            <h2>Connection Status</h2>
            <p>{isConnected ? 'Connected' : 'Disconnected'}</p>
        </div>
    );
};

export default ConnectionStatus;