"""
Backend stable pour les agents IA avec WebSocket et intégration React optimisée
Version corrigée avec gestion robuste des connexions WebSocket
"""
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import ollama
import time
import logging
import json
import asyncio
from datetime import datetime
import uuid
import traceback

# Configuration des logs
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI Agents API - Stable Enhanced", version="2.0.1")

# Configuration CORS sécurisée
# Configuration CORS sécurisée et élargie
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Modèles Pydantic
class ChatRequest(BaseModel):
    agent_name: str
    message: str
    context: Optional[Dict] = None

class WorkflowRequest(BaseModel):
    user_input: str
    agent_names: Optional[List[str]] = None

class WebSocketWorkflowRequest(BaseModel):
    prompt: str
    selected_agents: List[str]
    session_id: str

class AgentResponse(BaseModel):
    agent: str
    response: str
    model: str
    execution_time: float
    timestamp: datetime

# Configuration des agents avec vos modelfiles
AGENT_CONFIGS = {
    "Mike": {
        "model": "agent-visionnaire",
        "role": "Team Leader / Visionnaire",
        "description": "Coordinateur de projet et définition de vision",
        "color": "#FF6B6B",
        "emoji": "🎯"
    },
    "Bob": {
        "model": "agent-architecte", 
        "role": "Architecte Logiciel",
        "description": "Expert en architecture technique",
        "color": "#FFEAA7",
        "emoji": "🏗️"
    },
    "FrontEngineer": {
        "model": "agent-frontend-engineer",
        "role": "Ingénieur Frontend", 
        "description": "Développeur React/JavaScript",
        "color": "#4ECDC4",
        "emoji": "⚡"
    },
    "BackEngineer": {
        "model": "agent-backend-engineer",
        "role": "Ingénieur Backend",
        "description": "Développeur FastAPI/Python",
        "color": "#45B7D1", 
        "emoji": "🔧"
    },
    "UIDesigner": {
        "model": "agent-designer-ui-ux",
        "role": "Designer UI/UX",
        "description": "Expert en design d'interface",
        "color": "#96CEB4",
        "emoji": "🎨"
    },
    "SEOExpert": {
        "model": "agent-seo-content-expert",
        "role": "Expert SEO/Contenu",
        "description": "Spécialiste SEO et contenu",
        "color": "#F8B500",
        "emoji": "📝"
    },
    "DBMaster": {
        "model": "agent-database-specialist",
        "role": "Spécialiste Base de Données", 
        "description": "Expert en bases de données",
        "color": "#A29BFE",
        "emoji": "🗄️"
    },
    "DevOpsGuy": {
        "model": "agent-deployer-devops",
        "role": "Expert DevOps",
        "description": "Spécialiste déploiement",
        "color": "#DDA0DD",
        "emoji": "🚀"
    },
    "TheCritique": {
        "model": "agent-critique",
        "role": "Critique Qualité",
        "description": "Expert en qualité et sécurité",
        "color": "#FF7675", 
        "emoji": "🔍"
    },
    "TheOptimizer": {
        "model": "agent-optimiseur",
        "role": "Optimiseur de Code",
        "description": "Expert en optimisation",
        "color": "#6C5CE7",
        "emoji": "⚡"
    },
    "TranslatorBot": {
        "model": "agent-translator",
        "role": "Traducteur",
        "description": "Expert en traduction",
        "color": "#FD79A8",
        "emoji": "🌐"
    }
}

# Gestionnaire de connexions WebSocket
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.connection_lock = asyncio.Lock()
        self.heartbeat_tasks: Dict[str, asyncio.Task] = {}
        self.max_connections = 50
    
    async def connect(self, websocket: WebSocket, session_id: str):
        """Connexion sécurisée avec vérifications"""
        # Vérifier le nombre de connexions
        if len(self.active_connections) >= self.max_connections:
            await websocket.close(code=1008, reason="Trop de connexions actives")
            return False
        
        # Vérifier si la session existe déjà
        if session_id in self.active_connections:
            await websocket.close(code=1008, reason="Session déjà active")
            return False
        
        await websocket.accept()
        
        async with self.connection_lock:
            self.active_connections[session_id] = websocket
            logger.info(f"[{session_id}] Nouvelle connexion - Total: {len(self.active_connections)}")
        
        # Démarrer le heartbeat
        self.heartbeat_tasks[session_id] = asyncio.create_task(
            self._heartbeat_task(websocket, session_id)
        )
        
        return True
    
    async def disconnect(self, session_id: str):
        """Déconnexion propre"""
        async with self.connection_lock:
            if session_id in self.active_connections:
                del self.active_connections[session_id]
                logger.info(f"[{session_id}] Connexion fermée - Total: {len(self.active_connections)}")
        
        # Arrêter le heartbeat
        if session_id in self.heartbeat_tasks:
            self.heartbeat_tasks[session_id].cancel()
            del self.heartbeat_tasks[session_id]
    
    async def send_personal_message(self, message: str, session_id: str):
        """Envoi de message sécurisé"""
        if session_id in self.active_connections:
            websocket = self.active_connections[session_id]
            try:
                await websocket.send_text(message)
                return True
            except Exception as e:
                logger.error(f"[{session_id}] Erreur envoi message: {e}")
                await self.disconnect(session_id)
                return False
        return False
    
    async def _heartbeat_task(self, websocket: WebSocket, session_id: str):
        """Heartbeat pour détecter les connexions mortes"""
        try:
            while True:
                await asyncio.sleep(30)  # Heartbeat toutes les 30 secondes
                try:
                    await websocket.send_text(json.dumps({
                        "type": "heartbeat",
                        "timestamp": datetime.now().isoformat()
                    }))
                except Exception:
                    break
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"[{session_id}] Erreur heartbeat: {e}")
        finally:
            await self.disconnect(session_id)

# Agent amélioré avec gestion d'erreurs robuste
class EnhancedAgent:
    def __init__(self, name: str, config: dict):
        self.name = name
        self.model = config["model"]
        self.role = config["role"]
        self.description = config["description"]
        self.color = config["color"]
        self.emoji = config["emoji"]
        self._model_available = None
        self._last_check = 0
        
    def check_model_availability(self) -> bool:
        """Vérifie si le modèle Ollama est disponible avec cache"""
        current_time = time.time()
        
        # Cache la vérification pendant 60 secondes
        if self._model_available is not None and (current_time - self._last_check) < 60:
            return self._model_available
        
        try:
            models = ollama.list()
            available_models = [model['name'] for model in models.get('models', [])]
            self._model_available = self.model in available_models
            self._last_check = current_time
            return self._model_available
        except Exception as e:
            logger.error(f"Erreur vérification modèle {self.model}: {e}")
            self._model_available = False
            return False
    
    def think(self, context: Dict[str, Any]) -> str:
        """Réflexion contrôlée avec fallback"""
        if not self.check_model_availability():
            return f"❌ Modèle {self.model} non disponible. Installez-le avec: ollama pull {self.model}"
        
        prompt = f"En tant que {self.role}, donnez une réflexion courte sur cette situation."
        
        try:
            response = ollama.generate(
                model=self.model, 
                prompt=prompt,
                options={
                    "num_predict": 150,
                    "temperature": 0.6,
                    "stop": ["\n\n"],
                    "num_ctx": 2048
                }
            )
            return response['response'][:250]
        except Exception as e:
            logger.error(f"Erreur génération {self.name}: {e}")
            return f"🤖 {self.name}: Réflexion temporairement indisponible - {str(e)[:50]}..."
    
    async def act_async(self, user_input: str, context: Dict[str, Any], max_retries: int = 2) -> str:
        """Action asynchrone avec retry"""
        for attempt in range(max_retries + 1):
            try:
                if not self.check_model_availability():
                    return self._generate_fallback_response(user_input)
                
                # Prompt contextualisé selon le rôle
                role_prompts = {
                    "Team Leader / Visionnaire": f"En tant que visionnaire, analysez cette demande et proposez une approche stratégique: {user_input}",
                    "Architecte Logiciel": f"En tant qu'architecte, concevez une solution technique pour: {user_input}",
                    "Ingénieur Frontend": f"En tant que développeur frontend, proposez une solution React/JavaScript pour: {user_input}",
                    "Ingénieur Backend": f"En tant que développeur backend, concevez une API FastAPI pour: {user_input}",
                    "Designer UI/UX": f"En tant que designer, proposez une interface utilisateur pour: {user_input}",
                    "Expert SEO/Contenu": f"En tant qu'expert SEO, optimisez le contenu pour: {user_input}",
                    "Spécialiste Base de Données": f"En tant qu'expert BDD, concevez un schéma pour: {user_input}",
                    "Expert DevOps": f"En tant qu'expert DevOps, proposez un déploiement pour: {user_input}",
                    "Critique Qualité": f"En tant que critique, analysez les points d'amélioration pour: {user_input}",
                    "Optimiseur de Code": f"En tant qu'optimiseur, améliorez la performance de: {user_input}",
                    "Traducteur": f"En tant que traducteur, adaptez ce contenu: {user_input}"
                }
                
                prompt = role_prompts.get(self.role, f"Répondez à cette demande: {user_input}")
                
                response = ollama.generate(
                    model=self.model, 
                    prompt=prompt,
                    options={
                        "num_predict": 300,
                        "temperature": 0.7,
                        "stop": ["---", "\n\n\n"],
                        "num_ctx": 4096
                    }
                )
                
                result = response['response'][:500]
                return f"{self.emoji} **{self.name}** ({self.role}):\n\n{result}"
                
            except Exception as e:
                if attempt == max_retries:
                    logger.error(f"Erreur action {self.name} après {max_retries} tentatives: {e}")
                    return self._generate_fallback_response(user_input)
                
                logger.warning(f"Tentative {attempt + 1} échouée pour {self.name}: {e}")
                await asyncio.sleep(1)
        
        return self._generate_fallback_response(user_input)
    
    def act(self, user_input: str, context: Dict[str, Any]) -> str:
        """Version synchrone pour compatibilité"""
        try:
            loop = asyncio.get_event_loop()
            return loop.run_until_complete(self.act_async(user_input, context))
        except RuntimeError:
            # Si pas de loop, utiliser la version synchrone
            return self._act_sync(user_input, context)
    
    def _act_sync(self, user_input: str, context: Dict[str, Any]) -> str:
        """Version synchrone de l'action"""
        if not self.check_model_availability():
            return self._generate_fallback_response(user_input)
        
        try:
            prompt = f"En tant que {self.role}, répondez à: {user_input}"
            response = ollama.generate(
                model=self.model, 
                prompt=prompt,
                options={
                    "num_predict": 300,
                    "temperature": 0.7,
                    "num_ctx": 4096
                }
            )
            result = response['response'][:500]
            return f"{self.emoji} **{self.name}** ({self.role}):\n\n{result}"
        except Exception as e:
            logger.error(f"Erreur action sync {self.name}: {e}")
            return self._generate_fallback_response(user_input)
    
    def _generate_fallback_response(self, user_input: str) -> str:
        """Réponse de fallback intelligente selon le rôle"""
        fallbacks = {
            "Team Leader / Visionnaire": f"🎯 Vision stratégique pour '{user_input[:30]}...': Approche collaborative recommandée avec analyse des besoins utilisateurs.",
            "Architecte Logiciel": f"🏗️ Architecture suggérée: Microservices avec FastAPI backend, React frontend, base de données adaptée au cas d'usage.",
            "Ingénieur Frontend": f"⚡ Solution frontend: Interface React avec composants réutilisables, état géré par hooks, design responsive.",
            "Ingénieur Backend": f"🔧 API backend: Endpoints FastAPI avec validation Pydantic, authentification JWT, documentation Swagger.",
            "Designer UI/UX": f"🎨 Design interface: Layout moderne, palette cohérente, expérience utilisateur intuitive avec animations fluides.",
            "Expert SEO/Contenu": f"📝 Optimisation SEO: Contenu structuré, mots-clés pertinents, balises meta optimisées pour le référencement.",
            "Spécialiste Base de Données": f"🗄️ Schéma BDD: Tables normalisées, index optimisés, relations bien définies selon les besoins.",
            "Expert DevOps": f"🚀 Déploiement: Conteneurs Docker, CI/CD automatisé, monitoring et scalabilité assurés.",
            "Critique Qualité": f"🔍 Points d'amélioration: Code review nécessaire, tests automatisés, sécurité à renforcer.",
            "Optimiseur de Code": f"⚡ Optimisations: Performance améliorée, code refactorisé, meilleures pratiques appliquées.",
            "Traducteur": f"🌐 Traduction: Adaptation multilingue avec contexte culturel et terminologie appropriée."
        }
        
        return fallbacks.get(self.role, f"{self.emoji} {self.name}: Réponse en cours de préparation...")

# Orchestrateur amélioré
class EnhancedOrchestrator:
    def __init__(self):
        self.agents = {}
        self.available_agents = {
            name: EnhancedAgent(name, config) 
            for name, config in AGENT_CONFIGS.items()
        }
        
    def get_agent_status(self) -> Dict[str, Dict]:
        """Retourne le statut de tous les agents"""
        status = {}
        for name, agent in self.available_agents.items():
            is_available = agent.check_model_availability()
            status[name] = {
                "available": is_available,
                "model": agent.model,
                "role": agent.role,
                "description": agent.description,
                "color": agent.color,
                "emoji": agent.emoji
            }
        return status
    
    def select_agents(self, agent_names: List[str]) -> List[EnhancedAgent]:
        """Sélection d'agents avec validation"""
        selected = []
        for name in agent_names[:5]:  # Limite à 5 agents
            if name in self.available_agents:
                selected.append(self.available_agents[name])
        return selected

# Workflow amélioré avec WebSocket
async def enhanced_workflow_with_websocket(
    orchestrator: EnhancedOrchestrator, 
    user_input: str, 
    selected_agents: List[str],
    websocket: WebSocket,
    session_id: str
) -> Dict[str, Any]:
    """Workflow amélioré avec communication WebSocket temps réel"""
    
    logger.info(f"🚀 Workflow Enhanced démarré - Session: {session_id}")
    
    try:
        # Sélection des agents
        agents = orchestrator.select_agents(selected_agents)
        
        if not agents:
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": "❌ Aucun agent valide sélectionné"
            }))
            return {"error": "No valid agents selected"}
        
        # Envoi du message de démarrage
        await websocket.send_text(json.dumps({
            "type": "workflow_start",
            "message": f"🚀 Workflow démarré avec {len(agents)} agents",
            "agents": [agent.name for agent in agents],
            "session_id": session_id
        }))
        
        results = {}
        context = {
            "session_id": session_id,
            "timestamp": datetime.now().isoformat(),
            "total_agents": len(agents)
        }
        
        for i, agent in enumerate(agents):
            stage = f"step_{i+1}"
            
            try:
                # Message de début d'étape
                await websocket.send_text(json.dumps({
                    "type": "agent_message",
                    "agent": agent.name,
                    "status": f"Étape {i+1}/{len(agents)} - En cours...",
                    "content": "🔄 Analyse en cours...",
                    "stage": stage,
                    "timestamp": datetime.now().isoformat()
                }))
                
                start_time = time.time()
                
                # Réflexion de l'agent
                thought = agent.think(context)
                
                # Action de l'agent (async)
                response = await agent.act_async(user_input, context)
                
                execution_time = time.time() - start_time
                
                # Stockage du résultat
                results[agent.name] = {
                    "thought": thought,
                    "response": response,
                    "execution_time": execution_time,
                    "model": agent.model
                }
                
                # Envoi du résultat via WebSocket
                await websocket.send_text(json.dumps({
                    "type": "agent_message", 
                    "agent": agent.name,
                    "status": "Terminé",
                    "content": response,
                    "stage": stage,
                    "elapsed": execution_time,
                    "timestamp": datetime.now().isoformat()
                }))
                
                logger.info(f"✅ {agent.name} terminé en {execution_time:.2f}s")
                
                # Pause entre agents
                await asyncio.sleep(0.5)
                
            except Exception as e:
                execution_time = time.time() - start_time
                error_msg = f"❌ Erreur {agent.name}: {str(e)[:100]}"
                
                results[agent.name] = {
                    "thought": "Erreur de réflexion",
                    "response": error_msg,
                    "execution_time": execution_time,
                    "model": agent.model
                }
                
                await websocket.send_text(json.dumps({
                    "type": "agent_message",
                    "agent": agent.name,
                    "status": "Erreur",
                    "content": error_msg,
                    "stage": stage,
                    "elapsed": execution_time,
                    "timestamp": datetime.now().isoformat()
                }))
                
                logger.error(f"❌ Erreur {agent.name}: {e}")
                logger.error(f"Traceback: {traceback.format_exc()}")
        
        # Message de fin de workflow
        await websocket.send_text(json.dumps({
            "type": "workflow_complete",
            "message": "✅ Workflow terminé avec succès !",
            "session_id": session_id,
            "results_count": len(results),
            "agents_executed": len(agents),
            "timestamp": datetime.now().isoformat()
        }))
        
        logger.info(f"🏁 Workflow Enhanced terminé - Session: {session_id}")
        return results
        
    except Exception as e:
        logger.error(f"🔥 Erreur critique workflow - Session: {session_id} - {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        try:
            await websocket.send_text(json.dumps({
                "type": "workflow_error",
                "message": f"❌ Erreur critique workflow: {str(e)[:100]}",
                "session_id": session_id
            }))
        except:
            pass
        
        return {"error": str(e)}

# Instances globales
orchestrator = EnhancedOrchestrator()
connection_manager = ConnectionManager()

# Routes API
@app.get("/")
async def root():
    """Endpoint racine avec statut détaillé"""
    try:
        agent_status = orchestrator.get_agent_status()
        available_count = sum(1 for status in agent_status.values() if status["available"])
        
        return {
            "message": "🚀 Backend Stable Enhanced - Agents IA Ollama",
            "version": "2.0.1",
            "status": "running",
            "agents_available": f"{available_count}/{len(agent_status)}",
            "active_connections": len(connection_manager.active_connections),
            "ollama_connection": "✅ Connecté" if available_count > 0 else "❌ Déconnecté",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Erreur endpoint root: {e}")
        return {
            "message": "⚠️ Backend en cours de démarrage",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@app.get("/agents")
async def get_agents():
    """Liste des agents avec statut en temps réel"""
    try:
        agent_status = orchestrator.get_agent_status()
        
        return {
            "agents": [
                {
                    "id": name,
                    "name": name,
                    "role": status["role"],
                    "model": status["model"],
                    "description": status["description"],
                    "color": status["color"],
                    "emoji": status["emoji"],
                    "available": status["available"],
                    "status": "✅ Prêt" if status["available"] else "❌ Modèle manquant"
                }
                for name, status in agent_status.items()
            ],
            "summary": {
                "total": len(agent_status),
                "available": sum(1 for s in agent_status.values() if s["available"]),
                "missing": sum(1 for s in agent_status.values() if not s["available"])
            }
        }
    except Exception as e:
        logger.error(f"Erreur get_agents: {e}")
        return {"error": str(e)}

@app.get("/models/check")
async def check_ollama_models():
    """Vérifie les modèles Ollama disponibles"""
    try:
        models = ollama.list()
        available_models = [model['name'] for model in models.get('models', [])]
        
        required_models = list(set(config["model"] for config in AGENT_CONFIGS.values()))
        missing_models = [model for model in required_models if model not in available_models]
        
        return {
            "ollama_status": "✅ Connecté",
            "total_models": len(available_models),
            "available_models": available_models,
            "required_models": required_models,
            "missing_models": missing_models,
            "setup_commands": [f"ollama pull {model}" for model in missing_models] if missing_models else []
        }
    except Exception as e:
        logger.error(f"Erreur check_ollama_models: {e}")
        return {
            "ollama_status": "❌ Déconnecté",
            "error": str(e),
            "suggestion": "Démarrez Ollama avec: ollama serve"
        }

@app.get("/server/status")
async def server_status():
    """Statut détaillé du serveur"""
    try:
        agent_status = orchestrator.get_agent_status()
        
        return {
            "status": "✅ Opérationnel",
            "timestamp": datetime.now().isoformat(),
            "connections": {
                "active": len(connection_manager.active_connections),
                "max_allowed": connection_manager.max_connections
            },
            "agents": {
                "total": len(orchestrator.available_agents),
                "available": len([a for a in orchestrator.available_agents.values() if a.check_model_availability()])
            },
            "system": {
                "python_version": f"{__import__('sys').version_info.major}.{__import__('sys').version_info.minor}",
                "fastapi_version": "Latest"
            }
        }
    except Exception as e:
        logger.error(f"Erreur server_status: {e}")
        return {"error": str(e)}

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """Endpoint WebSocket robuste et sécurisé"""
    
    # Validation du session_id
    if not session_id or len(session_id) < 3:
        await websocket.close(code=1008, reason="Session ID invalide")
        return
    
    # Connexion avec gestionnaire
    if not await connection_manager.connect(websocket, session_id):
        return
    
    try:
        # Message de connexion
        await websocket.send_text(json.dumps({
            "type": "connection_established",
            "message": "✅ Connexion WebSocket établie",
            "session_id": session_id,
            "timestamp": datetime.now().isoformat(),
            "server_info": {
                "version": "2.0.1",
                "active_connections": len(connection_manager.active_connections)
            }
        }))
        
        while True:
            try:
                # Timeout pour éviter les connexions bloquées
                data = await asyncio.wait_for(
                    websocket.receive_text(), 
                    timeout=300.0  # 5 minutes timeout
                )
                
                message_data = json.loads(data)
                
                # Validation du message
                if not isinstance(message_data, dict):
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "message": "❌ Format de message invalide"
                    }))
                    continue
                
                # Gestion des différents types de messages
                if message_data.get("type") == "chat_request":
                    prompt = message_data.get("prompt", "").strip()
                    selected_agents = message_data.get("selected_agents", [])
                    
                    # Validation des données
                    if not prompt:
                        await websocket.send_text(json.dumps({
                            "type": "error",
                            "message": "❌ Prompt vide"
                        }))
                        continue
                    
                    if not selected_agents:
                        await websocket.send_text(json.dumps({
                            "type": "error",
                            "message": "❌ Aucun agent sélectionné"
                        }))
                        continue
                    
                    # Limiter le nombre d'agents
                    if len(selected_agents) > 5:
                        selected_agents = selected_agents[:5]
                        await websocket.send_text(json.dumps({
                            "type": "warning",
                            "message": "⚠️ Limité à 5 agents maximum"
                        }))
                    
                    # Exécuter le workflow
                    await enhanced_workflow_with_websocket(
                        orchestrator, prompt, selected_agents, websocket, session_id
                    )
                
                elif message_data.get("type") == "ping":
                    # Répondre au ping du client
                    await websocket.send_text(json.dumps({
                        "type": "pong",
                        "timestamp": datetime.now().isoformat()
                    }))
                
                elif message_data.get("type") == "get_agents":
                    # Envoyer la liste des agents
                    agent_status = orchestrator.get_agent_status()
                    await websocket.send_text(json.dumps({
                        "type": "agents_list",
                        "agents": agent_status
                    }))
                
                else:
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "message": f"❌ Type de message non reconnu: {message_data.get('type')}"
                    }))
                
            except asyncio.TimeoutError:
                logger.warning(f"[{session_id}] Timeout - connexion fermée")
                break
            except WebSocketDisconnect:
                logger.info(f"[{session_id}] Connexion fermée par le client")
                break
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "❌ Format JSON invalide"
                }))
            except Exception as e:
                logger.error(f"[{session_id}] Erreur WebSocket: {e}")
                logger.error(f"Traceback: {traceback.format_exc()}")
                await websocket.send_text(json.dumps({
                    "type": "error", 
                    "message": f"❌ Erreur: {str(e)}"
                }))
                
    except Exception as e:
        logger.error(f"[{session_id}] Erreur critique WebSocket: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
    finally:
        # Nettoyage
        await connection_manager.disconnect(session_id)

@app.post("/chat")
async def chat_with_agent(request: ChatRequest):
    """Chat direct avec un agent"""
    try:
        if request.agent_name not in orchestrator.available_agents:
            raise HTTPException(status_code=404, detail="Agent non trouvé")
            
        agent = orchestrator.available_agents[request.agent_name]
        start_time = time.time()
        
        response = agent.act(request.message, request.context or {})
        execution_time = time.time() - start_time
        
        return AgentResponse(
            agent=agent.name,
            response=response,
            model=agent.model,
            execution_time=execution_time,
            timestamp=datetime.now()
        )
    except Exception as e:
        logger.error(f"Erreur chat_with_agent: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/workflow")
async def run_stable_workflow(request: WorkflowRequest):
    """Workflow HTTP (version simplifiée)"""
    try:
        if request.agent_names:
            agents = orchestrator.select_agents(request.agent_names)
        else:
            agents = orchestrator.select_agents(["Mike", "Bob", "FrontEngineer"])
        
        context = {
            "timestamp": datetime.now().isoformat(),
            "user_input_length": len(request.user_input)
        }
        
        results = {}
        for agent in agents:
            try:
                start_time = time.time()
                thought = agent.think(context)
                response = agent.act(request.user_input, context)
                execution_time = time.time() - start_time
                
                results[agent.name] = {
                    "thought": thought,
                    "response": response,
                    "execution_time": execution_time,
                    "model": agent.model
                }
            except Exception as e:
                logger.error(f"Erreur agent {agent.name}: {e}")
                results[agent.name] = {
                    "thought": "Erreur",
                    "response": f"Erreur: {str(e)}",
                    "execution_time": 0,
                    "model": agent.model
                }
        
        return {
            "status": "success",
            "user_input": request.user_input,
            "agents_used": [agent.name for agent in agents],
            "results": results,
            "execution_timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Erreur run_stable_workflow: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/test")
async def test_endpoint():
    """Test de connectivité"""
    return {
        "status": "✅ Backend opérationnel",
        "timestamp": datetime.now().isoformat(),
        "port": 8002,
        "version": "2.0.1"
    }

@app.post("/admin/close-session/{session_id}")
async def force_close_session(session_id: str):
    """Force la fermeture d'une session WebSocket"""
    try:
        if session_id in connection_manager.active_connections:
            websocket = connection_manager.active_connections[session_id]
            await websocket.close(code=1000, reason="Session fermée par l'administrateur")
            await connection_manager.disconnect(session_id)
            return {"message": f"Session {session_id} fermée"}
        return {"error": "Session non trouvée"}
    except Exception as e:
        logger.error(f"Erreur force_close_session: {e}")
        return {"error": str(e)}

@app.on_event("startup")
async def startup_event():
    """Événement de démarrage"""
    logger.info("🚀 Backend Enhanced démarré")
    logger.info(f"📡 WebSocket disponible sur: ws://localhost:8002/ws/{{session_id}}")
    logger.info(f"🔗 API documentation: http://localhost:8002/docs")
    
    # Vérifier Ollama au démarrage
    try:
        models = ollama.list()
        logger.info(f"✅ Ollama connecté - {len(models.get('models', []))} modèles disponibles")
    except Exception as e:
        logger.warning(f"⚠️ Ollama non disponible: {e}")

@app.on_event("shutdown") 
async def shutdown_event():
    """Événement de fermeture"""
    logger.info("🛑 Fermeture du backend...")
    
    # Fermer toutes les connexions WebSocket
    for session_id in list(connection_manager.active_connections.keys()):
        try:
            websocket = connection_manager.active_connections[session_id]
            await websocket.close(code=1001, reason="Serveur en cours de fermeture")
            await connection_manager.disconnect(session_id)
        except Exception:
            pass
    
    logger.info("✅ Backend fermé proprement")

if __name__ == "__main__":
    import uvicorn
    
    # Configuration de production
    config = {
        "app": app,
        "host": "0.0.0.0",
        "port": 8002,
        "reload": False,
        "log_level": "info",
        "access_log": True,
        "ws_ping_interval": 20,  # Ping WebSocket toutes les 20 secondes
        "ws_ping_timeout": 10,   # Timeout ping à 10 secondes
        "workers": 1,  # Important pour WebSocket
        "loop": "asyncio"
    }
    
    logger.info("🚀 Démarrage du serveur Backend Enhanced")
    logger.info(f"📡 WebSocket disponible sur: ws://localhost:8002/ws/{{session_id}}")
    logger.info(f"🔗 API documentation: http://localhost:8002/docs")
    
    uvicorn.run(**config)
