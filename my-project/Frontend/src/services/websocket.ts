import { WebSocket } from 'ws';

class WebSocketService {
    private socket: WebSocket | null = null;

    connect(url: string): void {
        this.socket = new WebSocket(url);

        this.socket.onopen = () => {
            console.log('WebSocket connection established');
        };

        this.socket.onmessage = (event) => {
            console.log('Message received:', event.data);
        };

        this.socket.onclose = () => {
            console.log('WebSocket connection closed');
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    sendMessage(message: string): void {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(message);
        } else {
            console.error('WebSocket is not open. Unable to send message.');
        }
    }

    disconnect(): void {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }
}

export default new WebSocketService();