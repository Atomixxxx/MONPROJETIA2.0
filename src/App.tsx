import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MonacoEditor } from './components/MonacoEditor';
import { ProjectSidebar } from './components/ProjectSidebar';
import { ExecutionPanel } from './components/ExecutionPanel';
import { TerminalPanel } from './components/TerminalPanel';
import { ConnectionStatus } from './components/ConnectionStatus';
import { ChatPanel } from './components/ChatPanel';
import { ProjectTemplates } from './components/ProjectTemplates';
import { StorageService } from './services/storage';
import { CodeExecutionService } from './services/codeExecution';
import { TemplateService } from './services/templates';
import { useWebSocket } from './hooks/useWebSocket';
import { Project, ProjectFile, ExecutionResult, EditorSettings, ProjectTemplate } from './types';

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
    if (activeFile && activeProject) {
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
    }
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
    setIsExecuting(true);
    try {
      const result = await codeExecution.executeCode(code, language);
      await storage.saveExecutionResult(result);
      setExecutionResults(prev => [result, ...prev]);
      
      sendMessage({
        type: 'execution_result',
        payload: result
      });
    } catch (error) {
      console.error('Execution error:', error);
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
    <div className="h-screen bg-gray-900 text-gray-300 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-white">🚀 Plateforme IA Collaborative</h1>
          <ConnectionStatus isConnected={isConnected} users={users} />
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExecutionPanel(!showExecutionPanel)}
            className={`px-4 py-2 rounded transition-colors ${
              showExecutionPanel 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Console
          </button>
          
          <button
            onClick={() => setShowTerminalPanel(!showTerminalPanel)}
            className={`px-4 py-2 rounded transition-colors ${
              showTerminalPanel 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Terminal
          </button>
          
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