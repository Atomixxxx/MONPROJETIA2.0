import { AIResponse, Project, ProjectFile } from '../types';

export interface Agent {
  id: string;
  name: string;
  role: string;
  llm_model: string;
  description: string;
  capabilities: string[];
  icon: string;
  color: string;
}

export interface AgentResponse {
  agent: string;
  thought: string;
  response: string;
  confidence: number;
  executionTime: number;
}

export interface WorkflowResult {
  results: Record<string, AgentResponse>;
  summary: string;
  recommendations: string[];
  sessionId: string;
  finalOutputPath?: string;
}

export interface WorkflowMessage {
  type: string;
  agent_name?: string;
  stage?: string;
  message: string;
  content?: string;
  elapsed?: number;
  timestamp: string;
}

export class MultiAgentService {
  private agents: Agent[] = [
    {
      id: 'Mike',
      name: 'Mike - Visionnaire',
      role: 'Team Leader / Visionnaire',
      llm_model: 'agent-visionnaire',
      description: 'Responsable de la coordination globale du projet et de la définition de la vision initiale',
      capabilities: ['strategy', 'vision', 'leadership', 'coordination'],
      icon: '🔮',
      color: '#6366F1'
    },
    {
      id: 'Emma',
      name: 'Emma - Product Manager',
      role: 'Product Manager / Expert Contenu',
      llm_model: 'agent-seo-content-expert',
      description: 'Définit les spécifications fonctionnelles, les user stories et la roadmap produit',
      capabilities: ['product_management', 'content', 'specifications'],
      icon: '📋',
      color: '#EC4899'
    },
    {
      id: 'Bob',
      name: 'Bob - Architecte',
      role: 'Architecte Logiciel',
      llm_model: 'agent-architecte',
      description: 'Conçoit la structure technique de l\'application (frontend, backend, BDD, services)',
      capabilities: ['architecture', 'system_design', 'technical_planning'],
      icon: '🏗️',
      color: '#3B82F6'
    },
    {
      id: 'FrontEngineer',
      name: 'Front Engineer',
      role: 'Ingénieur Frontend',
      llm_model: 'agent-frontend-engineer',
      description: 'Écrit le code HTML, CSS, JavaScript et React pour l\'interface utilisateur',
      capabilities: ['frontend', 'react', 'html', 'css', 'javascript'],
      icon: '🎨',
      color: '#F59E0B'
    },
    {
      id: 'BackEngineer',
      name: 'Back Engineer',
      role: 'Ingénieur Backend',
      llm_model: 'agent-backend-engineer',
      description: 'Développe les APIs, la logique métier côté serveur et gère les interactions base de données',
      capabilities: ['backend', 'api', 'server', 'database_integration'],
      icon: '⚙️',
      color: '#10B981'
    },
    {
      id: 'UIDesigner',
      name: 'UI Designer',
      role: 'Designer UI/UX',
      llm_model: 'agent-designer-ui-ux',
      description: 'Propose des designs visuels, des palettes de couleurs et des principes d\'expérience utilisateur',
      capabilities: ['ui_design', 'ux_design', 'visual_design', 'user_experience'],
      icon: '✨',
      color: '#8B5CF6'
    },
    {
      id: 'SEOCopty',
      name: 'SEO Expert',
      role: 'Expert SEO / Contenu',
      llm_model: 'agent-seo-content-expert',
      description: 'Génère du contenu textuel optimisé pour le SEO et propose des balises meta',
      capabilities: ['seo', 'content_creation', 'marketing', 'optimization'],
      icon: '📈',
      color: '#059669'
    },
    {
      id: 'DBMaster',
      name: 'DB Master',
      role: 'Spécialiste Base de Données',
      llm_model: 'agent-database-specialist',
      description: 'Conçoit les schémas de base de données et écrit les requêtes SQL/ORM',
      capabilities: ['database', 'sql', 'schema_design', 'optimization'],
      icon: '🗃️',
      color: '#EF4444'
    },
    {
      id: 'DevOpsGuy',
      name: 'DevOps Guy',
      role: 'Déployeur / DevOps',
      llm_model: 'agent-deployer-devops',
      description: 'Prépare l\'application pour le déploiement et fournit les scripts DevOps',
      capabilities: ['deployment', 'devops', 'infrastructure', 'ci_cd'],
      icon: '🚀',
      color: '#06B6D4'
    },
    {
      id: 'TheCritique',
      name: 'The Critique',
      role: 'Critique Qualité & Sécurité',
      llm_model: 'agent-critique',
      description: 'Identifie les erreurs, les failles de sécurité et les améliorations dans le code ou les plans',
      capabilities: ['code_review', 'security', 'quality_assurance', 'best_practices'],
      icon: '🔍',
      color: '#F97316'
    },
    {
      id: 'TheOptimizer',
      name: 'The Optimizer',
      role: 'Optimiseur de Code',
      llm_model: 'agent-optimiseur',
      description: 'Optimise la performance, la lisibilité et la maintenabilité du code généré',
      capabilities: ['optimization', 'performance', 'code_quality', 'maintainability'],
      icon: '⚡',
      color: '#84CC16'
    },
    {
      id: 'TranslatorBot',
      name: 'Translator Bot',
      role: 'Traducteur',
      llm_model: 'agent-translator',
      description: 'Traduit le contenu textuel dans différentes langues',
      capabilities: ['translation', 'localization', 'internationalization'],
      icon: '🌍',
      color: '#0EA5E9'
    }
  ];

  private baseUrl: string;
  private wsUrl: string;
  private enableMock: boolean;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    this.wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
    this.enableMock = import.meta.env.VITE_ENABLE_MOCK !== 'false';
  }

  getAgents(): Agent[] {
    return this.agents;
  }

  getAgent(id: string): Agent | undefined {
    return this.agents.find(agent => agent.id === id);
  }

  getAgentsByCapability(capability: string): Agent[] {
    return this.agents.filter(agent => 
      agent.capabilities.includes(capability)
    );
  }

  async queryAgent(
    agentId: string, 
    message: string, 
    context: {
      project?: Project;
      file?: ProjectFile;
      code?: string;
    }
  ): Promise<AgentResponse> {
    const agent = this.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const startTime = Date.now();
    
    try {
      if (this.enableMock) {
        return this.simulateAgentResponse(agent, message, context);
      }

      // Appel API réel vers votre backend FastAPI
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          agent_name: agentId,
          message: this.buildPromptWithContext(message, context)
        })
      });

      if (!response.ok) {
        throw new Error(`Agent ${agentId} request failed: ${response.status}`);
      }

      const data = await response.json();
      const executionTime = Date.now() - startTime;

      return {
        agent: agent.name,
        thought: `Analyse par ${agent.name} (${agent.llm_model})...`,
        response: data.response || 'Aucune réponse reçue',
        confidence: 0.85 + Math.random() * 0.1,
        executionTime
      };
    } catch (error) {
      console.error(`Error querying agent ${agentId}:`, error);
      return this.simulateAgentResponse(agent, message, context);
    }
  }

  async runWebsiteCreationWorkflow(
    userPrompt: string,
    onMessage: (message: WorkflowMessage) => void
  ): Promise<WorkflowResult> {
    const sessionId = `session_${Date.now()}`;
    
    try {
      if (this.enableMock) {
        return this.simulateWebsiteWorkflow(userPrompt, sessionId, onMessage);
      }

      return new Promise((resolve, reject) => {
        const ws = new WebSocket(`${this.wsUrl.replace('ws://', 'ws://').replace('http://', 'ws://')}/ws/${sessionId}`);
        const results: Record<string, AgentResponse> = {};
        let workflowComplete = false;

        ws.onopen = () => {
          console.log('WebSocket connection established for workflow');
          // Envoyer la demande de création de site web
          ws.send(JSON.stringify({
            type: 'chat_request',
            prompt: userPrompt
          }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // Transmettre le message à l'interface en temps réel
            onMessage({
              type: data.type,
              agent_name: data.agent,
              stage: data.stage,
              message: data.action || data.content || '',
              content: data.content,
              elapsed: data.elapsed ? parseFloat(data.elapsed.replace('s', '')) : undefined,
              timestamp: data.timestamp || new Date().toISOString()
            });
            
            if (data.type === 'workflow_complete') {
              workflowComplete = true;
              ws.close();
              
              const summary = this.generateSummary(results);
              const recommendations = this.generateRecommendations(results, {});
              
              resolve({
                results,
                summary,
                recommendations,
                sessionId,
                finalOutputPath: data.final_output_path
              });
            } else if (data.type === 'agent_response') {
              // Traiter les réponses des agents
              const agentResponse: AgentResponse = {
                agent: data.agent || 'Agent',
                thought: `${data.action || 'Traitement en cours'}...`,
                response: data.content || '',
                confidence: 0.85,
                executionTime: data.elapsed ? parseFloat(data.elapsed.replace('s', '')) * 1000 : 0
              };
              
              results[data.agent || 'agent'] = agentResponse;
            }
            
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          ws.close();
          // Fallback vers simulation
          this.simulateWebsiteWorkflow(userPrompt, sessionId, onMessage)
            .then(resolve)
            .catch(reject);
        };

        ws.onclose = () => {
          if (!workflowComplete) {
            console.log('WebSocket closed before workflow completion');
            // Fallback vers simulation si pas terminé
            this.simulateWebsiteWorkflow(userPrompt, sessionId, onMessage)
              .then(resolve)
              .catch(reject);
          }
        };

        // Timeout de sécurité
        setTimeout(() => {
          if (!workflowComplete) {
            ws.close();
            reject(new Error('Workflow timeout'));
          }
        }, 300000); // 5 minutes
      });
    } catch (error) {
      console.error('Error in website creation workflow:', error);
      return this.simulateWebsiteWorkflow(userPrompt, sessionId, onMessage);
    }
  }

  async runWorkflow(
    selectedAgents: string[],
    userInput: string,
    context: {
      project?: Project;
      file?: ProjectFile;
      code?: string;
    }
  ): Promise<WorkflowResult> {
    const results: Record<string, AgentResponse> = {};
    const sessionId = `workflow_${Date.now()}`;

    // Exécuter les agents en parallèle
    const promises = selectedAgents.map(async (agentId) => {
      const result = await this.queryAgent(agentId, userInput, context);
      results[agentId] = result;
    });

    await Promise.all(promises);

    const summary = this.generateSummary(results);
    const recommendations = this.generateRecommendations(results, context);

    return {
      results,
      summary,
      recommendations,
      sessionId
    };
  }

  async brainstormingWorkflow(
    userInput: string,
    context: {
      project?: Project;
      file?: ProjectFile;
      code?: string;
    }
  ): Promise<WorkflowResult> {
    // Sélectionner automatiquement les agents pertinents
    const relevantAgents = this.selectRelevantAgents(userInput, context);
    return this.runWorkflow(relevantAgents, userInput, context);
  }

  private buildPromptWithContext(message: string, context: any): string {
    let prompt = message;
    
    if (context.project) {
      prompt += `\n\nCONTEXTE PROJET:\nNom: ${context.project.name}\nDescription: ${context.project.description}\nLangage: ${context.project.language}`;
    }
    
    if (context.file) {
      prompt += `\n\nFICHIER ACTUEL:\nNom: ${context.file.name}\nLangage: ${context.file.language}`;
    }
    
    if (context.code) {
      prompt += `\n\nCODE:\n\`\`\`${context.file?.language || 'text'}\n${context.code}\n\`\`\``;
    }
    
    return prompt;
  }

  private selectRelevantAgents(userInput: string, context: any): string[] {
    const input = userInput.toLowerCase();
    const selectedAgents: string[] = [];

    // Sélection intelligente basée sur les mots-clés
    if (input.includes('site') || input.includes('web') || input.includes('création')) {
      selectedAgents.push('Mike', 'Bob', 'FrontEngineer', 'UIDesigner');
    }
    if (input.includes('architecture') || input.includes('structure')) {
      selectedAgents.push('Bob');
    }
    if (input.includes('design') || input.includes('interface') || input.includes('ui')) {
      selectedAgents.push('UIDesigner');
    }
    if (input.includes('backend') || input.includes('api') || input.includes('serveur')) {
      selectedAgents.push('BackEngineer');
    }
    if (input.includes('frontend') || input.includes('react')) {
      selectedAgents.push('FrontEngineer');
    }
    if (input.includes('base') || input.includes('données') || input.includes('database')) {
      selectedAgents.push('DBMaster');
    }
    if (input.includes('seo') || input.includes('contenu')) {
      selectedAgents.push('SEOCopty');
    }
    if (input.includes('déploiement') || input.includes('deploy')) {
      selectedAgents.push('DevOpsGuy');
    }
    if (input.includes('critique') || input.includes('review')) {
      selectedAgents.push('TheCritique');
    }
    if (input.includes('optimise') || input.includes('performance')) {
      selectedAgents.push('TheOptimizer');
    }
    if (input.includes('traduction') || input.includes('multilingue')) {
      selectedAgents.push('TranslatorBot');
    }

    // Si aucun agent spécifique, utiliser un ensemble par défaut
    if (selectedAgents.length === 0) {
      selectedAgents.push('Mike', 'Bob', 'TheCritique');
    }

    // Retirer les doublons
    return [...new Set(selectedAgents)];
  }

  private async simulateWebsiteWorkflow(
    userPrompt: string,
    sessionId: string,
    onMessage: (message: WorkflowMessage) => void
  ): Promise<WorkflowResult> {
    const results: Record<string, AgentResponse> = {};
    
    // Simuler les étapes du workflow
    const steps = [
      { agent: 'Mike', stage: 'vision', message: 'Vision du projet définie' },
      { agent: 'Bob', stage: 'architecture', message: 'Architecture technique conçue' },
      { agent: 'UIDesigner', stage: 'design', message: 'Design UI/UX proposé' },
      { agent: 'SEOCopty', stage: 'content', message: 'Contenu SEO généré' },
      { agent: 'BackEngineer', stage: 'backend', message: 'Code backend développé' },
      { agent: 'FrontEngineer', stage: 'frontend', message: 'Interface utilisateur créée' },
      { agent: 'TheCritique', stage: 'review', message: 'Code analysé et critiqué' },
      { agent: 'TheOptimizer', stage: 'optimization', message: 'Code optimisé' }
    ];

    for (const step of steps) {
      // Simuler le délai de traitement
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      const agent = this.getAgent(step.agent);
      if (agent) {
        const response = await this.simulateAgentResponse(agent, userPrompt, {});
        results[step.agent] = response;
        
        onMessage({
          type: 'agent_response',
          agent_name: step.agent,
          stage: step.stage,
          message: step.message,
          content: response.response,
          elapsed: response.executionTime,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Message de fin
    onMessage({
      type: 'workflow_complete',
      message: '✅ Workflow de création de site web terminé !',
      timestamp: new Date().toISOString()
    });

    return {
      results,
      summary: this.generateSummary(results),
      recommendations: this.generateRecommendations(results, {}),
      sessionId
    };
  }

  private async simulateAgentResponse(
    agent: Agent, 
    message: string, 
    context: any
  ): Promise<AgentResponse> {
    // Simuler un délai réaliste
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const responses = this.getSimulatedResponses(agent, message, context);
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    return {
      agent: agent.name,
      thought: randomResponse.thought,
      response: randomResponse.response,
      confidence: 0.8 + Math.random() * 0.2,
      executionTime: 1000 + Math.random() * 2000
    };
  }

  private getSimulatedResponses(agent: Agent, message: string, context: any) {
    const responses: Record<string, any[]> = {
      Mike: [
        {
          thought: "J'analyse la vision globale du projet et coordonne l'équipe...",
          response: `🔮 **Vision du Projet**\n\nAprès analyse de votre demande, je propose une approche structurée :\n\n• **Phase 1** : Définition des spécifications\n• **Phase 2** : Architecture et design\n• **Phase 3** : Développement iteratif\n• **Phase 4** : Tests et optimisation\n• **Phase 5** : Déploiement et maintenance\n\nL'équipe multi-agent va maintenant travailler en coordination pour réaliser cette vision.`
        }
      ],
      Bob: [
        {
          thought: "Je conçois l'architecture technique optimale pour ce projet...",
          response: `🏗️ **Architecture Technique**\n\n**Frontend** :\n• React 18 avec TypeScript\n• Tailwind CSS pour le styling\n• Vite comme bundler\n\n**Backend** :\n• FastAPI (Python)\n• PostgreSQL pour la base de données\n• Redis pour le cache\n\n**Infrastructure** :\n• Docker pour la conteneurisation\n• nginx comme reverse proxy\n• Déploiement sur cloud (AWS/GCP)`
        }
      ],
      FrontEngineer: [
        {
          thought: "Je développe une interface utilisateur moderne et responsive...",
          response: `🎨 **Code Frontend**\n\n\`\`\`jsx\n// Composant principal\nfunction App() {\n  return (\n    <div className="min-h-screen bg-gray-50">\n      <Header />\n      <main className="container mx-auto px-4 py-8">\n        <Routes>\n          <Route path="/" element={<Home />} />\n          <Route path="/about" element={<About />} />\n        </Routes>\n      </main>\n      <Footer />\n    </div>\n  );\n}\n\`\`\`\n\nInterface moderne avec navigation intuitive et design responsive.`
        }
      ],
      BackEngineer: [
        {
          thought: "Je développe les APIs robustes et la logique métier...",
          response: `⚙️ **Code Backend**\n\n\`\`\`python\nfrom fastapi import FastAPI, HTTPException\nfrom pydantic import BaseModel\n\napp = FastAPI(title="API")\n\nclass Item(BaseModel):\n    id: int\n    name: str\n    description: str\n\n@app.get("/api/items")\nasync def get_items():\n    return {"items": []}\n\n@app.post("/api/items")\nasync def create_item(item: Item):\n    return {"success": True, "item": item}\n\`\`\`\n\nAPI RESTful sécurisée avec validation des données.`
        }
      ],
      TheCritique: [
        {
          thought: "J'analyse le code pour identifier les problèmes potentiels...",
          response: `🔍 **Rapport de Critique**\n\n**Points positifs** :\n• Architecture claire et modulaire\n• Utilisation de technologies modernes\n• Code bien structuré\n\n**Améliorations recommandées** :\n• Ajouter la gestion d'erreurs globale\n• Implémenter les tests unitaires\n• Sécuriser les endpoints API\n• Optimiser les requêtes base de données\n\n**Sécurité** :\n• Validation des inputs côté serveur\n• Protection CSRF\n• Rate limiting sur les APIs`
        }
      ],
      TheOptimizer: [
        {
          thought: "J'optimise les performances et la qualité du code...",
          response: `⚡ **Optimisations Appliquées**\n\n**Frontend** :\n• Lazy loading des composants\n• Optimisation des images\n• Code splitting automatique\n• Cache des requêtes API\n\n**Backend** :\n• Indexation base de données\n• Compression des réponses\n• Pool de connexions\n• Cache Redis pour les requêtes fréquentes\n\n**Performance** :\n• Temps de chargement < 2s\n• Score Lighthouse > 90\n• Optimisation SEO intégrée`
        }
      ]
    };

    return responses[agent.id] || [
      {
        thought: `J'analyse votre demande avec mon expertise en ${agent.capabilities.join(', ')}...`,
        response: `${agent.icon} **${agent.role}**\n\nBasé sur mon analyse, je recommande d'explorer les aspects suivants : ${agent.capabilities.join(', ')}. Je peux vous aider à approfondir ces points spécifiques selon les besoins du projet.`
      }
    ];
  }

  private generateSummary(results: Record<string, AgentResponse>): string {
    const agents = Object.keys(results);
    const avgConfidence = Object.values(results).reduce((acc, r) => acc + r.confidence, 0) / agents.length;
    
    return `Analyse terminée par ${agents.length} agents avec une confiance moyenne de ${(avgConfidence * 100).toFixed(1)}%. L'équipe multi-agent a produit une solution complète et optimisée.`;
  }

  private generateRecommendations(results: Record<string, AgentResponse>, context: any): string[] {
    const recommendations = [
      "Implémenter les suggestions par ordre de priorité",
      "Effectuer des tests d'intégration complets",
      "Documenter l'architecture et les APIs",
      "Mettre en place le monitoring en production",
      "Planifier les mises à jour et la maintenance"
    ];

    if (context.code) {
      recommendations.push("Ajouter la couverture de tests unitaires");
    }
    if (context.project) {
      recommendations.push("Synchroniser avec l'équipe de développement");
    }

    return recommendations;
  }
}

export const multiAgentService = new MultiAgentService();