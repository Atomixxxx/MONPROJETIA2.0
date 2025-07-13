import { AgentTeam } from '../types'; // Adjust the import path as necessary
import { api } from './api';

const agentTeamsService = {
    getAllTeams: async (): Promise<AgentTeam[]> => {
        const response = await api.get('/agent-teams');
        return response.data;
    },

    getTeamById: async (id: string): Promise<AgentTeam> => {
        const response = await api.get(`/agent-teams/${id}`);
        return response.data;
    },

    createTeam: async (teamData: AgentTeam): Promise<AgentTeam> => {
        const response = await api.post('/agent-teams', teamData);
        return response.data;
    },

    updateTeam: async (id: string, teamData: AgentTeam): Promise<AgentTeam> => {
        const response = await api.put(`/agent-teams/${id}`, teamData);
        return response.data;
    },

    deleteTeam: async (id: string): Promise<void> => {
        await api.delete(`/agent-teams/${id}`);
    }
};

export default agentTeamsService;