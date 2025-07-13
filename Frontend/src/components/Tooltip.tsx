import React, { useState } from 'react';

// Définit les propriétés que notre composant Tooltip peut recevoir
interface TooltipProps {
  children: React.ReactNode; // L'élément à survoler (par exemple un bouton)
  content: string;           // Le texte à afficher dans l'infobulle
}

// Exportation nommée, comme l'attend votre import dans App.tsx
export const Tooltip = ({ children, content }: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    // Conteneur principal qui permet de positionner l'infobulle par rapport à son enfant
    <div 
      className="relative flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {/* C'est l'élément sur lequel on passe la souris */}
      {children}

      {/* L'infobulle elle-même. 
        Elle est positionnée de manière absolue par rapport au conteneur.
        Sa visibilité est contrôlée par l'état 'isVisible'.
      */}
      {isVisible && (
        <div 
          className="absolute bottom-full mb-2 w-max px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-lg shadow-sm transition-opacity"
        >
          {content}
          {/* Petite flèche en dessous de l'infobulle pour le style */}
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};