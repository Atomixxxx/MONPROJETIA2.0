// Frontend/src/services/multiAgentService.ts
export interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  capabilities: string[];
  temperature: number;
  icon: string;
}

export interface AgentResponse {
  agent: string;
  response: string;
  confidence: number;
  executionTime: number;
  thought: string;
}

export interface WorkflowResult {
  results: Record<string, AgentResponse>;
  summary: string;
  recommendations: string[];
  totalTime: number;
}

export class MultiAgentService {
  private baseUrl: string;
  private wsUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8002';
    this.wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8002/ws';
  }

  getAgents(): Agent[] {
    return [
      {
        id: 'Mike',
        name: 'Mike',
        role: 'Team Leader / Visionnaire',
        description: 'Coordinateur de projet et définition de vision',
        capabilities: ['vision', 'strategy', 'coordination'],
        temperature: 0.7,
        icon: '🔮'
      },
      {
        id: 'Bob',
        name: 'Bob',
        role: 'Architecte Logiciel',
        description: 'Expert en architecture technique',
        capabilities: ['architecture', 'system_design', 'technical_planning'],
        temperature: 0.8,
        icon: '🏗️'
      },
      {
        id: 'FrontEngineer',
        name: 'Frontend Engineer',
        role: 'Ingénieur Frontend',
        description: 'Développeur React/JavaScript',
        capabilities: ['frontend', 'react', 'ui_development'],
        temperature: 0.6,
        icon: '🎨'
      },
      {
        id: 'BackEngineer',
        name: 'Backend Engineer',
        role: 'Ingénieur Backend',
        description: 'Développeur FastAPI/Python',
        capabilities: ['backend', 'api', 'database'],
        temperature: 0.6,
        icon: '⚙️'
      },
      {
        id: 'UIDesigner',
        name: 'UI Designer',
        role: 'Designer UI/UX',
        description: 'Expert en design d\'interface',
        capabilities: ['ui_design', 'ux', 'design_systems'],
        temperature: 0.8,
        icon: '✨'
      },
      {
        id: 'SEOCopty',
        name: 'SEO Expert',
        role: 'Expert SEO/Contenu',
        description: 'Spécialiste SEO et contenu',
        capabilities: ['seo', 'content', 'marketing'],
        temperature: 0.7,
        icon: '📈'
      },
      {
        id: 'DBMaster',
        name: 'Database Master',
        role: 'Spécialiste Base de Données',
        description: 'Expert en bases de données',
        capabilities: ['database', 'sql', 'data_modeling'],
        temperature: 0.6,
        icon: '🗃️'
      },
      {
        id: 'DevOpsGuy',
        name: 'DevOps Guy',
        role: 'Expert DevOps',
        description: 'Spécialiste déploiement',
        capabilities: ['devops', 'deployment', 'infrastructure'],
        temperature: 0.7,
        icon: '🚀'
      },
      {
        id: 'TheCritique',
        name: 'The Critique',
        role: 'Critique Qualité',
        description: 'Expert en qualité et sécurité',
        capabilities: ['code_review', 'security', 'quality_assurance'],
        temperature: 0.5,
        icon: '🔍'
      },
      {
        id: 'TheOptimizer',
        name: 'The Optimizer',
        role: 'Optimiseur de Code',
        description: 'Expert en optimisation',
        capabilities: ['performance', 'optimization', 'refactoring'],
        temperature: 0.6,
        icon: '⚡'
      },
      {
        id: 'TranslatorBot',
        name: 'Translator Bot',
        role: 'Traducteur',
        description: 'Expert en traduction',
        capabilities: ['translation', 'localization', 'i18n'],
        temperature: 0.5,
        icon: '🌍'
      }
    ];
  }

  async runWorkflow(
    selectedAgents: string[],
    prompt: string,
    context: any = {}
  ): Promise<WorkflowResult> {
    try {
      const response = await fetch(`${this.baseUrl}/workflow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agents: selectedAgents,
          prompt,
          context
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Workflow error:', error);
      // Fallback response
      return {
        results: {},
        summary: 'Erreur de communication avec le backend. Vérifiez que le serveur est démarré.',
        recommendations: ['Démarrer le backend avec: python backend_stable_enhanced.py'],
        totalTime: 0
      };
    }
  }

  async runWebsiteCreationWorkflow(
    prompt: string,
    onMessage?: (message: any) => void
  ): Promise<WorkflowResult> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`${this.wsUrl}/session_${Date.now()}`);
      
      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'chat_request',
          prompt,
          selected_agents: ['Mike', 'Bob', 'FrontEngineer', 'BackEngineer']
        }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        onMessage?.(data);

        if (data.type === 'workflow_complete') {
          resolve({
            results: {},
            summary: data.message,
            recommendations: [],
            totalTime: 0
          });
          ws.close();
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed');
      };
    });
  }

  async brainstormingWorkflow(prompt: string, context: any = {}): Promise<WorkflowResult> {
    return this.runWorkflow(['Mike', 'Bob', 'UIDesigner'], prompt, context);
  }
}

export const multiAgentService = new MultiAgentService();
