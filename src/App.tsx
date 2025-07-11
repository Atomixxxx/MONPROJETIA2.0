import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Tooltip } from './components/Tooltip';
import { MonacoEditor } from './components/MonacoEditor';
import { ProjectSidebar } from './components/ProjectSidebar';
import { ExecutionPanel } from './components/ExecutionPanel';
import { TerminalPanel } from './components/TerminalPanel';
import { ConnectionStatus } from './components/ConnectionStatus';
import { ChatPanel } from './components/ChatPanel';
import { ProjectTemplates } from './components/ProjectTemplates';
import { KeyboardShortcuts } from './components/KeyboardShortcuts';
import { StorageService } from './services/storage';
import { CodeExecutionService } from './services/codeExecution';
import { TemplateService } from './services/templates';
import { useWebSocket } from './hooks/useWebSocket';
import { Project, ProjectFile, ExecutionResult, EditorSettings, ProjectTemplate } from './types';
import { 
  Play, 
  Terminal as TerminalIcon, 
  MessageSquare, 
  Code, 
  Folders, 
  Settings,
  Save,
  Zap,
  Search,
  Home,
  X
} from 'lucide-react';

const storage = new StorageService();
const codeExecution = new CodeExecutionService();
const templateService = new TemplateService();

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [activeFile, setActiveFile] = useState<ProjectFile | null>(null);
  const [currentCode, setCurrentCode] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResults, setExecutionResults] = useState<ExecutionResult[]>([]);
  const [showExecutionPanel, setShowExecutionPanel] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [showTerminalPanel, setShowTerminalPanel] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [pendingProjectName, setPendingProjectName] = useState('');

  const userId = 'user-' + uuidv4();
  const { isConnected, users, sendMessage } = useWebSocket(userId);

  const [editorSettings] = useState<EditorSettings>({
    theme: 'vs-dark',
    fontSize: 14,
    wordWrap: true,
    lineNumbers: true,
    minimap: false,
    autoSave: true,
    autoSaveInterval: 30000
  });

  useEffect(() => {
    const initializeApp = async () => {
      await loadProjects();
      await loadExecutionHistory();
    };
    initializeApp();
  }, []);

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S : Sauvegarder
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (currentCode && activeFile) {
          handleSave(currentCode);
          showNotification('Fichier sauvegardé', 'success');
        }
      }
      
      // Ctrl/Cmd + Enter : Exécuter
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (currentCode) {
          handleExecute(currentCode, activeFile?.language || 'python');
          setShowExecutionPanel(true);
        }
      }
      
      // Ctrl/Cmd + ` : Terminal
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault();
        setShowTerminalPanel(!showTerminalPanel);
      }
      
      // Ctrl/Cmd + J : Chat
      if ((e.ctrlKey || e.metaKey) && e.key === 'j') {
        e.preventDefault();
        setShowChatPanel(!showChatPanel);
      }
      
      // Ctrl/Cmd + 1 : Console
      if ((e.ctrlKey || e.metaKey) && e.key === '1') {
        e.preventDefault();
        setShowExecutionPanel(!showExecutionPanel);
      }
      
      // Ctrl/Cmd + B : Sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarCollapsed(!sidebarCollapsed);
      }
      
      // F1 : Aide
      if (e.key === 'F1') {
        e.preventDefault();
        setShowKeyboardShortcuts(true);
      }
      
      // Escape : Fermer modales
      if (e.key === 'Escape') {
        if (showKeyboardShortcuts) setShowKeyboardShortcuts(false);
        if (showTemplateModal) setShowTemplateModal(false);
        if (notification) setNotification(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentCode, activeFile, showTerminalPanel, showChatPanel, showExecutionPanel, sidebarCollapsed, showKeyboardShortcuts, showTemplateModal, notification]);

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const withLoading = async (fn: () => Promise<any>) => {
    setIsLoading(true);
    try {
      await fn();
    } finally {
      setIsLoading(false);
    }
  };
  const loadProjects = async () => {
    const storedProjects = await storage.getProjects();
    if (storedProjects.length === 0) {
      // Créer un projet de démonstration
      const sampleProject = storage.createSampleProject();
      await storage.saveProject(sampleProject);
      setProjects([sampleProject]);
      setActiveProject(sampleProject);
      setActiveFile(sampleProject.files[0]);
      setCurrentCode(sampleProject.files[0].content);
    } else {
      setProjects(storedProjects);
    }
  };

  const loadExecutionHistory = async () => {
    const history = await storage.getExecutionHistory();
    setExecutionResults(history);
  };

  const handleProjectSelect = (project: Project) => {
    setActiveProject(project);
    if (project.files.length > 0) {
      setActiveFile(project.files[0]);
      setCurrentCode(project.files[0].content);
    }
  };

  const handleFileSelect = (file: ProjectFile) => {
    setActiveFile(file);
    setCurrentCode(file.content);
  };

  const handleContentChange = (content: string) => {
    setCurrentCode(content);
  };

  const handleSave = async (content: string) => {
    if (!activeFile || !activeProject) return;
    
    await withLoading(async () => {
      const updatedFile = { ...activeFile, content };
      await storage.saveFile(activeProject.id, updatedFile);
      
      // Mettre à jour les états
      setActiveFile(updatedFile);
      setProjects(prev => prev.map(p => 
        p.id === activeProject.id 
          ? { ...p, files: p.files.map(f => f.id === activeFile.id ? updatedFile : f) }
          : p
      ));

      // Envoyer via WebSocket
      sendMessage({
        type: 'file_save',
        payload: { fileId: activeFile.id, content }
      });
      
      showNotification('Fichier sauvegardé avec succès', 'success');
    });
  };

  const handleCreateProject = () => {
    setShowTemplateModal(true);
  };

  const handleCreateProjectFromTemplate = (template: ProjectTemplate, projectName: string) => {
    const newProject: Project = {
      id: uuidv4(),
      name: projectName,
      description: template.description,
      language: template.language as 'python' | 'javascript' | 'typescript',
      createdAt: new Date(),
      updatedAt: new Date(),
      isShared: false,
      files: template.files.map(file => ({
        id: uuidv4(),
        name: file.name,
        path: `/${file.name}`,
        content: file.content,
        language: file.language,
        size: file.content.length,
        lastModified: new Date(),
        version: 1,
        projectId: ''
      }))
    };

    // Mettre à jour les projectId des fichiers
    newProject.files.forEach(file => {
      file.projectId = newProject.id;
    });

    storage.saveProject(newProject);
    setProjects(prev => [...prev, newProject]);
    setActiveProject(newProject);
    
    if (newProject.files.length > 0) {
      setActiveFile(newProject.files[0]);
      setCurrentCode(newProject.files[0].content);
    }
  };

  const handleCreateFile = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      const newFile: ProjectFile = {
        id: uuidv4(),
        name: 'nouveau_fichier.py',
        path: '/nouveau_fichier.py',
        content: '# Nouveau fichier\n',
        language: 'python',
        size: 0,
        lastModified: new Date(),
        version: 1,
        projectId
      };

      await storage.saveFile(projectId, newFile);
      const updatedProject = { ...project, files: [...project.files, newFile] };
      setProjects(prev => prev.map(p => p.id === projectId ? updatedProject : p));
      
      if (activeProject?.id === projectId) {
        setActiveProject(updatedProject);
      }
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
      await storage.deleteProject(projectId);
      setProjects(prev => prev.filter(p => p.id !== projectId));
      
      if (activeProject?.id === projectId) {
        setActiveProject(null);
        setActiveFile(null);
        setCurrentCode('');
      }
    }
  };

  const handleDeleteFile = async (projectId: string, fileId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) {
      await storage.deleteFile(projectId, fileId);
      setProjects(prev => prev.map(p => 
        p.id === projectId 
          ? { ...p, files: p.files.filter(f => f.id !== fileId) }
          : p
      ));
      
      if (activeFile?.id === fileId) {
        setActiveFile(null);
        setCurrentCode('');
      }
    }
  };

  const handleExecute = async (code: string, language: string) => {
    if (!code.trim()) {
      showNotification('Aucun code à exécuter', 'error');
      return;
    }
    
    setIsExecuting(true);
    showNotification('Exécution en cours...', 'info');
    try {
      const result = await codeExecution.executeCode(code, language);
      await storage.saveExecutionResult(result);
      setExecutionResults(prev => [result, ...prev]);
      
      sendMessage({
        type: 'execution_result',
        payload: result
      });
      
      showNotification(
        result.status === 'success' ? 'Code exécuté avec succès' : 'Erreur lors de l\'exécution',
        result.status === 'success' ? 'success' : 'error'
      );
    } catch (error) {
      console.error('Execution error:', error);
      showNotification('Erreur lors de l\'exécution', 'error');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleStopExecution = () => {
    codeExecution.killExecution();
    setIsExecuting(false);
  };

  const handleChatCommand = async (command: string, payload?: any) => {
    console.log('Chat command:', command, payload);
    
    switch (command) {
      case 'create_file':
        if (activeProject && payload?.fileName) {
          const newFile: ProjectFile = {
            id: uuidv4(),
            name: payload.fileName,
            path: `/${payload.fileName}`,
            content: payload.content || '# Nouveau fichier créé par IA\n',
            language: payload.fileName.endsWith('.py') ? 'python' : 
                     payload.fileName.endsWith('.js') ? 'javascript' : 
                     payload.fileName.endsWith('.ts') ? 'typescript' : 
                     payload.fileName.endsWith('.jsx') ? 'javascript' :
                     payload.fileName.endsWith('.tsx') ? 'typescript' :
                     payload.fileName.endsWith('.html') ? 'html' :
                     payload.fileName.endsWith('.css') ? 'css' :
                     payload.fileName.endsWith('.json') ? 'json' :
                     payload.fileName.endsWith('.sql') ? 'sql' : 'plaintext',
            size: 0,
            lastModified: new Date(),
            version: 1,
            projectId: activeProject.id
          };
          
          await storage.saveFile(activeProject.id, newFile);
          const updatedProject = { ...activeProject, files: [...activeProject.files, newFile] };
          setProjects(prev => prev.map(p => p.id === activeProject.id ? updatedProject : p));
          setActiveProject(updatedProject);
          setActiveFile(newFile);
          setCurrentCode(newFile.content);
        }
        break;
        
      case 'create_project':
        if (payload?.showTemplates) {
          setPendingProjectName(payload.projectName || '');
          setShowTemplateModal(true);
        } else if (payload?.projectName) {
          const newProject: Project = {
            id: uuidv4(),
            name: payload.projectName,
            description: payload.description || 'Projet créé par l\'assistant IA',
            language: payload.language || 'javascript',
            createdAt: new Date(),
            updatedAt: new Date(),
            isShared: false,
            files: [{
              id: uuidv4(),
              name: payload.language === 'python' ? 'main.py' : 'index.html',
              path: payload.language === 'python' ? '/main.py' : '/index.html',
              content: payload.language === 'python' 
                ? '# Projet créé par l\'assistant IA\nprint("Hello from AI!")\n'
                : '<!DOCTYPE html>\n<html>\n<head>\n  <title>Projet IA</title>\n</head>\n<body>\n  <h1>Hello from AI!</h1>\n</body>\n</html>',
              language: payload.language === 'python' ? 'python' : 'html',
              size: 0,
              lastModified: new Date(),
              version: 1,
              projectId: ''
            }]
          };
          
          newProject.files[0].projectId = newProject.id;
          await storage.saveProject(newProject);
          setProjects(prev => [...prev, newProject]);
          setActiveProject(newProject);
          setActiveFile(newProject.files[0]);
          setCurrentCode(newProject.files[0].content);
        }
        break;
        
      case 'execute_code':
        if (currentCode.trim()) {
          handleExecute(currentCode, activeFile?.language || 'python');
          setShowExecutionPanel(true);
        }
        break;
        
      case 'modify_file':
        if (payload?.action === 'save' || payload?.content) {
          const contentToSave = payload?.content || currentCode;
          await handleSave(contentToSave);
          if (payload?.content) {
            setCurrentCode(payload.content);
          }
        } else if (payload?.fileId && activeProject) {
          // Modifier un fichier spécifique par ID
          const fileToModify = activeProject.files.find(f => f.id === payload.fileId);
          if (fileToModify) {
            const updatedFile = { ...fileToModify, content: payload.content };
            await storage.saveFile(activeProject.id, updatedFile);
            
            const updatedProject = { 
              ...activeProject, 
              files: activeProject.files.map(f => f.id === payload.fileId ? updatedFile : f) 
            };
            setProjects(prev => prev.map(p => p.id === activeProject.id ? updatedProject : p));
            setActiveProject(updatedProject);
            
            if (activeFile?.id === payload.fileId) {
              setActiveFile(updatedFile);
              setCurrentCode(updatedFile.content);
            }
          }
        }
        break;
        
      case 'install_package':
        if (payload?.packageName) {
          console.log('Installing package:', payload.packageName);
          // Créer ou mettre à jour package.json
          if (activeProject) {
            let packageJsonFile = activeProject.files.find(f => f.name === 'package.json');
            let packageJson = packageJsonFile ? JSON.parse(packageJsonFile.content) : {
              name: activeProject.name.toLowerCase().replace(/\s+/g, '-'),
              version: "1.0.0",
              dependencies: {}
            };
            
            packageJson.dependencies[payload.packageName] = "latest";
            
            if (packageJsonFile) {
              await handleChatCommand('modify_file', {
                fileId: packageJsonFile.id,
                content: JSON.stringify(packageJson, null, 2)
              });
            } else {
              await handleChatCommand('create_file', {
                fileName: 'package.json',
                content: JSON.stringify(packageJson, null, 2)
              });
            }
          }
        }
        break;
        
      case 'run_command':
        if (payload?.command === 'open_terminal' || payload?.type) {
          setShowTerminalPanel(true);
          
          // Afficher le terminal et exécuter la commande
          if (payload?.command && payload.command !== 'open_terminal') {
            console.log(`Executing: ${payload.command}`);
            // La commande sera visible dans le terminal
          }
        }
        break;
        
      case 'deploy_app':
        console.log('Deploying application...');
        // Simuler le déploiement
        break;
        
      case 'system_info':
        if (payload?.clearChat) {
          // Le chat gérera lui-même le clear
        }
        break;
        
      default:
        console.log('Unknown command:', command);
    }
  };

  const handleRunTerminalCommand = async (command: string): Promise<string> => {
    // Simuler l'exécution de commandes terminal
    if (command.startsWith('execute:')) {
      const code = command.substring(8);
      const result = await codeExecution.executeCode(code, activeFile?.language || 'python');
      return result.output || result.errors || 'Commande exécutée';
    }
    
    return `✅ Commande "${command}" exécutée avec succès`;
  };

  return (
    <div className="h-screen bg-gray-900 text-gray-300 flex flex-col font-inter antialiased">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-gray-800 border-b border-gray-700 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Code className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Plateforme IA Collaborative</h1>
          </div>
          <ConnectionStatus isConnected={isConnected} users={users} />
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-700 rounded-lg p-1">
            <Tooltip content="Console (Ctrl+1)">
              <button
                onClick={() => setShowExecutionPanel(!showExecutionPanel)}
                className={`px-3 py-2 rounded-md transition-all duration-200 flex items-center gap-2 ${
                  showExecutionPanel 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-gray-300 hover:bg-gray-600 hover:text-white'
                }`}
              >
                <Play className="w-4 h-4" />
                <span className="text-sm font-medium">Console</span>
              </button>
            </Tooltip>
            
            <Tooltip content="Terminal (Ctrl+`)">
              <button
                onClick={() => setShowTerminalPanel(!showTerminalPanel)}
                className={`px-3 py-2 rounded-md transition-all duration-200 flex items-center gap-2 ${
                  showTerminalPanel 
                    ? 'bg-green-600 text-white shadow-lg' 
                    : 'text-gray-300 hover:bg-gray-600 hover:text-white'
                }`}
              >
                <TerminalIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Terminal</span>
              </button>
            </Tooltip>
            
            <Tooltip content="Chat IA (Ctrl+J)">
              <button
                onClick={() => setShowChatPanel(!showChatPanel)}
                className={`px-3 py-2 rounded-md transition-all duration-200 flex items-center gap-2 ${
                  showChatPanel 
                    ? 'bg-purple-600 text-white shadow-lg' 
                    : 'text-gray-300 hover:bg-gray-600 hover:text-white'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span className="text-sm font-medium">Chat IA</span>
              </button>
            </Tooltip>
          </div>
          
          <div className="flex items-center gap-2">
            <Tooltip content="Raccourcis (F1)">
              <button
                onClick={() => setShowKeyboardShortcuts(true)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
            </Tooltip>
            
            <Tooltip content="Masquer sidebar (Ctrl+B)">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Folders className="w-4 h-4" />
              </button>
            </Tooltip>
          </div>
        </div>
      </header>

      {/* Notification */}
      {notification && (
        <div className={`absolute top-20 right-6 z-50 px-4 py-3 rounded-lg shadow-lg border-l-4 flex items-center gap-3 animate-slide-in ${
          notification.type === 'success' ? 'bg-green-900/90 border-green-500 text-green-100' :
          notification.type === 'error' ? 'bg-red-900/90 border-red-500 text-red-100' :
          'bg-blue-900/90 border-blue-500 text-blue-100'
        }`}>
          {notification.type === 'success' && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
          {notification.type === 'error' && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>}
          {notification.type === 'info' && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>}
          <span className="text-sm font-medium">{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="ml-2 hover:bg-white/10 rounded p-1"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-40">
          <div className="bg-gray-800 p-4 rounded-lg flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-white">Chargement...</span>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="px-6 py-2 bg-gray-800/50 border-b border-gray-700/50 text-sm">
        <div className="flex items-center gap-2 text-gray-400">
          <Home className="w-4 h-4" />
          <span>/</span>
          {activeProject && (
            <>
              <span className="text-gray-300">{activeProject.name}</span>
              <span>/</span>
            </>
          )}
          {activeFile && (
            <span className="text-white font-medium">{activeFile.name}</span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Section */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat Panel */}
          {showChatPanel && (
            <div className="w-80 border-r border-gray-700 flex-shrink-0 animate-slide-in-left">
              <ChatPanel
                onExecuteCommand={handleChatCommand}
                activeProject={activeProject}
                activeFile={activeFile}
                currentCode={currentCode}
                className="h-full"
              />
            </div>
          )}

          {/* Sidebar */}
          {!sidebarCollapsed && (
            <div className="w-64 border-r border-gray-700 flex-shrink-0 animate-slide-in-left">
              <ProjectSidebar
                projects={projects}
                activeProject={activeProject}
                activeFile={activeFile}
                onProjectSelect={handleProjectSelect}
                onFileSelect={handleFileSelect}
                onCreateProject={handleCreateProject}
                onCreateFile={handleCreateFile}
                onDeleteProject={handleDeleteProject}
                onDeleteFile={handleDeleteFile}
                className="h-full"
              />
            </div>
          )}

          {/* Editor */}
          <div className="flex-1 min-w-0 relative">
            <MonacoEditor
              file={activeFile}
              onContentChange={handleContentChange}
              onSave={handleSave}
              settings={editorSettings}
              className="h-full"
            />
            
            {/* Quick Actions */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              <Tooltip content="Sauvegarder (Ctrl+S)">
                <button
                  onClick={() => handleSave(currentCode)}
                  disabled={!currentCode || !activeFile}
                  className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-lg transition-all duration-200"
                >
                  <Save className="w-4 h-4 text-white" />
                </button>
              </Tooltip>
              
              <Tooltip content="Exécuter (Ctrl+Enter)">
                <button
                  onClick={() => {
                    handleExecute(currentCode, activeFile?.language || 'python');
                    setShowExecutionPanel(true);
                  }}
                  disabled={!currentCode || isExecuting}
                  className="p-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg shadow-lg transition-all duration-200"
                >
                  <Zap className="w-4 h-4 text-white" />
                </button>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Bottom Panels */}
        {(showExecutionPanel || showTerminalPanel) && (
          <div className="border-t border-gray-700 flex overflow-hidden animate-slide-in-up" style={{ height: '320px' }}>
            {showExecutionPanel && (
              <div className={`${showTerminalPanel ? 'flex-1 border-r border-gray-700' : 'flex-1'}`}>
                <ExecutionPanel
                  onExecute={handleExecute}
                  onStop={handleStopExecution}
                  currentCode={currentCode}
                  currentLanguage={activeFile?.language || 'python'}
                  isExecuting={isExecuting}
                  results={executionResults}
                  className="h-full"
                />
              </div>
            )}
            
            {showTerminalPanel && (
              <div className={`${showExecutionPanel ? 'flex-1' : 'flex-1'}`}>
                <TerminalPanel
                  activeProject={activeProject}
                  onRunCommand={handleRunTerminalCommand}
                  onClose={() => setShowTerminalPanel(false)}
                  className="h-full"
                />
              </div>
            )}
          </div>
        )}
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
          
          <button
            onClick={() => setShowChatPanel(!showChatPanel)}
            className={`px-4 py-2 rounded transition-colors ${
              showChatPanel 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Chat IA
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Section - Horizontal Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat Panel */}
          {showChatPanel && (
            <ChatPanel
              onExecuteCommand={handleChatCommand}
              activeProject={activeProject}
              activeFile={activeFile}
              currentCode={currentCode}
              className="w-80 border-r border-gray-700 flex-shrink-0"
            />
          )}

          {/* Sidebar */}
          <ProjectSidebar
            projects={projects}
            activeProject={activeProject}
            activeFile={activeFile}
            onProjectSelect={handleProjectSelect}
            onFileSelect={handleFileSelect}
            onCreateProject={handleCreateProject}
            onCreateFile={handleCreateFile}
            onDeleteProject={handleDeleteProject}
            onDeleteFile={handleDeleteFile}
            className="w-64 border-r border-gray-700 flex-shrink-0"
          />

          {/* Editor */}
          <MonacoEditor
            file={activeFile}
            onContentChange={handleContentChange}
            onSave={handleSave}
            settings={editorSettings}
            className="flex-1 min-w-0"
          />
        </div>

        {/* Bottom Section - Panels horizontaux */}
        {(showExecutionPanel || showTerminalPanel) && (
          <div className="border-t border-gray-700 flex overflow-hidden" style={{ minHeight: '200px', maxHeight: '60vh' }}>
            {/* Execution Panel */}
            {showExecutionPanel && (
              <ExecutionPanel
                onExecute={handleExecute}
                onStop={handleStopExecution}
                currentCode={currentCode}
                currentLanguage={activeFile?.language || 'python'}
                isExecuting={isExecuting}
                results={executionResults}
                className={`${showTerminalPanel ? 'flex-1 border-r border-gray-700' : 'flex-1'}`}
              />
            )}
        
            {/* Terminal Panel */}
            {showTerminalPanel && (
              <TerminalPanel
                activeProject={activeProject}
                onRunCommand={handleRunTerminalCommand}
                onClose={() => setShowTerminalPanel(false)}
                className={`${showExecutionPanel ? 'flex-1' : 'flex-1'}`}
              />
            )}
          </div>
        )}
      </div>
      
      {/* Template Modal */}
      {showTemplateModal && (
        <ProjectTemplates
          onSelectTemplate={(template, name) => {
            handleCreateProjectFromTemplate(template, name);
            setShowTemplateModal(false);
            setPendingProjectName('');
          }}
          onClose={() => {
            setShowTemplateModal(false);
            setPendingProjectName('');
          }}
        />
      )}
    </div>
  );
}

export default App;