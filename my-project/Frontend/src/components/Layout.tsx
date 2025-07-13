import React from 'react';

const Layout: React.FC = ({ children }) => {
    return (
        <div className="layout">
            <header className="header">
                <h1>My Project</h1>
            </header>
            <main className="main-content">
                {children}
            </main>
            <footer className="footer">
                <p>© 2023 My Project. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default Layout;