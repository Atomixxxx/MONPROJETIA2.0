import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, AIResponse, Project, ProjectFile } from '../types';
import { multiAgentService, WorkflowResult } from '../services/multiAgentService';
import { AgentSelector } from './AgentSelector';
import { WorkflowResults } from './WorkflowResults';
import { 
  Send, 
  Bot, 
  User, 
  MessageCircle, 
  Trash2, 
  Copy, 
  Check,
  Zap,
  Command,
  Users,
  Settings
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

interface ChatPanelProps {
  onExecuteCommand?: (command: string, payload?: any) => void;
  activeProject?: Project | null;
  activeFile?: ProjectFile | null;
  currentCode?: string;
  className?: string;
}

type ChatMode = 'chat' | 'agents' | 'results';

export const ChatPanel: React.FC<ChatPanelProps> = ({
  onExecuteCommand,
  activeProject,
  activeFile,
  currentCode,
  className = ''
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [mode, setMode] = useState<ChatMode>('chat');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [isRunningWorkflow, setIsRunningWorkflow] = useState(false);
  const [workflowResult, setWorkflowResult] = useState<WorkflowResult | null>(null);
  const [workflowMessages, setWorkflowMessages] = useState<WorkflowMessage[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const agents = multiAgentService.getAgents();

  useEffect(() => {
    // Message de bienvenue
    const welcomeMessage: ChatMessage = {
      id: uuidv4(),
      content: '🚀 **Bienvenue dans le système multi-agent !**\n\n' +
        'Je peux vous aider avec une équipe d\'experts IA spécialisés :\n' +
        '• 🏗️ **Architecte** - Conception système\n' +
        '• ⚙️ **Backend Engineer** - APIs et bases de données\n' +
        '• 🎨 **Frontend Engineer** - Interfaces utilisateur\n' +
        '• 🔍 **Code Reviewer** - Qualité et sécurité\n' +
        '• ⚡ **Optimiseur** - Performance\n' +
        '• 🚀 **DevOps** - Déploiement et infrastructure\n\n' +
        'Utilisez l\'onglet "Agents" pour sélectionner vos experts !',
      sender: 'ai',
      timestamp: new Date(),
      type: 'message'
    };
    setMessages([welcomeMessage]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: uuidv4(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date(),
      type: inputMessage.toLowerCase().startsWith('/') ? 'command' : 'message'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      if (userMessage.type === 'command') {
        await handleCommand(inputMessage);
      } else {
        await handleMessage(inputMessage);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        content: '❌ Désolé, une erreur s\'est produite. Veuillez réessayer.',
        sender: 'ai',
        timestamp: new Date(),
        type: 'message'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };
  // Fonction pour afficher les messages WebSocket en temps réel
  const handleWorkflowMessage = (workflowMsg: any) => {
    // Ajouter le message à la liste des messages de workflow
    setWorkflowMessages(prev => [...prev, workflowMsg]);
    
    // Créer un message de chat pour afficher l'activité en temps réel
    if (workflowMsg.agent_name && workflowMsg.message) {
      const realtimeMessage: ChatMessage = {
        id: uuidv4(),
        content: `🤖 **${workflowMsg.agent_name}** - ${workflowMsg.message}${workflowMsg.elapsed ? ` (${workflowMsg.elapsed}s)` : ''}\n${workflowMsg.stage ? `Étape: ${workflowMsg.stage}` : ''}\n${workflowMsg.content ? `\n${workflowMsg.content.substring(0, 200)}${workflowMsg.content.length > 200 ? '...' : ''}` : ''}`,
        sender: 'ai',
        timestamp: new Date(),
        type: 'message'
      };
      setMessages(prev => [...prev, realtimeMessage]);
    }
  };

  const handleMessage = async (message: string) => {
    const lowerMessage = message.toLowerCase();
    
    // Commandes directes qui ne nécessitent pas les agents
    if (lowerMessage.includes('lance le projet') || 
        lowerMessage.includes('démarre') || 
        lowerMessage.includes('run') ||
        lowerMessage.includes('start')) {
      await handleProjectLaunch();
      return;
    }
    
    if (selectedAgents.length === 0) {
      const aiMessage: ChatMessage = {
        id: uuidv4(),
        content: '🤖 Pour obtenir une réponse personnalisée, sélectionnez d\'abord des agents dans l\'onglet "Agents".\n\n' +
          'Ou utilisez les commandes rapides :\n' +
          '• `/brainstorm` - Brainstorming automatique\n' +
          '• `/review` - Review de code\n' +
          '• `/optimize` - Optimisation\n' +
          '• `/help` - Aide complète',
        sender: 'ai',
        timestamp: new Date(),
        type: 'message'
      };
      setMessages(prev => [...prev, aiMessage]);
      return;
    }

    // Lancer le workflow avec les agents sélectionnés
    setIsRunningWorkflow(true);
    try {
      const result = await multiAgentService.runWebsiteCreationWorkflow(
        message,
        handleWorkflowMessage
      );
      
      // Alternative: workflow manuel si pas de WebSocket
      // Fallback si pas de WebSocket
      if (!result || Object.keys(result.results).length === 0) {
        const fallbackResult = await multiAgentService.runWorkflow(
          selectedAgents.length > 0 ? selectedAgents : ['Mike', 'Bob', 'FrontEngineer', 'UIDesigner'],
          message,
          {
            project: activeProject,
            file: activeFile,
            code: currentCode
          }
        );
        setWorkflowResult(fallbackResult);
      } else {
        setWorkflowResult(result);
      }
      
      /* Ancien code
        selectedAgents,
        message,
        {
          project: activeProject,
          file: activeFile,
          code: currentCode
        }
      ); */
      
      setMode('results');
      
      // Exécuter les actions générées par les agents
      if (result) {
        await executeAgentActions(result);
      }
      
      const aiMessage: ChatMessage = {
        id: uuidv4(),
        content: `✅ **Workflow terminé !**\n\n${result?.summary || 'Workflow exécuté avec succès'}\n\n*Consultez l'onglet "Résultats" pour plus de détails.*`,
        sender: 'ai',
        timestamp: new Date(),
        type: 'message'
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Workflow error:', error);
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        content: '❌ Une erreur s\'est produite pendant le workflow. Utilisation du mode fallback...',
        sender: 'ai',
        timestamp: new Date(),
        type: 'message'
      };
      setMessages(prev => [...prev, errorMessage]);
      
      // Fallback vers workflow simple
      try {
        const fallbackResult = await multiAgentService.runWorkflow(
          selectedAgents.length > 0 ? selectedAgents : ['Mike', 'Bob', 'FrontEngineer', 'UIDesigner'],
          message,
          {
            project: activeProject,
            file: activeFile,
            code: currentCode
          }
        );
        setWorkflowResult(fallbackResult);
        setMode('results');
        await executeAgentActions(fallbackResult);
        
        const successMessage: ChatMessage = {
          id: uuidv4(),
          content: `✅ **Workflow fallback terminé !**\n\n${fallbackResult.summary}\n\n*Consultez l'onglet "Résultats" pour plus de détails.*`,
          sender: 'ai',
          timestamp: new Date(),
          type: 'message'
        };
        setMessages(prev => [...prev, successMessage]);
      } catch (fallbackError) {
        console.error('Fallback workflow error:', fallbackError);
        const finalErrorMessage: ChatMessage = {
          id: uuidv4(),
          content: '❌ Impossible d\'exécuter le workflow. Veuillez vérifier votre sélection d\'agents et réessayer.',
          sender: 'ai',
          timestamp: new Date(),
          type: 'message'
        };
        setMessages(prev => [...prev, finalErrorMessage]);
      }
    } finally {
      setIsRunningWorkflow(false);
    }
  };

  const executeAgentActions = async (result: WorkflowResult) => {
    // Parcourir les réponses des agents pour extraire et exécuter les actions
    for (const [agentId, response] of Object.entries(result.results)) {
      await processAgentResponse(agentId, response);
    }
  };

  const processAgentResponse = async (agentId: string, response: any) => {
    const content = response.response || '';
    
    // Extraire et créer les fichiers de code générés
    const codeBlocks = extractCodeBlocks(content);
    
    for (const block of codeBlocks) {
      await createFileFromCodeBlock(block, agentId);
    }
    
    // Traiter les actions spécifiques selon l'agent
    switch (agentId) {
      case 'FrontEngineer':
        await handleFrontendActions(content);
        break;
      case 'BackEngineer':
        await handleBackendActions(content);
        break;
      case 'UIDesigner':
        await handleDesignActions(content);
        break;
      case 'TheOptimizer':
        await handleOptimizationActions(content);
        break;
    }
  };

  const extractCodeBlocks = (content: string) => {
    const codeBlocks = [];
    const regex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      const language = match[1] || 'text';
      const code = match[2].trim();
      
      if (code) {
        // Déterminer le nom du fichier basé sur le langage et le contenu
        const filename = determineFilename(language, code);
        codeBlocks.push({
          language,
          code,
          filename
        });
      }
    }
    
    return codeBlocks;
  };

  const determineFilename = (language: string, code: string) => {
    // Logique pour déterminer le nom du fichier
    if (language === 'html' || code.includes('<!DOCTYPE')) {
      return 'index.html';
    } else if (language === 'css' || code.includes('@import') || code.includes('body {')) {
      return 'styles.css';
    } else if (language === 'javascript' || language === 'js') {
      if (code.includes('import React') || code.includes('function App')) {
        return 'App.jsx';
      }
      return 'script.js';
    } else if (language === 'jsx' || language === 'tsx') {
      if (code.includes('function App') || code.includes('const App')) {
        return 'App.jsx';
      }
      return 'Component.jsx';
    } else if (language === 'python') {
      if (code.includes('from fastapi') || code.includes('FastAPI')) {
        return 'main.py';
      } else if (code.includes('class') && code.includes('Model')) {
        return 'models.py';
      }
      return 'script.py';
    } else if (language === 'sql') {
      return 'schema.sql';
    } else if (language === 'json') {
      if (code.includes('"scripts"') || code.includes('"dependencies"')) {
        return 'package.json';
      }
      return 'data.json';
    }
    
    return `generated_${Date.now()}.${language}`;
  };

  const createFileFromCodeBlock = async (block: any, agentId: string) => {
    if (!activeProject) {
      // Créer un nouveau projet si aucun n'est actif
      const projectName = `Projet_${agentId}_${Date.now()}`;
      await onExecuteCommand?.('create_project', { 
        projectName,
        description: `Projet généré par ${agentId}`
      });
    }
    
    if (activeProject) {
      // Vérifier si le fichier existe déjà
      const existingFile = activeProject.files.find(f => f.name === block.filename);
      
      if (existingFile) {
        // Mettre à jour le fichier existant
        await onExecuteCommand?.('modify_file', {
          fileId: existingFile.id,
          content: block.code
        });
        
        // Message de mise à jour
        const updateMessage: ChatMessage = {
          id: uuidv4(),
          content: `📝 **Fichier mis à jour :** \`${block.filename}\`\n\nCode généré par l'agent et intégré automatiquement.`,
          sender: 'ai',
          timestamp: new Date(),
          type: 'message'
        };
        setMessages(prev => [...prev, updateMessage]);
      } else {
        // Créer un nouveau fichier
        await onExecuteCommand?.('create_file', {
          fileName: block.filename,
          content: block.code,
          language: block.language
        });
        
        // Message de création
        const createMessage: ChatMessage = {
          id: uuidv4(),
          content: `✨ **Nouveau fichier créé :** \`${block.filename}\`\n\nCode généré par l'agent et ajouté au projet.`,
          sender: 'ai',
          timestamp: new Date(),
          type: 'message'
        };
        setMessages(prev => [...prev, createMessage]);
      }
    }
  };

  const handleFrontendActions = async (content: string) => {
    // Actions spécifiques pour l'ingénieur frontend
    if (content.includes('npm install') || content.includes('package.json')) {
      const packages = extractPackages(content);
      for (const pkg of packages) {
        await onExecuteCommand?.('install_package', { packageName: pkg });
      }
    }
  };

  const handleBackendActions = async (content: string) => {
    // Actions spécifiques pour l'ingénieur backend
    if (content.includes('pip install') || content.includes('requirements.txt')) {
      const requirements = extractPythonPackages(content);
      if (requirements.length > 0) {
        await createFileFromCodeBlock({
          filename: 'requirements.txt',
          code: requirements.join('\n'),
          language: 'text'
        }, 'BackEngineer');
      }
    }
  };

  const handleDesignActions = async (content: string) => {
    // Actions spécifiques pour le designer
    if (content.includes('color') || content.includes('#')) {
      // Extraire les couleurs et créer un fichier de variables CSS
      const colors = extractColors(content);
      if (colors.length > 0) {
        const cssVariables = colors.map(color => `  --${color.name}: ${color.value};`).join('\n');
        const cssContent = `:root {\n${cssVariables}\n}`;
        
        await createFileFromCodeBlock({
          filename: 'variables.css',
          code: cssContent,
          language: 'css'
        }, 'UIDesigner');
      }
    }
  };

  const handleOptimizationActions = async (content: string) => {
    // Actions spécifiques pour l'optimiseur
    if (activeFile && content.includes('optimized') || content.includes('improved')) {
      // Remplacer le contenu du fichier actuel par la version optimisée
      const optimizedCode = extractCodeBlocks(content).find(block => 
        block.language === activeFile.language
      );
      
      if (optimizedCode) {
        await onExecuteCommand?.('modify_file', {
          action: 'save',
          content: optimizedCode.code
        });
        
        const optimizeMessage: ChatMessage = {
          id: uuidv4(),
          content: `⚡ **Code optimisé :** \`${activeFile.name}\`\n\nL'optimiseur a amélioré votre code automatiquement.`,
          sender: 'ai',
          timestamp: new Date(),
          type: 'message'
        };
        setMessages(prev => [...prev, optimizeMessage]);
      }
    }
  };

  const extractPackages = (content: string): string[] => {
    const packages = [];
    const npmRegex = /npm install ([^\n]+)/g;
    let match;
    
    while ((match = npmRegex.exec(content)) !== null) {
      const pkgs = match[1].split(' ').filter(p => p && !p.startsWith('-'));
      packages.push(...pkgs);
    }
    
    return packages;
  };

  const extractPythonPackages = (content: string): string[] => {
    const packages = [];
    const pipRegex = /pip install ([^\n]+)/g;
    let match;
    
    while ((match = pipRegex.exec(content)) !== null) {
      const pkgs = match[1].split(' ').filter(p => p && !p.startsWith('-'));
      packages.push(...pkgs);
    }
    
    return packages;
  };

  const extractColors = (content: string): Array<{name: string, value: string}> => {
    const colors = [];
    const colorRegex = /#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})/g;
    const rgbRegex = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/g;
    
    let match;
    let colorIndex = 1;
    
    // Couleurs HEX
    while ((match = colorRegex.exec(content)) !== null) {
      colors.push({
        name: `color-${colorIndex++}`,
        value: match[0]
      });
    }
    
    // Couleurs RGB
    while ((match = rgbRegex.exec(content)) !== null) {
      colors.push({
        name: `color-${colorIndex++}`,
        value: match[0]
      });
    }
    
    return colors;
  };
  
  const handleProjectLaunch = async () => {
    if (!activeProject) {
      const noProjectMessage: ChatMessage = {
        id: uuidv4(),
        content: '❌ **Aucun projet actif**\n\nVeuillez d\'abord créer ou sélectionner un projet.',
        sender: 'ai',
        timestamp: new Date(),
        type: 'message'
      };
      setMessages(prev => [...prev, noProjectMessage]);
      return;
    }
    
    // Analyser le type de projet
    const hasPackageJson = activeProject.files.some(f => f.name === 'package.json');
    const hasMainPy = activeProject.files.some(f => f.name === 'main.py');
    const hasIndexHtml = activeProject.files.some(f => f.name === 'index.html');
    const hasAppJs = activeProject.files.some(f => f.name.includes('App.js') || f.name.includes('App.jsx'));
    
    let projectType = 'unknown';
    let launchCommand = '';
    let description = '';
    
    if (hasPackageJson || hasAppJs) {
      projectType = 'react';
      launchCommand = 'npm run dev';
      description = 'Application React/JavaScript';
    } else if (hasMainPy) {
      projectType = 'python';
      launchCommand = 'python main.py';
      description = 'Application Python';
    } else if (hasIndexHtml) {
      projectType = 'html';
      launchCommand = 'open index.html';
      description = 'Site web statique HTML';
    }
    
    const launchMessage: ChatMessage = {
      id: uuidv4(),
      content: `🚀 **Lancement du projet : ${activeProject.name}**\n\n` +
        `📋 **Type détecté :** ${description}\n` +
        `⚡ **Commande :** \`${launchCommand}\`\n\n` +
        `🔧 **Actions en cours :**\n` +
        `• Ouverture du terminal...\n` +
        `• Exécution de la commande de lancement\n` +
        `• Démarrage de l'application`,
      sender: 'ai',
      timestamp: new Date(),
      type: 'message'
    };
    setMessages(prev => [...prev, launchMessage]);
    
    // Ouvrir le terminal et exécuter la commande
    await onExecuteCommand?.('run_command', {
      command: launchCommand,
      type: 'launch_project',
      projectType
    });
    
    // Message de confirmation
    const successMessage: ChatMessage = {
      id: uuidv4(),
      content: `✅ **Projet lancé avec succès !**\n\n` +
        `🌐 **Votre ${description.toLowerCase()} est maintenant en cours d'exécution.**\n\n` +
        `${projectType === 'react' ? '📱 Ouvrez votre navigateur sur http://localhost:5173' : ''}` +
        `${projectType === 'python' ? '🐍 Vérifiez la sortie dans le terminal pour l\'URL' : ''}` +
        `${projectType === 'html' ? '🌐 Le fichier HTML s\'ouvrira dans votre navigateur' : ''}\n\n` +
        `💡 **Suggestions :**\n` +
        `• Testez les fonctionnalités principales\n` +
        `• Tapez "optimise le code" pour améliorer les performances\n` +
        `• Tapez "corrige les erreurs" si vous voyez des problèmes`,
      sender: 'ai',
      timestamp: new Date(),
      type: 'message'
    };
    setMessages(prev => [...prev, successMessage]);
  };
  const handleCommand = async (command: string) => {
    const cmd = command.toLowerCase().trim();
    
    if (cmd === '/launch' || cmd === '/start' || cmd === '/run') {
      await handleProjectLaunch();
      return;
    }
    
    if (cmd === '/brainstorm') {
      const result = await multiAgentService.brainstormingWorkflow(
        'Brainstorming sur le projet actuel',
        { activeProject, activeFile, currentCode }
      );
      setWorkflowResult(result);
      setMode('results');
    } else if (cmd === '/review') {
      const result = await multiAgentService.runWorkflow(
        ['critique', 'optimiseur'],
        'Review et optimisation du code',
        { activeProject, activeFile, currentCode }
      );
      setWorkflowResult(result);
      setMode('results');
    } else if (cmd === '/optimize') {
      const result = await multiAgentService.runWorkflow(
        ['optimiseur', 'architecte'],
        'Optimisation du code et de l\'architecture',
        { activeProject, activeFile, currentCode }
      );
      setWorkflowResult(result);
      setMode('results');
    } else if (cmd === '/help') {
      const helpMessage: ChatMessage = {
        id: uuidv4(),
        content: '📚 **Commandes disponibles:**\n\n' +
          '• `/brainstorm` - Brainstorming automatique\n' +
          '• `/review` - Review de code\n' +
          '• `/optimize` - Optimisation\n' +
          '• `/help` - Cette aide\n\n' +
          '**Agents disponibles:**\n' +
          agents.map(agent => `• ${agent.icon} **${agent.name}** - ${agent.description}`).join('\n'),
        sender: 'ai',
        timestamp: new Date(),
        type: 'message'
      };
      setMessages(prev => [...prev, helpMessage]);
    }
  };

  const handleRunWorkflow = async () => {
    if (selectedAgents.length === 0) return;
    
    setIsRunningWorkflow(true);
    try {
      const result = await multiAgentService.runWorkflow(
        selectedAgents,
        inputMessage || 'Analyse du projet actuel',
        {
          activeProject,
          activeFile,
          currentCode
        }
      );
      
      setWorkflowResult(result);
      setMode('results');
      
      const aiMessage: ChatMessage = {
        id: uuidv4(),
        content: `✅ **Workflow terminé !**\n\n${result.summary}\n\n*Consultez l'onglet "Résultats" pour plus de détails.*`,
        sender: 'ai',
        timestamp: new Date(),
        type: 'message'
      };
      setMessages(prev => [...prev, aiMessage]);
    } finally {
      setIsRunningWorkflow(false);
    }
  };

  const handleCopyResponse = (content: string) => {
    const aiMessage: ChatMessage = {
      id: uuidv4(),
      content: `📋 **Contenu copié !**\n\n${content.substring(0, 200)}${content.length > 200 ? '...' : ''}`,
      sender: 'ai',
      timestamp: new Date(),
      type: 'message'
    };
    setMessages(prev => [...prev, aiMessage]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    const welcomeMessage: ChatMessage = {
      id: uuidv4(),
      content: '🚀 **Bienvenue dans le système multi-agent !**\n\n' +
        'Je peux vous aider avec une équipe d\'experts IA spécialisés :\n' +
        '• 🏗️ **Architecte** - Conception système\n' +
        '• ⚙️ **Backend Engineer** - APIs et bases de données\n' +
        '• 🎨 **Frontend Engineer** - Interfaces utilisateur\n' +
        '• 🔍 **Code Reviewer** - Qualité et sécurité\n' +
        '• ⚡ **Optimiseur** - Performance\n' +
        '• 🚀 **DevOps** - Déploiement et infrastructure\n\n' +
        'Utilisez l\'onglet "Agents" pour sélectionner vos experts !',
      sender: 'ai',
      timestamp: new Date(),
      type: 'message'
    };
    setMessages([welcomeMessage]);
  };

  const handleCopyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const getMessageIcon = (sender: ChatMessage['sender'], type: ChatMessage['type']) => {
    if (sender === 'ai') {
      return <Bot className="w-5 h-5 text-blue-500" />;
    } else if (type === 'command') {
      return <Command className="w-5 h-5 text-purple-500" />;
    } else {
      return <User className="w-5 h-5 text-green-500" />;
    }
  };

  const formatMessageContent = (content: string) => {
    // Formatage basique pour markdown
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-800 px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/\n/g, '<br />');
  };

  const renderContent = () => {
    switch (mode) {
      case 'agents':
        return (
          <AgentSelector
            agents={agents}
            selectedAgents={selectedAgents}
            onSelectionChange={setSelectedAgents}
            onRunWorkflow={handleRunWorkflow}
            isRunning={isRunningWorkflow}
          />
        );
      case 'results':
        return workflowResult ? (
          <WorkflowResults
            result={workflowResult}
            onCopyResponse={handleCopyResponse}
            onExecuteAction={async (action, payload) => {
              await onExecuteCommand?.(action, payload);
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Aucun résultat disponible</p>
            </div>
          </div>
        );
      default:
        return (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div className={`flex gap-3 max-w-[85%] ${
                    message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}>
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                        {getMessageIcon(message.sender, message.type)}
                      </div>
                    </div>

                    {/* Message Content */}
                    <div className={`flex flex-col ${
                      message.sender === 'user' ? 'items-end' : 'items-start'
                    }`}>
                      <div className={`px-4 py-2 rounded-lg ${
                        message.sender === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-300'
                      }`}>
                        <div 
                          className="text-sm leading-relaxed"
                          dangerouslySetInnerHTML={{ 
                            __html: formatMessageContent(message.content) 
                          }}
                        />
                        
                        {message.metadata?.command && (
                          <div className="mt-2 p-2 bg-gray-700 rounded text-xs">
                            <span className="text-yellow-400">⚡ Commande:</span> {message.metadata.command}
                          </div>
                        )}
                      </div>

                      {/* Message Actions */}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {format(new Date(message.timestamp), 'HH:mm')}
                        </span>
                        
                        <button
                          onClick={() => handleCopyMessage(message.id, message.content)}
                          className="p-1 hover:bg-gray-700 rounded transition-colors"
                          title="Copier le message"
                        >
                          {copiedMessageId === message.id ? (
                            <Check className="w-3 h-3 text-green-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {(isTyping || isRunningWorkflow) && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="bg-gray-800 px-4 py-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm">
                        {isRunningWorkflow ? 'Workflow en cours...' : 'Écriture...'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-700">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Tapez votre message ou commande..."
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isTyping || isRunningWorkflow}
                />
                
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping || isRunningWorkflow}
                  className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span>💡 Conseil: Utilisez "/brainstorm" pour un brainstorming automatique</span>
                <span>⚡ Agents sélectionnés: {selectedAgents.length}</span>
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className={`flex flex-col h-full bg-gray-900 text-gray-300 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-semibold">Multi-Agent IA</h2>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Zap className="w-3 h-3" />
            <span>{selectedAgents.length} agents</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Mode Tabs */}
          <div className="flex items-center bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setMode('chat')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                mode === 'chat' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setMode('agents')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                mode === 'agents' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Agents
            </button>
            <button
              onClick={() => setMode('results')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                mode === 'results' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
              disabled={!workflowResult}
            >
              Résultats
            </button>
          </div>
          
          <button
            onClick={handleClearChat}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title="Effacer le chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  );
};