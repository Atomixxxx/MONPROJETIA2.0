# --- CONFIGURATION DES AGENTS ---
AGENT_CONFIGS = {
    "Mike": {
        "model": "agent-visionnaire",
        "role": "Team Leader / Visionnaire",
        "description": "Coordinateur de projet et définition de vision",
        "color": "#6366F1",
        "emoji": "🔮"
    },
    "Bob": {
        "model": "agent-architecte", 
        "role": "Architecte Logiciel",
        "description": "Expert en architecture technique",
        "color": "#3B82F6",
        "emoji": "🏗️"
    },
    "FrontEngineer": {
        "model": "agent-frontend-engineer",
        "role": "Ingénieur Frontend", 
        "description": "Développeur React/JavaScript",
        "color": "#F59E0B",
        "emoji": "🎨"
    },
    "BackEngineer": {
        "model": "agent-backend-engineer",
        "role": "Ingénieur Backend",
        "description": "Développeur FastAPI/Python",
        "color": "#10B981", 
        "emoji": "⚙️"
    },
    "UIDesigner": {
        "model": "agent-designer-ui-ux",
        "role": "Designer UI/UX",
        "description": "Expert en design d'interface",
        "color": "#8B5CF6",
        "emoji": "✨"
    },
    "SEOCopty": {
        "model": "agent-seo-content-expert",
        "role": "Expert SEO/Contenu",
        "description": "Spécialiste SEO et contenu",
        "color": "#059669",
        "emoji": "📈"
    },
    "DBMaster": {
        "model": "agent-database-specialist",
        "role": "Spécialiste Base de Données", 
        "description": "Expert en bases de données",
        "color": "#EF4444",
        "emoji": "🗃️"
    },
    "DevOpsGuy": {
        "model": "agent-deployer-devops",
        "role": "Expert DevOps",
        "description": "Spécialiste déploiement",
        "color": "#06B6D4",
        "emoji": "🚀"
    },
    "TheCritique": {
        "model": "agent-critique",
        "role": "Critique Qualité",
        "description": "Expert en qualité et sécurité",
        "color": "#F97316", 
        "emoji": "🔍"
    },
    "TheOptimizer": {
        "model": "agent-optimiseur",
        "role": "Optimiseur de Code",
        "description": "Expert en optimisation",
        "color": "#84CC16",
        "emoji": "⚡"
    },
    "TranslatorBot": {
        "model": "agent-translator",
        "role": "Traducteur",
        "description": "Expert en traduction",
        "color": "#0EA5E9",
        "emoji": "🌍"
    }
}

# --- ENHANCED AGENT CLASS ---
class EnhancedAgent:
    def __init__(self, name: str, config: dict):
        self.name = name
        self.id = name  # Correspondance front
        self.model = config["model"]
        self.role = config["role"]
        self.description = config["description"]
        self.color = config["color"]
        self.emoji = config["emoji"]
        self._model_available = None
        self._last_check = 0

    def check_model_availability(self) -> bool:
        import time
        current_time = time.time()
        if self._model_available is not None and (current_time - self._last_check) < 60:
            return self._model_available
        try:
            models = ollama.list()
            available_models = [model['name'] for model in models.get('models', [])]
            self._model_available = self.model in available_models
            self._last_check = current_time
            if not self._model_available:
                logger.warning(f"Modèle {self.model} non trouvé. Modèles dispos: {available_models}")
            return self._model_available
        except Exception as e:
            logger.error(f"Erreur vérif modèle {self.model}: {e}")
            self._model_available = False
            return False

# --- ENHANCED ORCHESTRATOR ---
class EnhancedOrchestrator:
    def __init__(self):
        self.agents = {}
        self.available_agents = {
            name: EnhancedAgent(name, config)
            for name, config in AGENT_CONFIGS.items()
        }
        logger.info(f"Orchestrateur initialisé avec {len(self.available_agents)} agents :")
        for name, agent in self.available_agents.items():
            logger.info(f"  - {name} ({agent.model}) - {'✅' if agent.check_model_availability() else '❌'}")

    def get_agent_status(self):
        status = {}
        for name, agent in self.available_agents.items():
            try:
                is_available = agent.check_model_availability()
                status[name] = {
                    "id": agent.id,
                    "name": agent.name,
                    "available": is_available,
                    "model": agent.model,
                    "role": agent.role,
                    "description": agent.description,
                    "color": agent.color,
                    "emoji": agent.emoji,
                    "status": "✅ Prêt" if is_available else f"❌ Modèle {agent.model} manquant"
                }
            except Exception as e:
                logger.error(f"Erreur lors de la vérif agent {name}: {e}")
                status[name] = {
                    "id": name,
                    "name": name,
                    "available": False,
                    "model": "unknown",
                    "role": "unknown",
                    "description": "Erreur de config",
                    "color": "#666666",
                    "emoji": "❌",
                    "status": f"❌ Erreur: {str(e)}"
                }
        return status

# --- ROUTE /chat ---
@app.post("/chat")
async def chat_with_agent(request: ChatRequest):
    try:
        agent_id = request.agent_name
        if agent_id not in orchestrator.available_agents:
            available_agents = list(orchestrator.available_agents.keys())
            logger.error(f"Agent '{agent_id}' non trouvé. Agents dispos: {available_agents}")
            raise HTTPException(
                status_code=404,
                detail=f"Agent '{agent_id}' non trouvé. Agents dispos: {available_agents}"
            )
        agent = orchestrator.available_agents[agent_id]
        if not agent.check_model_availability():
            raise HTTPException(
                status_code=503,
                detail=f"Modèle {agent.model} non disponible. Installez-le avec: ollama pull {agent.model}"
            )
        import time
        start_time = time.time()
        try:
            response = await agent.act_async(request.message, request.context or {})
        except Exception as e:
            logger.error(f"Erreur exécution agent {agent_id}: {e}")
            response = agent._generate_fallback_response(request.message)
        execution_time = time.time() - start_time
        return {
            "agent": agent.name,
            "response": response,
            "model": agent.model,
            "execution_time": execution_time,
            "timestamp": datetime.now().isoformat(),
            "success": True
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur inattendue dans chat_with_agent: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Erreur interne: {str(e)}")

# --- ROUTE /test ---
@app.get("/test")
async def test_endpoint():
    try:
        try:
            ollama_models = ollama.list()
            ollama_status = "✅ Connecté"
            models_count = len(ollama_models.get('models', []))
        except Exception as e:
            ollama_status = f"❌ Erreur: {str(e)}"
            models_count = 0
        agent_status = orchestrator.get_agent_status()
        available_agents = sum(1 for status in agent_status.values() if status["available"])
        return {
            "status": "✅ Backend opérationnel",
            "timestamp": datetime.now().isoformat(),
            "port": 8002,
            "version": "2.0.1",
            "ollama": {
                "status": ollama_status,
                "models_count": models_count
            },
            "agents": {
                "total": len(agent_status),
                "available": available_agents,
                "missing": len(agent_status) - available_agents
            },
            "endpoints": {
                "api_docs": "http://localhost:8002/docs",
                "agents_list": "http://localhost:8002/agents",
                "websocket": "ws://localhost:8002/ws/{session_id}"
            }
        }
    except Exception as e:
        logger.error(f"Erreur dans test_endpoint: {e}")
        return {
            "status": "⚠️ Backend partiellement opérationnel",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

# --- INSTALLATION D'UN MODÈLE ---
@app.post("/admin/install-model/{model_name}")
async def install_model(model_name: str):
    try:
        import subprocess
        logger.info(f"Installation du modèle {model_name}...")
        process = subprocess.Popen(
            ["ollama", "pull", model_name],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        try:
            stdout, stderr = process.communicate(timeout=5)
            if process.returncode == 0:
                return {"success": True, "message": f"Modèle {model_name} installé avec succès"}
            else:
                return {"success": False, "error": stderr}
        except subprocess.TimeoutExpired:
            return {"success": True, "message": f"Installation de {model_name} en cours..."}
    except Exception as e:
        logger.error(f"Erreur installation modèle {model_name}: {e}")
        return {"success": False, "error": str(e)}

# --- LOGS AU DÉMARRAGE ---
@app.on_event("startup")
async def startup_event():
    logger.info("🚀 Backend Enhanced démarré")
    logger.info(f"📡 WebSocket: ws://localhost:8002/ws/{{session_id}}")
    logger.info(f"🔗 API docs: http://localhost:8002/docs")
    try:
        models = ollama.list()
        available_models = [model['name'] for model in models.get('models', [])]
        logger.info(f"✅ Ollama connecté - {len(available_models)} modèles dispos")
        required_models = list(set(config["model"] for config in AGENT_CONFIGS.values()))
        missing_models = [model for model in required_models if model not in available_models]
        if missing_models:
            logger.warning(f"⚠️ Modèles manquants: {missing_models}")
            logger.info("💡 Installez-les:")
            for model in missing_models:
                logger.info(f"   ollama pull {model}")
        else:
            logger.info("🎉 Tous les modèles requis sont installés!")
    except Exception as e:
        logger.warning(f"⚠️ Ollama non dispo: {e}")
        logger.info("💡 Démarrez Ollama avec: ollama serve")
    agent_status = orchestrator.get_agent_status()
    available_count = sum(1 for status in agent_status.values() if status["available"])
    logger.info(f"🤖 Agents: {available_count}/{len(agent_status)} disponibles")
    for name, status in agent_status.items():
        if status["available"]:
            logger.info(f"   ✅ {status['emoji']} {name} ({status['model']})")
        else:
            logger.warning(f"   ❌ {status['emoji']} {name} ({status['model']}) - {status['status']}")

# --- CONFIGURATION CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:3001", 
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://localhost:4173",
        "http://127.0.0.1:4173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# --- PORT D'ECOUTE EN PRODUCTION ---
if __name__ == "__main__":
    import uvicorn
    logger.info("🚀 Démarrage du serveur Backend Enhanced")
    logger.info(f"📡 API dispo: http://localhost:8002")
    logger.info(f"📡 WebSocket: ws://localhost:8002/ws/{{session_id}}")
    logger.info(f"🔗 API docs: http://localhost:8002/docs")
    logger.info(f"🔧 Debug agents: http://localhost:8002/debug/agents")
    uvicorn.run(app, host="0.0.0.0", port=8002, reload=False, log_level="info")
