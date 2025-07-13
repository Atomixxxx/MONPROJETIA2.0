# agents.py

class Agent:
    def __init__(self, name, skills):
        self.name = name
        self.skills = skills

    def perform_task(self, task):
        if task in self.skills:
            return f"{self.name} is performing the task: {task}"
        else:
            return f"{self.name} cannot perform the task: {task}"

def create_agent(name, skills):
    return Agent(name, skills)

def list_agents(agents):
    return [agent.name for agent in agents]