# orchestrator.py

import os
import json
from agents import Agent
from backend_stable_enhanced import StableEnhancer

class Orchestrator:
    def __init__(self):
        self.agents = []
        self.enhancer = StableEnhancer()

    def load_agents(self, config_path):
        if not os.path.exists(config_path):
            raise FileNotFoundError(f"Configuration file not found: {config_path}")

        with open(config_path, 'r') as file:
            config = json.load(file)
            for agent_config in config.get("agents", []):
                agent = Agent(**agent_config)
                self.agents.append(agent)

    def run(self):
        for agent in self.agents:
            agent.perform_task()
            self.enhancer.enhance(agent)

if __name__ == "__main__":
    orchestrator = Orchestrator()
    orchestrator.load_agents("config.json")
    orchestrator.run()