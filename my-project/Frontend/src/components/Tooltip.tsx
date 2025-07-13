import React from 'react';

interface TooltipProps {
    text: string;
    children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
    return (
        <div className="relative inline-block">
            {children}
            <div className="absolute z-10 hidden bg-gray-700 text-white text-xs rounded py-1 px-2 group-hover:block">
                {text}
            </div>
        </div>
    );
};

export default Tooltip;