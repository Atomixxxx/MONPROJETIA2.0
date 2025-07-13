import { useEffect, useRef } from 'react';

const useWebSocket = (url) => {
    const socketRef = useRef(null);

    useEffect(() => {
        socketRef.current = new WebSocket(url);

        socketRef.current.onopen = () => {
            console.log('WebSocket connection established');
        };

        socketRef.current.onmessage = (event) => {
            console.log('Message received:', event.data);
        };

        socketRef.current.onclose = () => {
            console.log('WebSocket connection closed');
        };

        return () => {
            socketRef.current.close();
        };
    }, [url]);

    const sendMessage = (message) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(message);
        } else {
            console.error('WebSocket is not open. Unable to send message.');
        }
    };

    return { sendMessage };
};

export default useWebSocket;