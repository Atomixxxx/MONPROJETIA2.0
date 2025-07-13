import React from 'react';

const TerminalPanel: React.FC = () => {
    return (
        <div className="terminal-panel">
            <h2>Terminal</h2>
            <textarea className="terminal-input" placeholder="Type your commands here..."></textarea>
            <div className="terminal-output">
                {/* Output will be displayed here */}
            </div>
        </div>
    );
};

export default TerminalPanel;