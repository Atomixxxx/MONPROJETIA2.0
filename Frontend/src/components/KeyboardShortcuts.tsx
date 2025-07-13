// Créez ce fichier: src/components/KeyboardShortcuts.tsx

import React from 'react';
import { X, Command, Zap, Play, Terminal, MessageSquare, Folders, Save, Settings } from 'lucide-react';

interface KeyboardShortcutsProps {
  onClose: () => void;
}

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({ onClose }) => {
  const shortcuts = [
    {
      category: 'Navigation',
      items: [
        { key: 'Ctrl+B', description: 'Masquer/Afficher sidebar', icon: <Folders className="w-4 h-4" /> },
        { key: 'Ctrl+J', description: 'Chat IA', icon: <MessageSquare className="w-4 h-4" /> },
        { key: 'Ctrl+`', description: 'Terminal', icon: <Terminal className="w-4 h-4" /> },
        { key: 'Ctrl+1', description: 'Console', icon: <Play className="w-4 h-4" /> },
        { key: 'F1', description: 'Aide', icon: <Settings className="w-4 h-4" /> },
      ]
    },
    {
      category: 'Édition',
      items: [
        { key: 'Ctrl+S', description: 'Sauvegarder', icon: <Save className="w-4 h-4" /> },
        { key: 'Ctrl+Enter', description: 'Exécuter code', icon: <Zap className="w-4 h-4" /> },
        { key: 'Ctrl+Z', description: 'Annuler', icon: <Command className="w-4 h-4" /> },
        { key: 'Ctrl+Y', description: 'Refaire', icon: <Command className="w-4 h-4" /> },
      ]
    },
    {
      category: 'Interface',
      items: [
        { key: 'Escape', description: 'Fermer modal', icon: <X className="w-4 h-4" /> },
        { key: 'Tab', description: 'Navigation clavier', icon: <Command className="w-4 h-4" /> },
        { key: 'Ctrl+K', description: 'Palette de commandes', icon: <Command className="w-4 h-4" /> },
      ]
    }
  ];

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-700">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Raccourcis clavier
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-6 overflow-y-auto">
        <div className="space-y-6">
          {shortcuts.map((category) => (
            <div key={category.category}>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                {category.category}
              </h3>
              <div className="space-y-3">
                {category.items.map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="text-blue-400">
                        {item.icon}
                      </div>
                      <span className="text-gray-300">{item.description}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {item.key.split('+').map((key, index) => (
                        <React.Fragment key={index}>
                          {index > 0 && <span className="text-gray-500 mx-1">+</span>}
                          <kbd className="px-2 py-1 bg-gray-600 text-gray-200 rounded text-sm font-mono">
                            {key}
                          </kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700 bg-gray-750">
        <p className="text-sm text-gray-400 text-center">
          Appuyez sur <kbd className="px-2 py-1 bg-gray-600 text-gray-200 rounded text-xs">Escape</kbd> pour fermer
        </p>
      </div>
    </div>
  );
};