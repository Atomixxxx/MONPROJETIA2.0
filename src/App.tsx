import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Save, 
  FileText, 
  Terminal, 
  MessageCircle, 
  Settings, 
  Folder,
  ChevronRight,
  Bell,
  X,
  Keyboard,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';
import { MonacoEditor } from './components/MonacoEditor';
import { ProjectSidebar } from './components/ProjectSidebar';
import { ExecutionPanel } from './components/ExecutionPanel';
import { ChatPanel } from './components/ChatPanel';
import { TerminalPanel } from './components/TerminalPanel';
import { ConnectionStatus } from './components/ConnectionStatus';
import { ProjectTemplates } from './components/ProjectTemplates';
import { KeyboardShortcuts } from './components/KeyboardShortcuts';
import { Tooltip } from './components/Tooltip';
import { useWebSocket } from './hooks/useWebSocket';
import { useAutoSave } from './hooks/useAutoSave';
import { Project, FileNode } from './types';

// Notification types
interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  timestamp: number;
}

function App() {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [code, setCode] = useState('print("Hello, World!")');
  const [currentFile, setCurrentFile] = useState<FileNode | null>(null);
  const [executionResult, setExecutionResult] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [activePanel, setActivePanel] = useState<'console' | 'terminal' | 'chat'>('console');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [pendingProjectName, setPendingProjectName] = useState('');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [terminalHeight, setTerminalHeight] = useState(320);
  const [terminalVisible, setTerminalVisible] = useState(false);
  const [terminalMinimized, setTerminalMinimized] = useState(false);
  
  const { isConnected, sendMessage } = useWebSocket();
  const { saveStatus } = useAutoSave(code, currentFile);
  const notificationTimeoutRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      // Ctrl+S - Save
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      // Ctrl+Enter - Execute
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleExecute();
      }
      // Ctrl+` - Toggle Terminal
      if (e.ctrlKey && e.key === '`') {
        e.preventDefault();
        setTerminalVisible(!terminalVisible);
      }
      // Ctrl+J - Chat
      if (e.ctrlKey && e.key === 'j') {
        e.preventDefault();
        setActivePanel('chat');
      }
      // Ctrl+1 - Console
      if (e.ctrlKey && e.key === '1') {
        e.preventDefault();
        setActivePanel('console');
      }
      // Ctrl+B - Toggle Sidebar
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        setSidebarVisible(!sidebarVisible);
      }
      // F1 - Help
      if (e.key === 'F1') {
        e.preventDefault();
        setShowKeyboardShortcuts(true);
      }
      // Escape - Close modals
      if (e.key === 'Escape') {
        setShowTemplateModal(false);
        setShowKeyboardShortcuts(false);
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [terminalVisible, sidebarVisible]);

  // Notification system
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    const notification: Notification = {
      id,
      message,
      type,
      timestamp: Date.now()
    };
    
    setNotifications(prev => [...prev, notification]);
    
    // Auto-dismiss after 5 seconds
    notificationTimeoutRef.current[id] = setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (notificationTimeoutRef.current[id]) {
      clearTimeout(notificationTimeoutRef.current[id]);
      delete notificationTimeoutRef.current[id];
    }
  };

  const handleSave = () => {
    if (currentFile) {
      // Save logic here
      showNotification('Fichier sauvegardé', 'success');
    }
  };

  const handleExecute = async () => {
    if (!code.trim()) return;
    
    setIsExecuting(true);
    setExecutionResult('');
    showNotification('Exécution du code...', 'info');

    try {
      // Simulate code execution
      await new Promise(resolve => setTimeout(resolve, 1000));
      const result = `Résultat de l'exécution:\n${code}`;
      setExecutionResult(result);
      showNotification('Code exécuté avec succès', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setExecutionResult(`Erreur: ${errorMessage}`);
      showNotification('Erreur lors de l\'exécution', 'error');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCreateProjectFromTemplate = (template: any, name: string) => {
    const newProject: Project = {
      id: Date.now().toString(),
      name,
      description: template.description,
      createdAt: new Date().toISOString(),
      files: template.files || [],
      settings: {}
    };
    
    setProjects(prev => [...prev, newProject]);
    setCurrentProject(newProject);
    
    if (newProject.files.length > 0) {
      setCurrentFile(newProject.files[0]);
      setCode(newProject.files[0].content || '');
    }
  };

  const getBreadcrumbPath = () => {
    if (!currentProject) return 'Aucun projet';
    if (!currentFile) return currentProject.name;
    return `${currentProject.name} / ${currentFile.name}`;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-inter">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <FileText className="w-6 h-6 text-blue-400" />
            <h1 className="text-xl font-bold">Plateforme IA Collaborative</h1>
          </div>
          <ConnectionStatus isConnected={isConnected} />
        </div>
        
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <Folder className="w-4 h-4" />
          <span>{getBreadcrumbPath()}</span>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-2">
          <Tooltip content="Sauvegarder (Ctrl+S)">
            <button
              onClick={handleSave}
              disabled={!currentFile}
              className="flex items-center space-x-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">Sauvegarder</span>
            </button>
          </Tooltip>
          
          <Tooltip content="Exécuter (Ctrl+Enter)">
            <button
              onClick={handleExecute}
              disabled={isExecuting}
              className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
            >
              <Play className="w-4 h-4" />
              <span className="hidden sm:inline">
                {isExecuting ? 'Exécution...' : 'Exécuter'}
              </span>
            </button>
          </Tooltip>
          
          <Tooltip content="Raccourcis clavier (F1)">
            <button
              onClick={() => setShowKeyboardShortcuts(true)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Keyboard className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Panel */}
        <div className="w-80 flex-shrink-0 border-r border-gray-700">
          <ChatPanel />
        </div>

        {/* Sidebar */}
        {sidebarVisible && (
          <div className="w-64 flex-shrink-0 border-r border-gray-700 animate-slide-in">
            <ProjectSidebar
              projects={projects}
              currentProject={currentProject}
              onSelectProject={setCurrentProject}
              onCreateProject={() => setShowTemplateModal(true)}
              onSelectFile={(file) => {
                setCurrentFile(file);
                setCode(file.content || '');
              }}
            />
          </div>
        )}

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Editor Header */}
          <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center space-x-2">
              <Tooltip content="Masquer/Afficher sidebar (Ctrl+B)">
                <button
                  onClick={() => setSidebarVisible(!sidebarVisible)}
                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                >
                  {sidebarVisible ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
                </button>
              </Tooltip>
              
              {currentFile && (
                <div className="flex items-center space-x-2 text-sm">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span>{currentFile.name}</span>
                  {saveStatus === 'saving' && (
                    <span className="text-yellow-400 animate-pulse">●</span>
                  )}
                  {saveStatus === 'saved' && (
                    <span className="text-green-400">●</span>
                  )}
                </div>
              )}
            </div>
            
            {/* Panel Selector */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setActivePanel('console')}
                className={`px-3 py-1 rounded-t-lg transition-colors ${
                  activePanel === 'console' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                Console
              </button>
              <button
                onClick={() => setTerminalVisible(!terminalVisible)}
                className={`px-3 py-1 rounded-t-lg transition-colors ${
                  terminalVisible
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                Terminal
              </button>
              <button
                onClick={() => setActivePanel('chat')}
                className={`px-3 py-1 rounded-t-lg transition-colors ${
                  activePanel === 'chat' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                Chat IA
              </button>
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 relative">
            <MonacoEditor
              value={code}
              onChange={setCode}
              language="python"
              theme="vs-dark"
            />
            
            {/* Floating Action Buttons */}
            <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
              <Tooltip content="Sauvegarder (Ctrl+S)">
                <button
                  onClick={handleSave}
                  disabled={!currentFile}
                  className="p-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-full shadow-lg transition-all hover:scale-105"
                >
                  <Save className="w-5 h-5" />
                </button>
              </Tooltip>
              
              <Tooltip content="Exécuter (Ctrl+Enter)">
                <button
                  onClick={handleExecute}
                  disabled={isExecuting}
                  className={`p-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-full shadow-lg transition-all hover:scale-105 ${
                    isExecuting ? 'animate-pulse' : ''
                  }`}
                >
                  <Play className="w-5 h-5" />
                </button>
              </Tooltip>
            </div>
          </div>

          {/* Bottom Panel */}
          <div className="h-80 border-t border-gray-700 flex">
            {/* Console Panel */}
            <div className="flex-1">
              <ExecutionPanel
                result={executionResult}
                isExecuting={isExecuting}
                onExecute={handleExecute}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Terminal Panel */}
      {terminalVisible && (
        <div className="border-t border-gray-700 animate-slide-in">
          <TerminalPanel
            height={terminalHeight}
            onHeightChange={setTerminalHeight}
            isMinimized={terminalMinimized}
            onMinimize={() => setTerminalMinimized(!terminalMinimized)}
            onClose={() => setTerminalVisible(false)}
          />
        </div>
      )}

      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-center space-x-2 p-3 rounded-lg shadow-lg backdrop-blur-sm animate-slide-in ${
              notification.type === 'success' ? 'bg-green-600/90' :
              notification.type === 'error' ? 'bg-red-600/90' :
              'bg-blue-600/90'
            }`}
          >
            <Bell className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{notification.message}</span>
            <button
              onClick={() => removeNotification(notification.id)}
              className="hover:bg-white/20 p-1 rounded transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Modals */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="animate-scale-in">
            <ProjectTemplates
              onSelectTemplate={(template, name) => {
                handleCreateProjectFromTemplate(template, name);
                setShowTemplateModal(false);
                setPendingProjectName('');
                showNotification('Projet créé avec succès', 'success');
              }}
              onClose={() => {
                setShowTemplateModal(false);
                setPendingProjectName('');
              }}
            />
          </div>
        </div>
      )}
      
      {showKeyboardShortcuts && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="animate-scale-in">
            <KeyboardShortcuts onClose={() => setShowKeyboardShortcuts(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;