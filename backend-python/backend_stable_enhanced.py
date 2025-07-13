# Ajoutez ces corrections à votre backend_stable_enhanced.py

# 1. CORRECTION: Configuration des agents pour correspondre au frontend
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

# 2. CORRECTION: Classe EnhancedAgent modifiée
class EnhancedAgent:
    def __init__(self, name: str, config: dict):
        self.name = name
        self.id = name  # AJOUT: ID identique au nom pour correspondance frontend
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
            
            # Log pour debug
            if not self._model_available:
                logger.warning(f"Modèle {self.model} non trouvé. Modèles disponibles: {available_models}")
            
            return self._model_available
        except Exception as e:
            logger.error(f"Erreur vérification modèle {self.model}: {e}")
            self._model_available = False
            return False

# 3. CORRECTION: Orchestrateur modifié
class EnhancedOrchestrator:
    def __init__(self):
        self.agents = {}
        self.available_agents = {
            name: EnhancedAgent(name, config) 
            for name, config in AGENT_CONFIGS.items()
        }
        
        # Log des agents créés
        logger.info(f"Orchestrateur initialisé avec {len(self.available_agents)} agents:")
        for name, agent in self.available_agents.items():
            logger.info(f"  - {name} ({agent.model}) - {'✅' if agent.check_model_availability() else '❌'}")
        
    def get_agent_status(self) -> Dict[str, Dict]:
        """Retourne le statut de tous les agents"""
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
                logger.error(f"Erreur lors de la vérification de l'agent {name}: {e}")
                status[name] = {
                    "id": name,
                    "name": name,
                    "available": False,
                    "model": "unknown",
                    "role": "unknown",
                    "description": "Erreur de configuration",
                    "color": "#666666",
                    "emoji": "❌",
                    "status": f"❌ Erreur: {str(e)}"
                }
        return status

# 4. CORRECTION: Route /chat modifiée pour gérer les agents par ID
@app.post("/chat")
async def chat_with_agent(request: ChatRequest):
    """Chat direct avec un agent"""
    try:
        # CORRECTION: Utiliser l'ID exact pour trouver l'agent
        agent_id = request.agent_name
        
        if agent_id not in orchestrator.available_agents:
            available_agents = list(orchestrator.available_agents.keys())
            logger.error(f"Agent '{agent_id}' non trouvé. Agents disponibles: {available_agents}")
            raise HTTPException(
                status_code=404, 
                detail=f"Agent '{agent_id}' non trouvé. Agents disponibles: {available_agents}"
            )
            
        agent = orchestrator.available_agents[agent_id]
        
        # Vérifier que le modèle est disponible
        if not agent.check_model_availability():
            raise HTTPException(
                status_code=503, 
                detail=f"Modèle {agent.model} non disponible. Installez-le avec: ollama pull {agent.model}"
            )
        
        start_time = time.time()
        
        # CORRECTION: Utiliser act_async avec gestion d'erreur
        try:
            response = await agent.act_async(request.message, request.context or {})
        except Exception as e:
            logger.error(f"Erreur lors de l'exécution de l'agent {agent_id}: {e}")
            response = agent._generate_fallback_response(request.message)
        
        execution_time = time.time() - start_time
        
        # CORRECTION: Structure de réponse attendue par le frontend
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

# 5. CORRECTION: Route /test améliorée
@app.get("/test")
async def test_endpoint():
    """Endpoint de test avec informations détaillées"""
    try:
        # Test de connexion Ollama
        try:
            ollama_models = ollama.list()
            ollama_status = "✅ Connecté"
            models_count = len(ollama_models.get('models', []))
        except Exception as e:
            ollama_status = f"❌ Erreur: {str(e)}"
            models_count = 0
        
        # Statut des agents
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

# 6. CORRECTION: Endpoint pour installer un modèle manquant
@app.post("/admin/install-model/{model_name}")
async def install_model(model_name: str):
    """Installe un modèle Ollama manquant"""
    try:
        import subprocess
        
        logger.info(f"Installation du modèle {model_name}...")
        
        # Exécuter ollama pull en arrière-plan
        process = subprocess.Popen(
            ["ollama", "pull", model_name],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Attendre un peu pour voir si la commande démarre
        try:
            stdout, stderr = process.communicate(timeout=5)
            if process.returncode == 0:
                return {"success": True, "message": f"Modèle {model_name} installé avec succès"}
            else:
                return {"success": False, "error": stderr}
        except subprocess.TimeoutExpired:
            # La commande prend du temps, c'est normal
            return {"success": True, "message": f"Installation de {model_name} en cours..."}
            
    except Exception as e:
        logger.error(f"Erreur lors de l'installation du modèle {model_name}: {e}")
        return {"success": False, "error": str(e)}

# 7. CORRECTION: Logs améliorés au démarrage
@app.on_event("startup")
async def startup_event():
    """Événement de démarrage avec vérifications"""
    logger.info("🚀 Backend Enhanced démarré")
    logger.info(f"📡 WebSocket disponible sur: ws://localhost:8002/ws/{{session_id}}")
    logger.info(f"🔗 API documentation: http://localhost:8002/docs")
    
    # Vérifier Ollama au démarrage
    try:
        models = ollama.list()
        available_models = [model['name'] for model in models.get('models', [])]
        logger.info(f"✅ Ollama connecté - {len(available_models)} modèles disponibles")
        
        # Vérifier chaque modèle requis
        required_models = list(set(config["model"] for config in AGENT_CONFIGS.values()))
        missing_models = [model for model in required_models if model not in available_models]
        
        if missing_models:
            logger.warning(f"⚠️ Modèles manquants: {missing_models}")
            logger.info("💡 Pour installer les modèles manquants:")
            for model in missing_models:
                logger.info(f"   ollama pull {model}")
        else:
            logger.info("🎉 Tous les modèles requis sont installés!")
            
    except Exception as e:
        logger.warning(f"⚠️ Ollama non disponible: {e}")
        logger.info("💡 Démarrez Ollama avec: ollama serve")
    
    # Statut des agents
    agent_status = orchestrator.get_agent_status()
    available_count = sum(1 for status in agent_status.values() if status["available"])
    logger.info(f"🤖 Agents: {available_count}/{len(agent_status)} disponibles")
    
    for name, status in agent_status.items():
        if status["available"]:
            logger.info(f"   ✅ {status['emoji']} {name} ({status['model']})")
        else:
            logger.warning(f"   ❌ {status['emoji']} {name} ({status['model']}) - {status['status']}")

# 8. CORRECTION: Gestion d'erreur améliorée pour le WebSocket
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
        # Message de connexion avec statut des agents
        agent_status = orchestrator.get_agent_status()
        available_agents = sum(1 for status in agent_status.values() if status["available"])
        
        await websocket.send_text(json.dumps({
            "type": "connection_established",
            "message": "✅ Connexion WebSocket établie",
            "session_id": session_id,
            "timestamp": datetime.now().isoformat(),
            "server_info": {
                "version": "2.0.1",
                "active_connections": len(connection_manager.active_connections),
                "agents_available": f"{available_agents}/{len(agent_status)}"
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
                
                # Log de debug
                logger.debug(f"[{session_id}] Message reçu: {message_data.get('type')}")
                
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
                        # Utiliser des agents par défaut
                        selected_agents = ["Mike", "Bob", "FrontEngineer"]
                        await websocket.send_text(json.dumps({
                            "type": "info",
                            "message": f"ℹ️ Agents par défaut sélectionnés: {', '.join(selected_agents)}"
                        }))
                    
                    # Limiter le nombre d'agents
                    if len(selected_agents) > 5:
                        selected_agents = selected_agents[:5]
                        await websocket.send_text(json.dumps({
                            "type": "warning",
                            "message": "⚠️ Limité à 5 agents maximum"
                        }))
                    
                    # Vérifier que les agents existent
                    valid_agents = []
                    for agent_id in selected_agents:
                        if agent_id in orchestrator.available_agents:
                            valid_agents.append(agent_id)
                        else:
                            logger.warning(f"Agent {agent_id} non trouvé")
                    
                    if not valid_agents:
                        await websocket.send_text(json.dumps({
                            "type": "error",
                            "message": "❌ Aucun agent valide sélectionné"
                        }))
                        continue
                    
                    # Exécuter le workflow
                    try:
                        await enhanced_workflow_with_websocket(
                            orchestrator, prompt, valid_agents, websocket, session_id
                        )
                    except Exception as workflow_error:
                        logger.error(f"[{session_id}] Erreur workflow: {workflow_error}")
                        await websocket.send_text(json.dumps({
                            "type": "workflow_error",
                            "message": f"❌ Erreur workflow: {str(workflow_error)}"
                        }))
                
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

# 9. CORRECTION: Configuration CORS élargie
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:3001", 
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://localhost:4173",  # Vite preview
        "http://127.0.0.1:4173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# 10. CORRECTION: Endpoint de debug pour les développeurs
@app.get("/debug/agents")
async def debug_agents():
    """Endpoint de debug pour vérifier l'état des agents"""
    try:
        # Informations détaillées sur chaque agent
        agents_debug = {}
        
        for name, agent in orchestrator.available_agents.items():
            try:
                # Test de disponibilité du modèle
                model_available = agent.check_model_availability()
                
                # Test de génération simple
                test_response = "Non testé"
                if model_available:
                    try:
                        test_response = await agent.act_async("Dis simplement 'Je fonctionne correctement'", {})
                        test_response = test_response[:100] + "..." if len(test_response) > 100 else test_response
                    except Exception as test_error:
                        test_response = f"Erreur test: {str(test_error)}"
                
                agents_debug[name] = {
                    "id": agent.id,
                    "model": agent.model,
                    "role": agent.role,
                    "model_available": model_available,
                    "test_response": test_response,
                    "last_check": agent._last_check,
                    "config": {
                        "emoji": agent.emoji,
                        "color": agent.color,
                        "description": agent.description
                    }
                }
            except Exception as agent_error:
                agents_debug[name] = {
                    "error": str(agent_error),
                    "model": getattr(agent, 'model', 'unknown')
                }
        
        # Informations Ollama
        try:
            ollama_models = ollama.list()
            ollama_info = {
                "status": "available",
                "models": [model['name'] for model in ollama_models.get('models', [])]
            }
        except Exception as e:
            ollama_info = {
                "status": "error",
                "error": str(e)
            }
        
        return {
            "agents": agents_debug,
            "ollama": ollama_info,
            "server": {
                "timestamp": datetime.now().isoformat(),
                "active_connections": len(connection_manager.active_connections)
            }
        }
    except Exception as e:
        logger.error(f"Erreur debug_agents: {e}")
        return {"error": str(e)}

# 11. CORRECTION: Configuration du port explicite
if __name__ == "__main__":
    import uvicorn
    
    # Configuration de production avec port explicite
    config = {
        "app": app,
        "host": "0.0.0.0",
        "port": 8002,  # IMPORTANT: Port 8002 explicite
        "reload": False,
        "log_level": "info",
        "access_log": True,
        "ws_ping_interval": 20,
        "ws_ping_timeout": 10,
        "workers": 1,
        "loop": "asyncio"
    }
    
    logger.info("🚀 Démarrage du serveur Backend Enhanced")
    logger.info(f"📡 API disponible sur: http://localhost:8002")
    logger.info(f"📡 WebSocket disponible sur: ws://localhost:8002/ws/{{session_id}}")
    logger.info(f"🔗 Documentation API: http://localhost:8002/docs")
    logger.info(f"🔧 Debug agents: http://localhost:8002/debug/agents")
    
# Dans backend-python/backend_stable_enhanced.py
# LIGNE FINALE, remplacer:
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)  # ← Changer 8002 → 8000
