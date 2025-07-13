# orchestrator.py – Orchestrateur central multi-agent
from agents.architect import ArchitectAgent
from agents.writer import WriterAgent
from agents.critic import CriticAgent
from agents.executor import ExecutorAgent
from agents.historian import HistorianAgent
from agents.ux_designer import UXDesignerAgent

class Orchestrator:
    def __init__(self):
        self.agents = [
            ArchitectAgent(), WriterAgent(), CriticAgent(),
            ExecutorAgent(), HistorianAgent(), UXDesignerAgent()
        ]
    
    def handle_request(self, user_input, context):
        selected_agents = self.select_agents(context)
        results = []
        for agent in selected_agents:
            result = agent.act(user_input, context)
            results.append(result)
        return self.aggregate_results(results)

    def select_agents(self, context):
        # Logique de sélection intelligente à implémenter
        return self.agents

    def aggregate_results(self, results):
        return "\n".join(results)

    def get_agent(self, name):
        for agent in self.agents:
            if agent.name == name:
                return agent
        return None
