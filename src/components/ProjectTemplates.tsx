import React, { useState } from 'react';
import { ProjectTemplate } from '../types';
import { TemplateService } from '../services/templates';
import { X, Search, Folder, Code, Globe, Server } from 'lucide-react';

interface ProjectTemplatesProps {
  onSelectTemplate: (template: ProjectTemplate, name: string) => void;
  onClose: () => void;
}

export const ProjectTemplates: React.FC<ProjectTemplatesProps> = ({
  onSelectTemplate,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [projectName, setProjectName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  
  const templateService = new TemplateService();
  const templates = templateService.getTemplates();

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateProject = () => {
    if (selectedTemplate && projectName.trim()) {
      onSelectTemplate(selectedTemplate, projectName.trim());
      onClose();
    }
  };

  const getTemplateIcon = (language: string) => {
    switch (language) {
      case 'typescript':
      case 'javascript':
        return <Code className="w-8 h-8" />;
      case 'python':
        return <Server className="w-8 h-8" />;
      case 'html':
        return <Globe className="w-8 h-8" />;
      default:
        return <Folder className="w-8 h-8" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">🚀 Nouveau Projet</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex h-96">
          {/* Templates List */}
          <div className="w-1/2 p-6 border-r border-gray-700">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher un template..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                />
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                    selectedTemplate?.id === template.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{template.icon}</div>
                    <div>
                      <h3 className="font-medium">{template.name}</h3>
                      <p className="text-sm opacity-75">{template.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Template Details */}
          <div className="w-1/2 p-6">
            {selectedTemplate ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{selectedTemplate.icon}</div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedTemplate.name}</h3>
                    <p className="text-gray-400">{selectedTemplate.description}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-white mb-2">📁 Fichiers inclus:</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {selectedTemplate.files.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-400">
                        <span>📄</span>
                        <span>{file.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedTemplate.packages && (
                  <div>
                    <h4 className="font-medium text-white mb-2">📦 Dépendances:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTemplate.packages.map((pkg, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs"
                        >
                          {pkg}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nom du projet
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Mon Super Projet"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                    autoFocus
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <Folder className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Sélectionnez un template</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700">
          <div className="text-sm text-gray-400">
            {selectedTemplate && (
              <span>
                🎯 Langage: <strong>{selectedTemplate.language}</strong>
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Annuler
            </button>
            
            <button
              onClick={handleCreateProject}
              disabled={!selectedTemplate || !projectName.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Créer le projet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};