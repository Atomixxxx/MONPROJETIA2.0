import React from 'react';

const KeyboardShortcuts: React.FC = () => {
    const shortcuts = [
        { key: 'Ctrl + S', action: 'Save' },
        { key: 'Ctrl + Z', action: 'Undo' },
        { key: 'Ctrl + Y', action: 'Redo' },
        { key: 'Ctrl + C', action: 'Copy' },
        { key: 'Ctrl + V', action: 'Paste' },
        { key: 'Ctrl + X', action: 'Cut' },
        { key: 'Ctrl + F', action: 'Find' },
        { key: 'Ctrl + P', action: 'Print' },
        { key: 'Ctrl + N', action: 'New File' },
        { key: 'Ctrl + O', action: 'Open File' },
    ];

    return (
        <div className="keyboard-shortcuts">
            <h2>Keyboard Shortcuts</h2>
            <ul>
                {shortcuts.map((shortcut, index) => (
                    <li key={index}>
                        <strong>{shortcut.key}</strong>: {shortcut.action}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default KeyboardShortcuts;