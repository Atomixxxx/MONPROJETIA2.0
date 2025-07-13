export interface Project {
  id: string;
  name: string;
  description: string;
  language: 'python' | 'javascript' | 'typescript';
  createdAt: Date;
  updatedAt: Date;
  files: ProjectFile[];
  isShared: boolean;
}

export interface ProjectFile {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  size: number;
  lastModified: Date;
  version: number;
  projectId: string;
}

export interface WebSocketMessage {
  type: 'code_change' | 'file_save' | 'execution_result' | 'heartbeat' | 'user_join' | 'user_leave';
  payload: any;
  timestamp: number;
  userId: string;
}

export interface ExecutionResult {
  id: string;
  code: string;
  output: string;
  errors: string;
  duration: number;
  timestamp: Date;
  language: string;
  status: 'success' | 'error' | 'timeout';
}

export interface User {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
  lastSeen: Date;
}

export interface EditorSettings {
  theme: 'vs-dark' | 'vs-light';
  fontSize: number;
  wordWrap: boolean;
  lineNumbers: boolean;
  minimap: boolean;
  autoSave: boolean;
  autoSaveInterval: number;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type: 'message' | 'command' | 'system';
  metadata?: {
    command?: string;
    parameters?: any;
    executionResult?: ExecutionResult;
  };
}

export interface AIResponse {
  message: string;
  action?: {
    type: 'create_file' | 'execute_code' | 'modify_file' | 'create_project' | 'system_info' | 'install_package' | 'run_command' | 'deploy_app';
    payload?: any;
  };
}

export interface MultiAgentContext {
  activeProject?: Project | null;
  activeFile?: ProjectFile | null;
  currentCode?: string;
  userInput?: string;
  capabilities?: string[];
}

export interface Terminal {
  id: string;
  name: string;
  isActive: boolean;
  history: string[];
  currentDirectory: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  language: string;
  icon: string;
  files: {
    name: string;
    content: string;
    language: string;
  }[];
  packages?: string[];
}

export interface PackageManager {
  language: string;
  command: string;
  installCommand: string;
  packages: string[];
}

export interface WorkflowMessage {
  type: string;
  agent_name?: string;
  agent?: string;
  role?: string;
  stage?: string;
  message: string;
  content?: string;
  elapsed?: number; // en secondes
  timestamp: string;
}