import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { Terminal, Project } from '../types';
import { 
  Terminal as TerminalIcon, 
  Plus, 
  X, 
  Minimize2, 
  Maximize2,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

interface TerminalPanelProps {
  activeProject: Project | null;
  onRunCommand: (command: string) => Promise<string>;
  onClose?: () => void;
  className?: string;
}

export const TerminalPanel: React.FC<TerminalPanelProps> = ({
  activeProject,
  onRunCommand,
  onClose,
  className = ''
}) => {
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [activeTerminalId, setActiveTerminalId] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [terminalHeight, setTerminalHeight] = useState(320);
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (terminals.length === 0) {
      createNewTerminal();
    }
  }, []);

  useEffect(() => {
    if (terminalRef.current && activeTerminalId && !isMinimized) {
      initializeXterm();
    }
    
    return () => {
      if (xtermRef.current) {
        xtermRef.current.dispose();
      }
    };
  }, [activeTerminalId, isMinimized]);

  const initializeXterm = () => {
    if (xtermRef.current) {
      xtermRef.current.dispose();
    }

    const xterm = new XTerm({
      theme: {
        background: '#1a1a1a',
        foreground: '#ffffff',
        cursor: '#ffffff',
        selection: '#ffffff40',
        black: '#000000',
        red: '#ff6b6b',
        green: '#51cf66',
        yellow: '#ffd43b',
        blue: '#339af0',
        magenta: '#f06292',
        cyan: '#22d3ee',
        white: '#ffffff',
        brightBlack: '#666666',
        brightRed: '#ff8787',
        brightGreen: '#69db7c',
        brightYellow: '#ffe066',
        brightBlue: '#4dabf7',
        brightMagenta: '#f783ac',
        brightCyan: '#66d9ef',
        brightWhite: '#ffffff'
      },
      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
      fontSize: 13,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 1000,
      tabStopWidth: 4
    });

    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);

    if (terminalRef.current) {
      xterm.open(terminalRef.current);
      fitAddon.fit();
    }

    // Prompt initial
    xterm.writeln('🚀 Terminal Plateforme IA Collaborative');
    xterm.writeln('Tapez "help" pour voir les commandes disponibles');
    xterm.write('\r\n$ ');

    let currentInput = '';
    let cursorPosition = 0;

    xterm.onKey(({ key, domEvent }) => {
      const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;

      if (domEvent.keyCode === 13) {
        // Entrée
        xterm.write('\r\n');
        if (currentInput.trim()) {
          executeCommand(currentInput.trim());
          updateTerminalHistory(activeTerminalId!, currentInput.trim());
        }
        currentInput = '';
        cursorPosition = 0;
        xterm.write('$ ');
      } else if (domEvent.keyCode === 8) {
        // Backspace
        if (cursorPosition > 0) {
          currentInput = currentInput.slice(0, cursorPosition - 1) + currentInput.slice(cursorPosition);
          cursorPosition--;
          xterm.write('\b \b');
        }
      } else if (domEvent.keyCode === 37) {
        // Flèche gauche
        if (cursorPosition > 0) {
          cursorPosition--;
          xterm.write('\x1b[D');
        }
      } else if (domEvent.keyCode === 39) {
        // Flèche droite
        if (cursorPosition < currentInput.length) {
          cursorPosition++;
          xterm.write('\x1b[C');
        }
      } else if (printable) {
        currentInput = currentInput.slice(0, cursorPosition) + key + currentInput.slice(cursorPosition);
        cursorPosition++;
        xterm.write(key);
      }
    });

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    // Redimensionner quand la fenêtre change
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  };

  const executeCommand = async (command: string) => {
    if (!xtermRef.current) return;

    const xterm = xtermRef.current;
    
    try {
      // Commandes intégrées
      if (command === 'help') {
        xterm.writeln('📋 Commandes disponibles:');
        xterm.writeln('  help           - Affiche cette aide');
        xterm.writeln('  clear          - Efface le terminal');
        xterm.writeln('  ls             - Liste les fichiers');
        xterm.writeln('  pwd            - Affiche le répertoire actuel');
        xterm.writeln('  run <file>     - Exécute un fichier');
        xterm.writeln('  npm install    - Installe les dépendances');
        xterm.writeln('  npm start      - Démarre l\'application');
        xterm.writeln('  python <file>  - Exécute un script Python');
        xterm.writeln('  node <file>    - Exécute un script Node.js');
      } else if (command === 'clear') {
        xterm.clear();
      } else if (command === 'ls') {
        if (activeProject) {
          xterm.writeln('📁 Fichiers du projet:');
          activeProject.files.forEach(file => {
            const icon = file.language === 'python' ? '🐍' : 
                        file.language === 'javascript' ? '📜' : 
                        file.language === 'typescript' ? '📘' : '📄';
            xterm.writeln(`  ${icon} ${file.name}`);
          });
        } else {
          xterm.writeln('❌ Aucun projet actif');
        }
      } else if (command === 'pwd') {
        xterm.writeln(`📍 ${activeProject ? `/projects/${activeProject.name}` : '/home/user'}`);
      } else if (command.startsWith('run ')) {
        const fileName = command.substring(4);
        const file = activeProject?.files.find(f => f.name === fileName);
        if (file) {
          xterm.writeln(`🚀 Exécution de ${fileName}...`);
          const result = await onRunCommand(`execute:${file.content}`);
          xterm.writeln(result);
        } else {
          xterm.writeln(`❌ Fichier "${fileName}" non trouvé`);
        }
      } else if (command === 'npm install') {
        xterm.writeln('📦 Installation des dépendances...');
        await simulateInstallation(xterm);
        xterm.writeln('✅ Installation terminée!');
      } else if (command === 'npm start') {
        xterm.writeln('🚀 Démarrage de l\'application...');
        xterm.writeln('📡 Serveur démarré sur http://localhost:3000');
        xterm.writeln('✅ Application prête!');
      } else {
        // Commande générique
        xterm.writeln(`⚡ Exécution: ${command}`);
        const result = await onRunCommand(command);
        xterm.writeln(result);
      }
    } catch (error) {
      xterm.writeln(`❌ Erreur: ${error}`);
    }
  };

  const simulateInstallation = async (xterm: XTerm) => {
    const packages = ['react', 'typescript', 'vite', 'tailwindcss', 'lucide-react'];
    for (const pkg of packages) {
      await new Promise(resolve => setTimeout(resolve, 300));
      xterm.writeln(`📦 Installing ${pkg}...`);
    }
  };

  const createNewTerminal = () => {
    const newTerminal: Terminal = {
      id: Date.now().toString(),
      name: `Terminal ${terminals.length + 1}`,
      isActive: true,
      history: [],
      currentDirectory: activeProject ? `/projects/${activeProject.name}` : '/home/user'
    };

    setTerminals(prev => [...prev, newTerminal]);
    setActiveTerminalId(newTerminal.id);
  };

  const closeTerminal = (terminalId: string) => {
    setTerminals(prev => prev.filter(t => t.id !== terminalId));
    if (activeTerminalId === terminalId) {
      const remaining = terminals.filter(t => t.id !== terminalId);
      setActiveTerminalId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const updateTerminalHistory = (terminalId: string, command: string) => {
    setTerminals(prev => prev.map(t => 
      t.id === terminalId 
        ? { ...t, history: [...t.history, command] }
        : t
    ));
  };

  if (isMinimized) {
    return (
      <div className={`bg-gray-800 border-t border-gray-700 ${className}`} style={{ height: '40px' }}>
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center gap-2">
            <TerminalIcon className="w-4 h-4" />
            <span className="text-sm font-medium">Terminal</span>
            <span className="text-xs text-gray-500">({terminals.length} terminal{terminals.length > 1 ? 's' : ''})</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(false)}
              className="p-1 hover:bg-gray-700 rounded"
              title="Agrandir"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-700 rounded text-red-400"
                title="Fermer le terminal"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`flex flex-col bg-gray-900 border-t border-gray-700 ${className}`}
      style={{ 
        height: isExpanded ? '60vh' : `${terminalHeight}px`,
        minHeight: '200px',
        maxHeight: isExpanded ? '60vh' : '500px'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-5 h-5" />
          <span className="font-medium">Terminal</span>
          <span className="text-xs text-gray-500">({terminals.length})</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTerminalHeight(Math.max(200, terminalHeight - 50))}
            className="p-1 hover:bg-gray-700 rounded"
            title="Réduire la hauteur"
            disabled={terminalHeight <= 200}
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setTerminalHeight(Math.min(500, terminalHeight + 50))}
            className="p-1 hover:bg-gray-700 rounded"
            title="Augmenter la hauteur"
            disabled={terminalHeight >= 500}
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-700 rounded"
            title={isExpanded ? "Taille normale" : "Mode plein écran"}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 hover:bg-gray-700 rounded"
            title="Réduire"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-700 rounded text-red-400"
              title="Fermer le terminal"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          
          <button
            onClick={createNewTerminal}
            className="p-1 hover:bg-gray-700 rounded"
            title="Nouveau terminal"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      {terminals.length > 0 && (
        <div className="flex items-center bg-gray-800 border-b border-gray-700 overflow-x-auto">
          {terminals.map((terminal) => (
            <div
              key={terminal.id}
              className={`flex items-center gap-2 px-3 py-2 text-sm border-r border-gray-700 cursor-pointer hover:bg-gray-700 ${
                activeTerminalId === terminal.id ? 'bg-gray-700' : ''
              }`}
              onClick={() => setActiveTerminalId(terminal.id)}
            >
              <span>{terminal.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTerminal(terminal.id);
                }}
                className="p-1 hover:bg-gray-600 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Terminal Content */}
      <div className="flex-1 p-2">
        {activeTerminalId ? (
          <div ref={terminalRef} className="h-full" />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <TerminalIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Aucun terminal actif</p>
              <button
                onClick={createNewTerminal}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Nouveau Terminal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};