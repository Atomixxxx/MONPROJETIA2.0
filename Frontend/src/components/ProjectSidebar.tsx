import React, { useState } from 'react';
import { Project, ProjectFile } from '../types';
import { 
  Folder, 
  FolderOpen, 
  File, 
  Plus, 
  Trash2, 
  Edit, 
  Share2,
  Settings
} from 'lucide-react';

interface ProjectSidebarProps {
  projects: Project[];
  activeProject: Project | null;
  activeFile: ProjectFile | null;
  onProjectSelect: (project: Project) => void;
  onFileSelect: (file: ProjectFile) => void;
  onCreateProject: () => void;
  onCreateFile: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onDeleteFile: (projectId: string, fileId: string) => void;
  className?: string;
}

export const ProjectSidebar: React.FC<ProjectSidebarProps> = ({
  projects,
  activeProject,
  activeFile,
  onProjectSelect,
  onFileSelect,
  onCreateProject,
  onCreateFile,
  onDeleteProject,
  onDeleteFile,
  className = ''
}) => {
  const [expandedProjects, setExpandedProjects] = useState<string[]>([]);

  const toggleProjectExpansion = (projectId: string) => {
    setExpandedProjects(prev => 
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const getFileIcon = (language: string) => {
    switch (language) {
      case 'python': return '🐍';
      case 'javascript': return '📜';
      case 'typescript': return '📘';
      default: return '📄';
    }
  };

  return (
    <div className={`flex flex-col h-full bg-gray-900 text-gray-300 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Projets</h2>
          <button
            onClick={onCreateProject}
            className="p-2 hover:bg-gray-800 rounded transition-colors"
            title="Nouveau projet"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto">
        {projects.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <Folder className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Aucun projet</p>
            <button
              onClick={onCreateProject}
              className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
            >
              Créer un projet
            </button>
          </div>
        ) : (
          <div className="p-2">
            {projects.map((project) => {
              const isExpanded = expandedProjects.includes(project.id);
              const isActive = activeProject?.id === project.id;
              
              return (
                <div key={project.id} className="mb-2">
                  {/* Project Header */}
                  <div
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-800 ${
                      isActive ? 'bg-gray-800 text-white' : ''
                    }`}
                    onClick={() => onProjectSelect(project)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleProjectExpansion(project.id);
                      }}
                      className="p-1 hover:bg-gray-700 rounded"
                    >
                      {isExpanded ? (
                        <FolderOpen className="w-4 h-4" />
                      ) : (
                        <Folder className="w-4 h-4" />
                      )}
                    </button>
                    
                    <span className="flex-1 truncate text-sm font-medium">
                      {project.name}
                    </span>
                    
                    {project.isShared && (
                      <Share2 className="w-3 h-3 text-green-500" />
                    )}
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCreateFile(project.id);
                        }}
                        className="p-1 hover:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Nouveau fichier"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteProject(project.id);
                        }}
                        className="p-1 hover:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity text-red-400"
                        title="Supprimer projet"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Files List */}
                  {isExpanded && (
                    <div className="ml-6 mt-1">
                      {project.files.map((file) => (
                        <div
                          key={file.id}
                          className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-800 group ${
                            activeFile?.id === file.id ? 'bg-gray-800 text-white' : ''
                          }`}
                          onClick={() => onFileSelect(file)}
                        >
                          <span className="text-sm">
                            {getFileIcon(file.language)}
                          </span>
                          <span className="flex-1 truncate text-sm">
                            {file.name}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteFile(project.id, file.id);
                            }}
                            className="p-1 hover:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity text-red-400"
                            title="Supprimer fichier"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      
                      <button
                        onClick={() => onCreateFile(project.id)}
                        className="flex items-center gap-2 p-2 w-full rounded hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="text-sm">Nouveau fichier</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="p-4 border-t border-gray-700">
        <button className="flex items-center gap-2 p-2 w-full rounded hover:bg-gray-800 transition-colors">
          <Settings className="w-4 h-4" />
          <span className="text-sm">Paramètres</span>
        </button>
      </div>
    </div>
  );
};