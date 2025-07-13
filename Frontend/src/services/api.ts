import { Project, ProjectFile, ExecutionResult, User } from '../types';

export class ApiService {
  private baseUrl: string;
  private wsUrl: string;
  private enableMock: boolean;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    this.wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';
    this.enableMock = import.meta.env.VITE_ENABLE_MOCK !== 'false';
  }

  // Projects API
  async getProjects(): Promise<Project[]> {
    if (this.enableMock) {
      return this.getMockProjects();
    }
    
    const response = await fetch(`${this.baseUrl}/api/projects`);
    if (!response.ok) throw new Error('Failed to fetch projects');
    return await response.json();
  }

  async createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    if (this.enableMock) {
      return this.createMockProject(project);
    }

    const response = await fetch(`${this.baseUrl}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project)
    });
    
    if (!response.ok) throw new Error('Failed to create project');
    return await response.json();
  }

  async updateProject(id: string, project: Partial<Project>): Promise<Project> {
    if (this.enableMock) {
      return this.updateMockProject(id, project);
    }

    const response = await fetch(`${this.baseUrl}/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project)
    });
    
    if (!response.ok) throw new Error('Failed to update project');
    return await response.json();
  }

  async deleteProject(id: string): Promise<void> {
    if (this.enableMock) {
      return this.deleteMockProject(id);
    }

    const response = await fetch(`${this.baseUrl}/api/projects/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) throw new Error('Failed to delete project');
  }

  // Files API
  async getProjectFiles(projectId: string): Promise<ProjectFile[]> {
    if (this.enableMock) {
      return this.getMockFiles(projectId);
    }

    const response = await fetch(`${this.baseUrl}/api/projects/${projectId}/files`);
    if (!response.ok) throw new Error('Failed to fetch files');
    return await response.json();
  }

  async createFile(projectId: string, file: Omit<ProjectFile, 'id' | 'lastModified' | 'version'>): Promise<ProjectFile> {
    if (this.enableMock) {
      return this.createMockFile(projectId, file);
    }

    const response = await fetch(`${this.baseUrl}/api/projects/${projectId}/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(file)
    });
    
    if (!response.ok) throw new Error('Failed to create file');
    return await response.json();
  }

  async updateFile(projectId: string, fileId: string, content: string): Promise<ProjectFile> {
    if (this.enableMock) {
      return this.updateMockFile(projectId, fileId, content);
    }

    const response = await fetch(`${this.baseUrl}/api/projects/${projectId}/files/${fileId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    
    if (!response.ok) throw new Error('Failed to update file');
    return await response.json();
  }

  async deleteFile(projectId: string, fileId: string): Promise<void> {
    if (this.enableMock) {
      return this.deleteMockFile(projectId, fileId);
    }

    const response = await fetch(`${this.baseUrl}/api/projects/${projectId}/files/${fileId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) throw new Error('Failed to delete file');
  }

  // Code Execution API
  async executeCode(code: string, language: string): Promise<ExecutionResult> {
    if (this.enableMock) {
      return this.executeMockCode(code, language);
    }

    const response = await fetch(`${this.baseUrl}/api/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language })
    });
    
    if (!response.ok) throw new Error('Failed to execute code');
    return await response.json();
  }

  async stopExecution(executionId: string): Promise<void> {
    if (this.enableMock) {
      return;
    }

    const response = await fetch(`${this.baseUrl}/api/execute/${executionId}/stop`, {
      method: 'POST'
    });
    
    if (!response.ok) throw new Error('Failed to stop execution');
  }

  // WebSocket Connection
  createWebSocket(userId: string): WebSocket {
    if (this.enableMock) {
      // Return mock WebSocket for development
      return this.createMockWebSocket();
    }

    const ws = new WebSocket(`${this.wsUrl}?userId=${userId}`);
    return ws;
  }

  // Mock Methods (for development without backend)
  private getMockProjects(): Promise<Project[]> {
    // Return mock data from localStorage or static data
    return Promise.resolve([]);
  }

  private createMockProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const mockProject: Project = {
      ...project,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return Promise.resolve(mockProject);
  }

  private updateMockProject(id: string, project: Partial<Project>): Promise<Project> {
    // Mock implementation
    return Promise.resolve({ ...project, id, updatedAt: new Date() } as Project);
  }

  private deleteMockProject(id: string): Promise<void> {
    return Promise.resolve();
  }

  private getMockFiles(projectId: string): Promise<ProjectFile[]> {
    return Promise.resolve([]);
  }

  private createMockFile(projectId: string, file: Omit<ProjectFile, 'id' | 'lastModified' | 'version'>): Promise<ProjectFile> {
    const mockFile: ProjectFile = {
      ...file,
      id: Date.now().toString(),
      lastModified: new Date(),
      version: 1
    };
    return Promise.resolve(mockFile);
  }

  private updateMockFile(projectId: string, fileId: string, content: string): Promise<ProjectFile> {
    return Promise.resolve({
      id: fileId,
      content,
      lastModified: new Date(),
      version: 1
    } as ProjectFile);
  }

  private deleteMockFile(projectId: string, fileId: string): Promise<void> {
    return Promise.resolve();
  }

  private executeMockCode(code: string, language: string): Promise<ExecutionResult> {
    // Use existing mock execution
    return Promise.resolve({
      id: Date.now().toString(),
      code,
      output: 'Mock execution result',
      errors: '',
      duration: 1000,
      timestamp: new Date(),
      language,
      status: 'success'
    });
  }

  private createMockWebSocket(): WebSocket {
    // Create a mock WebSocket that doesn't actually connect
    const mockWs = {
      readyState: WebSocket.CONNECTING,
      send: () => {},
      close: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
      onopen: null,
      onclose: null,
      onmessage: null,
      onerror: null
    };
    
    // Simulate connection after a short delay
    setTimeout(() => {
      mockWs.readyState = WebSocket.OPEN;
      if (mockWs.onopen) mockWs.onopen({} as Event);
    }, 100);
    
    return mockWs as any;
  }
}

export const apiService = new ApiService();