import React from 'react';

const ChatPanel: React.FC = () => {
    return (
        <div className="chat-panel">
            <h2>Chat Panel</h2>
            <div className="messages">
                {/* Messages will be displayed here */}
            </div>
            <input type="text" placeholder="Type your message..." />
            <button>Send</button>
        </div>
    );
};

export default ChatPanel;