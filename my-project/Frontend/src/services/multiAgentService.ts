import { Agent } from '../types/index';

export class MultiAgentService {
    private agents: Agent[];

    constructor() {
        this.agents = [];
    }

    addAgent(agent: Agent): void {
        this.agents.push(agent);
    }

    removeAgent(agentId: string): void {
        this.agents = this.agents.filter(agent => agent.id !== agentId);
    }

    getAgents(): Agent[] {
        return this.agents;
    }

    executeTask(task: string): void {
        this.agents.forEach(agent => {
            agent.execute(task);
        });
    }
}