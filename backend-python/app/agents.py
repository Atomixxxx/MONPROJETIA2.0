# agents.py

import httpx # CHANGEMENT : Importe httpx au lieu de requests
import time
import logging
# import asyncio # Plus besoin de asyncio ici car httpx est asynchrone

# Configuration du logger
logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s %(message)s')

class Agent:
    def __init__(self, name, role, llm_model, description_for_orchestrator):
        self.name = name
        self.role = role
        self.llm_model = llm_model # C'est le nom du modèle Ollama personnalisé (ex: "agent-architecte")
        self.description_for_orchestrator = description_for_orchestrator # Description utile pour l'orchestrateur
        self.memory = [] # Pour stocker l'historique de conversation de cet agent

    # CORRECTION CRUCIALE : aask est maintenant une fonction SYNCHRONE
    def aask(self, prompt, context_messages=None, timeout=180):
        """Envoie un prompt à Ollama, gère les erreurs et fournit un fallback intelligent."""
        messages = []
        # Le SYSTEM prompt est déjà intégré dans le Modelfile de chaque agent.
        # Ici, nous construisons juste les messages user/assistant pour la conversation.

        if context_messages:
            messages.extend(context_messages)
        
        # Ajout du prompt utilisateur
        messages.append({"role": "user", "content": prompt})

        logging.info(f"[Agent {self.name}] Début appel Ollama ({self.llm_model})...")
        start = time.time()
        try:
            # Utilise httpx.Client pour les requêtes synchrones, car cette fonction sera appelée via asyncio.to_thread
            client = httpx.Client() # CHANGEMENT : Utilise httpx.Client
            response = client.post( # CHANGEMENT : Appel synchrone
                "http://localhost:11434/api/chat", # Assurez-vous que votre serveur Ollama tourne sur ce port
                json={"model": self.llm_model, "messages": messages, "stream": False},
                timeout=timeout
            )
            response.raise_for_status()
            data = response.json()
            
            content = data.get("message", {}).get("content")
            if not content:
                content = data.get("content") or data.get("response") or "(Pas de réponse valide de l'IA)"

            elapsed = time.time() - start
            logging.info(f"[Agent {self.name}] Réponse Ollama reçue en {elapsed:.2f}s")
            
            self.memory.append({"role": "user", "content": prompt})
            self.memory.append({"role": "assistant", "content": content})

            return content
        except httpx.TimeoutException: # CHANGEMENT : Gère l'exception Timeout de httpx
            logging.warning(f"[Agent {self.name}] Timeout après {timeout}s pour {self.llm_model} - Fallback utilisé.")
            return self._generate_generic_fallback(prompt)
        except httpx.RequestError as e: # CHANGEMENT : Gère l'exception RequestError de httpx
            logging.error(f"Erreur de requête Ollama pour {self.name} ({self.llm_model}): {e} - Fallback utilisé.")
            return self._generate_generic_fallback(prompt)
        except Exception as e:
            logging.error(f"Erreur inattendue pour l'agent {self.name} ({self.llm_model}): {e} - Fallback utilisé.")
            return self._generate_generic_fallback(prompt)

    def _generate_generic_fallback(self, prompt):
        """Réponse de fallback générique si l'appel LLM échoue."""
        return (
            f"🤖 **{self.name} (Modèle {self.llm_model})**\n\n"
            f"Je suis désolé, je n'ai pas pu générer une réponse complète à votre demande : \"{prompt[:100]}...\".\n\n"
            "Une erreur est survenue lors de la communication avec mon modèle d'IA. "
            "Veuillez réessayer plus tard ou reformuler votre demande."
        )

# --- INSTANCIATION DE TOUS VOS AGENTS SPÉCIALISÉS (ANCIENS AGENTS RETIRÉS) ---
# Utilisez les noms de modèles Ollama que vous avez créés via les modelfiles !
# Noms des instances (name) doivent être uniques pour React et get_agent_by_name

agents = [
    # Agents fondamentaux (maintenant basés sur Ollama)
    Agent(
        name="Mike", # Visionnaire dans votre workflow
        role="Team Leader / Visionnaire",
        llm_model="agent-visionnaire",
        description_for_orchestrator="Responsable de la coordination globale du projet et de la définition de la vision initiale."
    ),
    Agent(
        name="Emma", # Peut être l'expert contenu/SEO ou un manager de produit
        role="Product Manager / Expert Contenu",
        llm_model="agent-seo-content-expert",
        description_for_orchestrator="Définit les spécifications fonctionnelles, les user stories et la roadmap produit."
    ),
    Agent(
        name="Bob", # Architecte
        role="Architecte Logiciel",
        llm_model="agent-architecte",
        description_for_orchestrator="Conçoit la structure technique de l'application (frontend, backend, BDD, services)."
    ),
    # L'ancien "Alex" l'Ingénieur généraliste est remplacé par FrontEngineer et BackEngineer
    # L'ancien "David" le Data Analyst est maintenant DBMaster et peut être intégré par prompt
    
    # Agents spécialisés (ceux que nous avons ajoutés via Modelfiles)
    Agent(
        name="FrontEngineer",
        role="Ingénieur Frontend",
        llm_model="agent-frontend-engineer",
        description_for_orchestrator="Écrit le code HTML, CSS, JavaScript et React pour l'interface utilisateur."
    ),
    Agent(
        name="BackEngineer",
        role="Ingénieur Backend",
        llm_model="agent-backend-engineer",
        description_for_orchestrator="Développe les APIs, la logique métier côté serveur et gère les interactions base de données."
    ),
    Agent(
        name="UIDesigner",
        role="Designer UI/UX",
        llm_model="agent-designer-ui-ux",
        description_for_orchestrator="Propose des designs visuels, des palettes de couleurs et des principes d'expérience utilisateur."
    ),
    Agent(
        name="SEOCopty",
        role="Expert SEO / Contenu",
        llm_model="agent-seo-content-expert",
        description_for_orchestrator="Génère du contenu textuel optimisé pour le SEO et propose des balises meta."
    ),
    Agent(
        name="DBMaster",
        role="Spécialiste Base de Données",
        llm_model="agent-database-specialist",
        description_for_orchestrator="Conçoit les schémas de base de données et écrit les requêtes SQL/ORM."
    ),
    Agent(
        name="DevOpsGuy",
        role="Déployeur / DevOps",
        llm_model="agent-deployer-devops",
        description_for_orchestrator="Prépare l'application pour le déploiement et fournit les scripts DevOps."
    ),
    Agent(
        name="TheCritique",
        role="Critique Qualité & Sécurité",
        llm_model="agent-critique",
        description_for_orchestrator="Identifie les erreurs, les failles de sécurité et les améliorations dans le code ou les plans."
    ),
    Agent(
        name="TheOptimizer",
        role="Optimiseur de Code",
        llm_model="agent-optimiseur",
        description_for_orchestrator="Optimise la performance, la lisibilité et la maintenabilité du code généré."
    ),
    Agent(
        name="TranslatorBot",
        role="Traducteur",
        llm_model="agent-translator",
        description_for_orchestrator="Traduit le contenu textuel dans différentes langues."
    ),
]

# --- Fonction utilitaire pour trouver un agent par son nom ---
def get_agent_by_name(agent_name: str):
    """Recherche et retourne une instance d'agent par son nom."""
    for agent in agents:
        if agent.name == agent_name:
            return agent
    return None