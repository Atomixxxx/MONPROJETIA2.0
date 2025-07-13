import React, { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { ProjectFile, EditorSettings } from '../types';
import { useAutoSave } from '../hooks/useAutoSave';
import { Save, RotateCcw } from 'lucide-react';

interface MonacoEditorProps {
  file: ProjectFile | null;
  onContentChange: (content: string) => void;
  onSave: (content: string) => void;
  settings: EditorSettings;
  className?: string;
}

export const MonacoEditor: React.FC<MonacoEditorProps> = ({
  file,
  onContentChange,
  onSave,
  settings,
  className = ''
}) => {
  const [content, setContent] = useState('');
  const [isModified, setIsModified] = useState(false);
  const editorRef = useRef<any>(null);
  const { saveNow } = useAutoSave(file, content, onSave, settings.autoSaveInterval);

  useEffect(() => {
    if (file) {
      setContent(file.content);
      setIsModified(false);
    }
  }, [file]);

  const handleEditorChange = (value: string | undefined) => {
    const newContent = value || '';
    setContent(newContent);
    setIsModified(newContent !== (file?.content || ''));
    onContentChange(newContent);
  };

  const handleSave = () => {
    saveNow();
    setIsModified(false);
  };

  const handleRevert = () => {
    if (file) {
      setContent(file.content);
      setIsModified(false);
    }
  };

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    
    // Raccourcis clavier
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });
  };

  if (!file) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-900 text-gray-400 ${className}`}>
        <div className="text-center">
          <div className="text-6xl mb-4">📝</div>
          <p className="text-lg">Sélectionnez un fichier pour commencer</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Barre d'outils */}
      <div className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-300">{file.name}</span>
          {isModified && (
            <span className="w-2 h-2 bg-orange-500 rounded-full" title="Fichier modifié" />
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleRevert}
            disabled={!isModified}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Annuler les modifications"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleSave}
            disabled={!isModified}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Sauvegarder (Ctrl+S)"
          >
            <Save className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Éditeur */}
      <div className="flex-1">
        <Editor
          value={content}
          language={file.language}
          theme={settings.theme}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            fontSize: settings.fontSize,
            wordWrap: settings.wordWrap ? 'on' : 'off',
            lineNumbers: settings.lineNumbers ? 'on' : 'off',
            minimap: {
              enabled: settings.minimap
            },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            roundedSelection: false,
            readOnly: false,
            cursorStyle: 'line',
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
            renderLineHighlight: 'all',
            selectOnLineNumbers: true,
            matchBrackets: 'always',
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            formatOnPaste: true,
            formatOnType: true,
            folding: true,
            foldingStrategy: 'indentation',
            showFoldingControls: 'always',
            tabSize: 2,
            insertSpaces: true,
            detectIndentation: true,
            trimAutoWhitespace: true,
            acceptSuggestionOnEnter: 'on',
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            parameterHints: { enabled: true },
            hover: { enabled: true },
            contextmenu: true,
            mouseWheelZoom: true,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on'
          }}
        />
      </div>
    </div>
  );
};