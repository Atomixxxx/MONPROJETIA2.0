import React, { useState } from 'react';
import { ExecutionResult } from '../types';
import { Play, Square, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface ExecutionPanelProps {
  onExecute: (code: string, language: string) => Promise<void>;
  onStop: () => void;
  currentCode: string;
  currentLanguage: string;
  isExecuting: boolean;
  results: ExecutionResult[];
  className?: string;
}

export const ExecutionPanel: React.FC<ExecutionPanelProps> = ({
  onExecute,
  onStop,
  currentCode,
  currentLanguage,
  isExecuting,
  results,
  className = ''
}) => {
  const [selectedResult, setSelectedResult] = useState<ExecutionResult | null>(null);

  const handleExecute = () => {
    if (currentCode.trim()) {
      onExecute(currentCode, currentLanguage);
    }
  };

  const getStatusIcon = (status: ExecutionResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'timeout':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: ExecutionResult['status']) => {
    switch (status) {
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      case 'timeout':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className={`flex flex-col h-full bg-gray-900 text-gray-300 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Exécution</h2>
          <div className="flex items-center gap-2">
            {isExecuting ? (
              <button
                onClick={onStop}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                <Square className="w-4 h-4" />
                Arrêter
              </button>
            ) : (
              <button
                onClick={handleExecute}
                disabled={!currentCode.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4" />
                Exécuter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex">
        {/* Results List */}
        <div className="w-1/3 border-r border-gray-700 overflow-y-auto">
          {results.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <Play className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Aucune exécution</p>
            </div>
          ) : (
            <div className="p-2">
              {results.map((result) => (
                <div
                  key={result.id}
                  className={`p-3 mb-2 rounded cursor-pointer border transition-colors ${
                    selectedResult?.id === result.id
                      ? 'bg-gray-800 border-gray-600'
                      : 'bg-gray-850 border-gray-700 hover:bg-gray-800'
                  }`}
                  onClick={() => setSelectedResult(result)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(result.status)}
                    <span className="text-sm font-medium">
                      {result.language}
                    </span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(result.timestamp), 'HH:mm:ss')}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${getStatusColor(result.status)}`}>
                      {result.status.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">
                      {result.duration}ms
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Result Details */}
        <div className="flex-1 flex flex-col">
          {selectedResult ? (
            <>
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(selectedResult.status)}
                  <span className="font-medium">
                    Résultat d'exécution
                  </span>
                  <span className="text-sm text-gray-500">
                    {format(new Date(selectedResult.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                  </span>
                </div>
                <div className="text-sm text-gray-400">
                  Durée: {selectedResult.duration}ms | Langue: {selectedResult.language}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {/* Output */}
                {selectedResult.output && (
                  <div className="p-4 border-b border-gray-700">
                    <h3 className="text-sm font-medium mb-2 text-green-400">Sortie</h3>
                    <pre className="text-sm bg-gray-800 p-3 rounded overflow-x-auto">
                      {selectedResult.output}
                    </pre>
                  </div>
                )}

                {/* Errors */}
                {selectedResult.errors && (
                  <div className="p-4 border-b border-gray-700">
                    <h3 className="text-sm font-medium mb-2 text-red-400">Erreurs</h3>
                    <pre className="text-sm bg-red-900/20 p-3 rounded overflow-x-auto text-red-300">
                      {selectedResult.errors}
                    </pre>
                  </div>
                )}

                {/* Code */}
                <div className="p-4">
                  <h3 className="text-sm font-medium mb-2 text-blue-400">Code exécuté</h3>
                  <pre className="text-sm bg-gray-800 p-3 rounded overflow-x-auto">
                    {selectedResult.code}
                  </pre>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-2">🚀</div>
                <p>Sélectionnez un résultat d'exécution</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};