import React, { useState } from 'react';
import { Agent } from '../services/multiAgentService';
import { Check, Brain, Zap, Users } from 'lucide-react';

interface AgentSelectorProps {
  agents: Agent[];
  selectedAgents: string[];
  onSelectionChange: (selectedAgents: string[]) => void;
  onRunWorkflow: () => void;
  isRunning: boolean;
  className?: string;
}

export const AgentSelector: React.FC<AgentSelectorProps> = ({
  agents,
  selectedAgents,
  onSelectionChange,
  onRunWorkflow,
  isRunning,
  className = ''
}) => {
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const handleAgentToggle = (agentId: string) => {
    if (selectedAgents.includes(agentId)) {
      onSelectionChange(selectedAgents.filter(id => id !== agentId));
    } else {
      onSelectionChange([...selectedAgents, agentId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedAgents.length === agents.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(agents.map(agent => agent.id));
    }
  };

  const handleSelectByCapability = (capability: string) => {
    const relevantAgents = agents.filter(agent => 
      agent.capabilities.includes(capability)
    ).map(agent => agent.id);
    
    onSelectionChange(relevantAgents);
  };

  const capabilityGroups = [
    { name: 'Développement', capability: 'frontend', icon: '💻', color: 'bg-blue-100 text-blue-800' },
    { name: 'Architecture', capability: 'architecture', icon: '🏗️', color: 'bg-green-100 text-green-800' },
    { name: 'Qualité', capability: 'code_review', icon: '🔍', color: 'bg-yellow-100 text-yellow-800' },
    { name: 'Performance', capability: 'performance', icon: '⚡', color: 'bg-red-100 text-red-800' }
  ];

  return (
    <div className={`flex flex-col h-full bg-gray-900 text-gray-300 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-semibold">Agents IA</h2>
            <span className="text-sm text-gray-500">
              ({selectedAgents.length}/{agents.length})
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView(view === 'grid' ? 'list' : 'grid')}
              className="p-2 hover:bg-gray-800 rounded transition-colors"
              title="Changer la vue"
            >
              {view === 'grid' ? '📋' : '⊞'}
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={handleSelectAll}
            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-full text-sm transition-colors"
          >
            {selectedAgents.length === agents.length ? 'Tout désélectionner' : 'Tout sélectionner'}
          </button>
          
          {capabilityGroups.map((group) => (
            <button
              key={group.capability}
              onClick={() => handleSelectByCapability(group.capability)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${group.color}`}
            >
              {group.icon} {group.name}
            </button>
          ))}
        </div>

        {/* Run Workflow Button */}
        <button
          onClick={onRunWorkflow}
          disabled={selectedAgents.length === 0 || isRunning}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          {isRunning ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Exécution en cours...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              <span>Lancer le workflow ({selectedAgents.length} agents)</span>
            </>
          )}
        </button>
      </div>

      {/* Agents List */}
      <div className="flex-1 overflow-y-auto p-4">
        {view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                isSelected={selectedAgents.includes(agent.id)}
                onToggle={() => handleAgentToggle(agent.id)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {agents.map((agent) => (
              <AgentListItem
                key={agent.id}
                agent={agent}
                isSelected={selectedAgents.includes(agent.id)}
                onToggle={() => handleAgentToggle(agent.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const AgentCard: React.FC<{
  agent: Agent;
  isSelected: boolean;
  onToggle: () => void;
}> = ({ agent, isSelected, onToggle }) => (
  <div
    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
      isSelected
        ? 'border-purple-500 bg-purple-900/20'
        : 'border-gray-700 bg-gray-800 hover:border-gray-600'
    }`}
    onClick={onToggle}
  >
    <div className="flex items-start justify-between mb-2">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{agent.icon}</span>
        <div>
          <h3 className="font-medium text-white">{agent.name}</h3>
          <p className="text-xs text-gray-500">Temp: {agent.temperature}</p>
        </div>
      </div>
      
      {isSelected && (
        <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}
    </div>
    
    <p className="text-sm text-gray-400 mb-3">{agent.description}</p>
    
    <div className="flex flex-wrap gap-1">
      {agent.capabilities.slice(0, 3).map((capability) => (
        <span
          key={capability}
          className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs"
        >
          {capability}
        </span>
      ))}
      {agent.capabilities.length > 3 && (
        <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
          +{agent.capabilities.length - 3}
        </span>
      )}
    </div>
  </div>
);

const AgentListItem: React.FC<{
  agent: Agent;
  isSelected: boolean;
  onToggle: () => void;
}> = ({ agent, isSelected, onToggle }) => (
  <div
    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
      isSelected
        ? 'bg-purple-900/20 border border-purple-500'
        : 'bg-gray-800 hover:bg-gray-700'
    }`}
    onClick={onToggle}
  >
    <div className="flex items-center gap-2">
      <span className="text-lg">{agent.icon}</span>
      {isSelected && (
        <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
          <Check className="w-2 h-2 text-white" />
        </div>
      )}
    </div>
    
    <div className="flex-1">
      <h3 className="font-medium text-white">{agent.name}</h3>
      <p className="text-sm text-gray-400">{agent.description}</p>
    </div>
    
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500">
        {agent.capabilities.length} capacités
      </span>
    </div>
  </div>
);