import { Project, ProjectFile, ExecutionResult } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { apiService } from './api';

export class StorageService {
  private storageKey = 'ai-collaborative-platform';
  private useApi = import.meta.env.VITE_ENABLE_MOCK !== 'true';

  async getProjects(): Promise<Project[]> {
    if (this.useApi) {
      return await apiService.getProjects();
    }
    
    const data = localStorage.getItem(`${this.storageKey}-projects`);
    return data ? JSON.parse(data) : [];
  }

  async saveProject(project: Project): Promise<Project> {
    if (this.useApi) {
      if (project.id) {
        return await apiService.updateProject(project.id, project);
      } else {
        return await apiService.createProject(project);
      }
    }
    
    const projects = this.getProjects();
    const index = projects.findIndex(p => p.id === project.id);
    
    if (index >= 0) {
      projects[index] = { ...project, updatedAt: new Date() };
    } else {
      projects.push({ ...project, createdAt: new Date(), updatedAt: new Date() });
    }
    
    localStorage.setItem(`${this.storageKey}-projects`, JSON.stringify(projects));
    return project;
  }

  async deleteProject(projectId: string): Promise<void> {
    if (this.useApi) {
      return await apiService.deleteProject(projectId);
    }
    
    const projects = this.getProjects().filter(p => p.id !== projectId);
    localStorage.setItem(`${this.storageKey}-projects`, JSON.stringify(projects));
  }

  async getProjectFiles(projectId: string): Promise<ProjectFile[]> {
    if (this.useApi) {
      return await apiService.getProjectFiles(projectId);
    }
    
    const projects = this.getProjects();
    const project = projects.find(p => p.id === projectId);
    return project?.files || [];
  }

  async saveFile(projectId: string, file: ProjectFile): Promise<ProjectFile> {
    if (this.useApi) {
      if (file.id) {
        return await apiService.updateFile(projectId, file.id, file.content);
      } else {
        return await apiService.createFile(projectId, file);
      }
    }
    
    const projects = this.getProjects();
    const project = projects.find(p => p.id === projectId);
    
    if (project) {
      const fileIndex = project.files.findIndex(f => f.id === file.id);
      const updatedFile = {
        ...file,
        lastModified: new Date(),
        version: fileIndex >= 0 ? project.files[fileIndex].version + 1 : 1
      };
      
      if (fileIndex >= 0) {
        project.files[fileIndex] = updatedFile;
      } else {
        project.files.push(updatedFile);
      }
      
      this.saveProject(project);
    }
    return file;
  }

  async deleteFile(projectId: string, fileId: string): Promise<void> {
    if (this.useApi) {
      return await apiService.deleteFile(projectId, fileId);
    }
    
    const projects = this.getProjects();
    const project = projects.find(p => p.id === projectId);
    
    if (project) {
      project.files = project.files.filter(f => f.id !== fileId);
      await this.saveProject(project);
    }
  }

  getExecutionHistory(): ExecutionResult[] {
    const data = localStorage.getItem(`${this.storageKey}-executions`);
    return data ? JSON.parse(data) : [];
  }

  saveExecutionResult(result: ExecutionResult): void {
    const history = this.getExecutionHistory();
    history.unshift(result);
    
    // Garder seulement les 100 dernières exécutions
    if (history.length > 100) {
      history.splice(100);
    }
    
    localStorage.setItem(`${this.storageKey}-executions`, JSON.stringify(history));
  }

  createSampleProject(): Project {
    const project: Project = {
      id: uuidv4(),
      name: 'Projet de démonstration',
      description: 'Un projet exemple avec du code Python',
      language: 'python',
      createdAt: new Date(),
      updatedAt: new Date(),
      isShared: true,
      files: [
        {
          id: uuidv4(),
          name: 'main.py',
          path: '/main.py',
          content: `#!/usr/bin/env python3
"""
Exemple de code Python pour la plateforme collaborative
"""

def fibonacci(n):
    """Calcule la suite de Fibonacci jusqu'à n"""
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

def main():
    print("=== Plateforme IA Collaborative ===")
    print("Calcul de la suite de Fibonacci")
    
    for i in range(10):
        result = fibonacci(i)
        print(f"F({i}) = {result}")
    
    print("\\nExécution terminée avec succès!")

if __name__ == "__main__":
    main()
`,
          language: 'python',
          size: 0,
          lastModified: new Date(),
          version: 1,
          projectId: ''
        }
      ]
    };
    
    project.files[0].projectId = project.id;
    project.files[0].size = project.files[0].content.length;
    
    return project;
  }
}