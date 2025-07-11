import React, { useState } from 'react';
import { WorkflowResult, AgentResponse } from '../services/multiAgentService';
import { 
  Brain, 
  Clock, 
  Target, 
  TrendingUp, 
  Copy, 
  Check,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  AlertCircle,
  Code
} from 'lucide-react';

interface WorkflowResultsProps {
  result: WorkflowResult;
  onCopyResponse: (content: string) => void;
  onExecuteAction?: (action: string, payload?: any) => void;
  className?: string;
}

export const WorkflowResults: React.FC<WorkflowResultsProps> = ({
  result,
  onCopyResponse,
  onExecuteAction,
  className = ''
}) => {
  const [expandedAgents, setExpandedAgents] = useState<string[]>([]);
  const [copiedContent, setCopiedContent] = useState<string | null>(null);

  const toggleAgentExpansion = (agentId: string) => {
    setExpandedAgents(prev =>
      prev.includes(agentId)
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  const handleCopy = async (content: string, type: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedContent(type);
      onCopyResponse(content);
      setTimeout(() => setCopiedContent(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleExecuteCode = async (code: string, language: string, filename: string) => {
    if (onExecuteAction) {
      await onExecuteAction('create_file', {
        fileName: filename,
        content: code,
        language
      });
    }
  };

  const extractCodeFromResponse = (response: string) => {
    const codeBlocks = [];
    const regex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    
    while ((match = regex.exec(response)) !== null) {
      const language = match[1] || 'text';
      const code = match[2].trim();
      if (code) {
        codeBlocks.push({ language, code });
      }
    }
    
    return codeBlocks;
  };
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'Haute';
    if (confidence >= 0.6) return 'Moyenne';
    return 'Faible';
  };

  const agents = Object.entries(result.results);
  const totalExecutionTime = agents.reduce((acc, [_, response]) => acc + response.executionTime, 0);
  const avgConfidence = agents.reduce((acc, [_, response]) => acc + response.confidence, 0) / agents.length;

  return (
    <div className={`flex flex-col h-full bg-gray-900 text-gray-300 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-3 border-b border-gray-700 flex-shrink-0 bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            <h2 className="text-base font-semibold">Résultats du Workflow</h2>
          </div>
          
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{totalExecutionTime.toFixed(0)}ms</span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              <span className={getConfidenceColor(avgConfidence)}>
                {getConfidenceText(avgConfidence)} ({(avgConfidence * 100).toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gray-700 p-2 rounded mb-2">
          <h3 className="text-sm font-medium mb-1 flex items-center gap-2">
            <TrendingUp className="w-3 h-3 text-green-400" />
            Résumé
          </h3>
          <p className="text-xs text-gray-300 leading-relaxed">{result.summary}</p>
          
          <button
            onClick={() => handleCopy(result.summary, 'summary')}
            className="mt-1 flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
          >
            {copiedContent === 'summary' ? (
              <Check className="w-2 h-2 text-green-400" />
            ) : (
              <Copy className="w-2 h-2" />
            )}
            Copier
          </button>
        </div>

        {/* Recommendations */}
        <div className="bg-gray-700 p-2 rounded">
          <h3 className="text-sm font-medium mb-1 flex items-center gap-2">
            <Lightbulb className="w-3 h-3 text-yellow-400" />
            Recommandations
          </h3>
          <ul className="space-y-1">
            {result.recommendations.map((rec, index) => (
              <li key={index} className="text-xs text-gray-300 flex items-start gap-1 leading-tight">
                <span className="text-yellow-400 mt-1">•</span>
                {rec}
              </li>
            ))}
          </ul>
          
          <button
            onClick={() => handleCopy(result.recommendations.join('\n'), 'recommendations')}
            className="mt-1 flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
          >
            {copiedContent === 'recommendations' ? (
              <Check className="w-2 h-2 text-green-400" />
            ) : (
              <Copy className="w-2 h-2" />
            )}
            Copier
          </button>
        </div>
      </div>

      {/* Agent Responses */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-2">
          {agents.map(([agentId, response]) => (
            <AgentResponseCard
              key={agentId}
              agentId={agentId}
              response={response}
              isExpanded={expandedAgents.includes(agentId)}
              onToggleExpand={() => toggleAgentExpansion(agentId)}
              onCopy={handleCopy}
              copiedContent={copiedContent}
              onExecuteCode={handleExecuteCode}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const AgentResponseCard: React.FC<{
  agentId: string;
  response: AgentResponse;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onCopy: (content: string, type: string) => void;
  copiedContent: string | null;
  onExecuteCode: (code: string, language: string, filename: string) => void;
}> = ({ agentId, response, isExpanded, onToggleExpand, onCopy, copiedContent }) => {
  const getAgentIcon = (agentId: string) => {
    const icons: Record<string, string> = {
      architecte: '🏗️',
      backend_engineer: '⚙️',
      frontend_engineer: '🎨',
      designer_ui_ux: '✨',
      database_specialist: '🗃️',
      deployer_devops: '🚀',
      optimiseur: '⚡',
      critique: '🔍',
      seo_content_expert: '📈',
      visionnaire: '🔮',
      ingenieur: '🔧',
      translator_agent: '🌍',
      Mike: '🔮',
      Bob: '🏗️',
      FrontEngineer: '🎨',
      BackEngineer: '⚙️',
      UIDesigner: '✨',
      SEOCopty: '📈',
      DBMaster: '🗃️',
      DevOpsGuy: '🚀',
      TheCritique: '🔍',
      TheOptimizer: '⚡',
      TranslatorBot: '🌍'
    };
    return icons[agentId] || '🤖';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const extractCodeBlocks = (content: string) => {
    const codeBlocks = [];
    const regex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      const language = match[1] || 'text';
      const code = match[2].trim();
      if (code) {
        codeBlocks.push({ language, code });
      }
    }
    
    return codeBlocks;
  };

  const determineFilename = (language: string, code: string) => {
    if (language === 'html' || code.includes('<!DOCTYPE')) {
      return 'index.html';
    } else if (language === 'css') {
      return 'styles.css';
    } else if (language === 'javascript' || language === 'js') {
      if (code.includes('import React') || code.includes('function App')) {
        return 'App.jsx';
      }
      return 'script.js';
    } else if (language === 'jsx') {
      return 'App.jsx';
    } else if (language === 'python') {
      if (code.includes('from fastapi') || code.includes('FastAPI')) {
        return 'main.py';
      }
      return 'script.py';
    } else if (language === 'sql') {
      return 'schema.sql';
    } else if (language === 'json') {
      return 'package.json';
    }
    return `generated.${language}`;
  };

  const codeBlocks = extractCodeBlocks(response.response);
  return (
    <div className="bg-gray-800 rounded border border-gray-600">
      {/* Header */}
      <div 
        className="p-2 cursor-pointer hover:bg-gray-700 transition-colors border-b border-gray-600/50"
        onClick={onToggleExpand}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">{getAgentIcon(agentId)}</span>
            <div>
              <h3 className="font-medium text-white text-sm">{response.agent}</h3>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span>{response.executionTime.toFixed(0)}ms</span>
                <span className={getConfidenceColor(response.confidence)}>
                  {(response.confidence * 100).toFixed(1)}% confiance
                </span>
                {codeBlocks.length > 0 && (
                  <span className="text-blue-300">
                    {codeBlocks.length} bloc{codeBlocks.length > 1 ? 's' : ''} de code
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCopy(response.response, `agent-${agentId}`);
              }}
              className="p-1 hover:bg-gray-600 rounded transition-colors"
              title="Copier la réponse"
            >
              {copiedContent === `agent-${agentId}` ? (
                <Check className="w-3 h-3 text-green-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
            
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-2 space-y-2">
          {/* Thought Process */}
          <div className="p-2 bg-gray-700/60 rounded border-l-2 border-purple-500">
            <h4 className="text-xs font-medium text-gray-300 mb-1 flex items-center gap-1">
              <Brain className="w-3 h-3" />
              Processus de réflexion
            </h4>
            <p className="text-xs text-gray-300 italic leading-tight">{response.thought}</p>
          </div>

          {/* Code Blocks with Execute buttons */}
          {codeBlocks.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-gray-300 flex items-center gap-1">
                <Code className="w-3 h-3" />
                Code généré ({codeBlocks.length} fichier{codeBlocks.length > 1 ? 's' : ''})
              </h4>
              {codeBlocks.map((block, index) => {
                const filename = determineFilename(block.language, block.code);
                return (
                  <div key={index} className="bg-gray-900 rounded border border-gray-600">
                    <div className="flex items-center justify-between p-2 border-b border-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-gray-700 px-1 py-0.5 rounded">{block.language}</span>
                        <span className="text-xs text-gray-300">{filename}</span>
                      </div>
                      <button
                        onClick={() => onExecuteCode(block.code, block.language, filename)}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                      >
                        📁 Créer
                      </button>
                    </div>
                    <pre className="p-2 text-xs text-gray-200 overflow-x-auto max-h-32 overflow-y-auto font-mono">
                      <code>{block.code}</code>
                    </pre>
                  </div>
                );
              })}
            </div>
          )}
          {/* Response */}
          <div>
            <h4 className="text-xs font-medium text-gray-300 mb-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Réponse
            </h4>
            <div className="bg-gray-900 p-2 rounded border border-gray-600 max-h-48 overflow-y-auto">
              <div 
                className="text-xs text-gray-200 leading-tight whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ 
                  __html: response.response
                    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em class="text-blue-300">$1</em>')
                    .replace(/`(.*?)`/g, '<code class="bg-gray-800 px-1 py-0.5 rounded text-green-300">$1</code>')
                    .replace(/###\s*(.*?)$/gm, '<h3 class="text-sm font-bold text-white mt-2 mb-1">$1</h3>')
                    .replace(/##\s*(.*?)$/gm, '<h2 class="text-sm font-bold text-white mt-2 mb-1">$1</h2>')
                    .replace(/•\s*(.*?)$/gm, '<li class="ml-4 text-gray-300">• $1</li>')
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};