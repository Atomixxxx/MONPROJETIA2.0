import React from 'react';
import { ProjectFile, ExecutionResult, EditorSettings } from '../types';
import { MonacoEditor } from './MonacoEditor';
import { ExecutionPanel } from './ExecutionPanel';
import { Play, Save, PanelLeft, PanelLeftClose, FileText } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface EditorPanelProps {
  file: ProjectFile | null;
  settings: EditorSettings;
  executionResults: ExecutionResult[];
  isExecuting: boolean;
  sidebarVisible: boolean;
  onCodeChange: (newCode: string) => void;
  onSave: () => void;
  onExecute: () => void;
  onToggleSidebar: () => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
  file,
  settings,
  executionResults,
  isExecuting,
  sidebarVisible,
  onCodeChange,
  onSave,
  onExecute,
  onToggleSidebar,
}) => {
  return (
    <div className="flex flex-col h-full bg-gray-800">
      {/* Barre d'outils de l'éditeur */}
      <div className="flex items-center justify-between p-2 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Tooltip content="Afficher/Masquer l'explorateur">
            <button onClick={onToggleSidebar} className="p-1 hover:bg-gray-700 rounded transition-colors">
              {sidebarVisible ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
            </button>
          </Tooltip>
          {file ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <FileText size={16} />
              <span>{file.name}</span>
            </div>
          ) : (
            <span className="text-sm text-gray-500">Aucun fichier sélectionné</span>
          )}
        </div>
      </div>

      {/* Éditeur de code */}
      <div className="flex-1 relative min-h-0">
        <MonacoEditor 
          file={file}
          settings={settings}
          onContentChange={onCodeChange}
          onSave={onSave}
        />
      </div>

      {/* Console d'exécution */}
      <div className="h-80 border-t border-gray-700">
        <ExecutionPanel results={executionResults} />
      </div>
    </div>
  );
};
