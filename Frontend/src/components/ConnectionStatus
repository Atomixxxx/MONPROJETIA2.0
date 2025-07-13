import React, { useState, useEffect } from 'react';
import { ConnectionState } from '../types';
import { Wifi, WifiOff, Loader2, AlertCircle } from 'lucide-react';

export const ConnectionStatus: React.FC = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'connecting',
    lastPing: new Date(),
    latency: 0,
  });

  const [isVisible, setIsVisible] = useState(false);

  // Simulation de la connexion
  useEffect(() => {
    const checkConnection = () => {
      const isOnline = navigator.onLine;
      const start = Date.now();
      
      // Simulation d'un ping
      setTimeout(() => {
        const latency = Date.now() - start + Math.random() * 50; // Simulation latence
        
        setConnectionState({
          status: isOnline ? 'connected' : 'disconnected',
          lastPing: new Date(),
          latency: Math.round(latency),
        });
      }, Math.random() * 100 + 50);
    };

    // Check initial
    checkConnection();

    // Check périodique toutes les 10 secondes
    const interval = setInterval(checkConnection, 10000);

    // Écouter les changements de connexion
    const handleOnline = () => {
      setConnectionState(prev => ({ ...prev, status: 'connected' }));
      setIsVisible(true);
      setTimeout(() => setIsVisible(false), 3000);
    };

    const handleOffline = () => {
      setConnectionState(prev => ({ ...prev, status: 'disconnected' }));
      setIsVisible(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Afficher seulement si déconnecté ou récemment reconnecté
  useEffect(() => {
    if (connectionState.status === 'disconnected' || connectionState.status === 'error') {
      setIsVisible(true);
    }
  }, [connectionState.status]);

  if (!isVisible && connectionState.status === 'connected') {
    return null;
  }

  const getStatusConfig = () => {
    switch (connectionState.status) {
      case 'connected':
        return {
          icon: React.createElement(Wifi, { size: 16, className: "text-green-400" }),
          text: 'Connecté',
          subText: `${connectionState.latency}ms`,
          bgColor: 'bg-green-900/80 border-green-500/50',
          textColor: 'text-green-100',
        };
      
      case 'disconnected':
        return {
          icon: React.createElement(WifiOff, { size: 16, className: "text-red-400" }),
          text: 'Déconnecté',
          subText: 'Vérifiez votre connexion',
          bgColor: 'bg-red-900/80 border-red-500/50',
          textColor: 'text-red-100',
        };
      
      case 'connecting':
        return {
          icon: React.createElement(Loader2, { size: 16, className: "text-blue-400 animate-spin" }),
          text: 'Connexion...',
          subText: 'Établissement de la connexion',
          bgColor: 'bg-blue-900/80 border-blue-500/50',
          textColor: 'text-blue-100',
        };
      
      case 'error':
        return {
          icon: React.createElement(AlertCircle, { size: 16, className: "text-orange-400" }),
          text: 'Erreur de connexion',
          subText: 'Problème réseau détecté',
          bgColor: 'bg-orange-900/80 border-orange-500/50',
          textColor: 'text-orange-100',
        };
      
      default:
        return {
          icon: React.createElement(Wifi, { size: 16, className: "text-gray-400" }),
          text: 'Statut inconnu',
          subText: '',
          bgColor: 'bg-gray-900/80 border-gray-500/50',
          textColor: 'text-gray-100',
        };
    }
  };

  const config = getStatusConfig();

  return React.createElement('div', { className: "fixed bottom-4 right-4 z-40" },
    React.createElement('div', {
      className: `
        ${config.bgColor} ${config.textColor}
        backdrop-filter backdrop-blur-lg
        border rounded-lg px-4 py-3 shadow-lg
        animate-slide-up
        transition-all duration-300 ease-out
        min-w-[200px]
      `
    },
      React.createElement('div', { className: "flex items-center gap-3" },
        React.createElement('div', { className: "flex-shrink-0" }, config.icon),
        React.createElement('div', { className: "flex-1" },
          React.createElement('div', { className: "text-sm font-medium" }, config.text),
          config.subText && React.createElement('div', { className: "text-xs opacity-75" }, config.subText)
        ),
        connectionState.status === 'connected' && React.createElement('div', { className: "flex-shrink-0" },
          React.createElement('div', { className: "w-2 h-2 bg-green-400 rounded-full animate-pulse" })
        )
      )
    )
  );
};

// Styles CSS pour l'animation
const connectionStyles = `
@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
`;

// Injecter les styles automatiquement
if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('connection-styles');
  if (!existingStyle) {
    const styleElement = document.createElement('style');
    styleElement.id = 'connection-styles';
    styleElement.textContent = connectionStyles;
    document.head.appendChild(styleElement);
  }
}

export default ConnectionStatus;