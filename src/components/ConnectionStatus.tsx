import React from 'react';
import { Wifi, WifiOff, Users, Heart } from 'lucide-react';
import { User } from '../types';

interface ConnectionStatusProps {
  isConnected: boolean;
  users: User[];
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  users,
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Status de connexion */}
      <div className="flex items-center gap-2">
        {isConnected ? (
          <Wifi className="w-4 h-4 text-green-500" />
        ) : (
          <WifiOff className="w-4 h-4 text-red-500" />
        )}
        <span className={`text-sm font-medium ${
          isConnected ? 'text-green-600' : 'text-red-600'
        }`}>
          {isConnected ? 'Connecté' : 'Déconnecté'}
        </span>
        {isConnected && (
          <Heart className="w-3 h-3 text-green-500 animate-pulse" />
        )}
      </div>

      {/* Utilisateurs actifs */}
      {users.length > 0 && (
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-500" />
          <div className="flex -space-x-2">
            {users.slice(0, 3).map((user) => (
              <div
                key={user.id}
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white border-2 border-white"
                style={{ backgroundColor: user.color }}
                title={user.name}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
            ))}
            {users.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center text-xs font-medium text-white border-2 border-white">
                +{users.length - 3}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};