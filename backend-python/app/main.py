import sys
import os

# Ceci ajoute le répertoire parent (monangent_IA) au chemin de recherche des modules Python.
# Cela permet d'importer 'app.agents' et 'app.common.utils' correctement lorsque main.py est lancé depuis la racine du projet.
current_dir = os.path.dirname(os.path.abspath(__file__))
# Si main.py est dans 'app/', alors la racine du projet est le répertoire parent de 'app/'.
# Donc, nous devons remonter d'un niveau depuis 'current_dir'.
project_root = os.path.dirname(current_dir)
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Imports des modules de votre application
# Ces imports sont maintenant absolus par rapport à la racine du projet qui est dans sys.path
from app.agents import agents, get_agent_by_name
from app.common.utils import send_agent_message

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
import json
import glob
from datetime import datetime
import subprocess
import tempfile
import asyncio
import time
import traceback
import aiofiles # Utilisé pour les opérations de fichiers asynchrones

app = FastAPI(title="Multi-Agents IA Chat", version="1.0.0")

# --- Configuration CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Modèles Pydantic ---
class ChatMessage(BaseModel):
    agent_name: str
    message: str

class CodeExecutionRequest(BaseModel):
    code: str
    language: str

# --- Fonctions utilitaires du workflow ---
def extract_code_block(text, language_tag):
    """Extrait le premier bloc de code pour le langage donné."""
    try:
        start = text.index(f"```{language_tag}") + len(f"```{language_tag}")
        end = text.index("```", start)
        return text[start:end].strip()
    except ValueError:
        return ""

async def ensure_agent_exists(agent_name, stage, websocket):
    """Vérifie qu'un agent existe, sinon envoie un message d'erreur."""
    agent = get_agent_by_name(agent_name)
    if not agent:
        # Utilisation de agent_name ici car nous n'avons pas d'objet agent valide
        await send_agent_message("System", "Erreur critique", f"Agent {agent_name} introuvable. Vérifiez agents.py.", stage, websocket, elapsed=None)
    return agent

# --- Fonction principale de workflow pour la création de site web ---
async def run_website_creation_workflow(websocket: WebSocket, prompt: str, session_id: str):
    """
    Orchestre une équipe d'agents IA pour réaliser la création d'un site web complet,
    en envoyant des mises à jour en temps réel via WebSocket.
    """
    project_context = {
        "user_request": prompt,
        "vision": "",
        "architecture_plan": "",
        "ui_design_proposals": "",
        "seo_content": "",
        "database_schema": "",
        "backend_code": "",
        "frontend_code": "",
        "critique_reports": {},
        "optimized_code": {"frontend": "", "backend": ""},
        "deployment_scripts": "",
        "translations": {}
    }

    generated_files_dir = os.path.join("generated_code", session_id)
    os.makedirs(generated_files_dir, exist_ok=True)

    # Vérification et initialisation des agents nécessaires pour le workflow
    visionnaire = await ensure_agent_exists("Mike", "init", websocket)
    if not visionnaire: return
    
    architecte = await ensure_agent_exists("Bob", "init", websocket)
    if not architecte: return

    designer = await ensure_agent_exists("UIDesigner", "init", websocket)
    if not designer: return

    seo_expert = await ensure_agent_exists("SEOCopty", "init", websocket)
    if not seo_expert: return

    db_specialist = await ensure_agent_exists("DBMaster", "init", websocket)
    # db_specialist n'est pas critique, donc pas de 'return' ici s'il est None

    backend_engineer_agent = await ensure_agent_exists("BackEngineer", "init", websocket)
    if not backend_engineer_agent: return

    frontend_engineer_agent = await ensure_agent_exists("FrontEngineer", "init", websocket)
    if not frontend_engineer_agent: return

    critique = await ensure_agent_exists("TheCritique", "init", websocket)
    if not critique: return

    optimiseur = await ensure_agent_exists("TheOptimizer", "init", websocket)
    if not optimiseur: return

    deployer = await ensure_agent_exists("DevOpsGuy", "init", websocket)
    # deployer n'est pas critique, donc pas de 'return' ici s'il est None

    # --- Démarrage du Workflow ---
    await send_agent_message("System", "Démarrage du workflow", "Lancement de la séquence de développement de site web.", "init", websocket, elapsed=None)

    # ----------------- Étape 1 : Vision du projet -----------------
    # Correction: Passer agent.name à send_agent_message
    await send_agent_message(visionnaire.name, "Démarre l'analyse des besoins et définit la vision du projet.", "...", "vision", websocket)
    start_time = time.time()
    # Correction: Utiliser asyncio.to_thread pour aask car aask est synchrone
    vision_response = await asyncio.to_thread(visionnaire.aask, prompt) 
    elapsed = time.time() - start_time
    project_context["vision"] = vision_response
    # Correction: Passer agent.name à send_agent_message
    await send_agent_message(visionnaire.name, "Vision définie", vision_response, "vision", websocket, elapsed)

    # ----------------- Étape 2 : Architecture -----------------
    # Correction: Passer agent.name à send_agent_message
    await send_agent_message(architecte.name, "Conçoit l'architecture technique du site web.", "...", "architecture", websocket)
    start_time = time.time()
    architecture_prompt = (
        f"Basé sur la vision suivante: '{project_context['vision']}', "
        "propose un plan d'architecture détaillé pour un site web de restaurant italien. "
        "Le plan doit inclure la structure technique du frontend (React), du backend (FastAPI) et la base de données (si nécessaire, ex: pour les réservations, le menu). "
        "Démontre la structure des dossiers et les interfaces principales (API). "
        "Mets en évidence les considérations de performance, sécurité et scalabilité."
    )
    # Correction: Utiliser asyncio.to_thread pour aask
    architecture_plan = await asyncio.to_thread(architecte.aask, architecture_prompt) 
    elapsed = time.time() - start_time
    project_context["architecture_plan"] = architecture_plan
    # Correction: Passer agent.name à send_agent_message
    await send_agent_message(architecte.name, "Plan d'architecture généré", architecture_plan, "architecture", websocket, elapsed)
    
    async with aiofiles.open(os.path.join(generated_files_dir, "architecture_plan.md"), "w", encoding="utf-8") as f:
        await f.write(architecture_plan)

    # ----------------- Étape 3 : Le Designer UI/UX -----------------
    # Correction: Passer agent.name à send_agent_message
    await send_agent_message(designer.name, "Propose des éléments de design UI/UX et la charte graphique.", "...", "design", websocket)
    start_time = time.time()
    design_prompt = (
        f"Basé sur le plan d'architecture: '{project_context['architecture_plan']}' et la vision: '{project_context['vision']}', "
        "propose des éléments de design UI/UX pour un site web de restaurant italien. "
        "Inclue palettes de couleurs (HEX/RGB), typographies (noms de polices, styles), "
        "agencements de page pour l'accueil, le menu et les réservations, et suggestions d'icônes. "
        "Fournis des extraits CSS pertinents pour ces styles."
    )
    # Correction: Utiliser asyncio.to_thread pour aask
    design_proposals = await asyncio.to_thread(designer.aask, design_prompt) 
    elapsed = time.time() - start_time
    project_context["ui_design_proposals"] = design_proposals
    # Correction: Passer agent.name à send_agent_message
    await send_agent_message(designer.name, "Propositions de design UI/UX", design_proposals, "design", websocket, elapsed)
    
    async with aiofiles.open(os.path.join(generated_files_dir, "ui_design_proposals.md"), "w", encoding="utf-8") as f:
        await f.write(design_proposals)

    # ----------------- Étape 4 : L'Expert SEO / Contenu -----------------
    # Correction: Passer agent.name à send_agent_message
    await send_agent_message(seo_expert.name, "Génère le contenu textuel et les recommandations SEO.", "...", "content", websocket)
    start_time = time.time()
    seo_prompt = (
        f"Basé sur la vision: '{project_context['vision']}' et le plan d'architecture: '{project_context['architecture_plan']}', "
        "génère du contenu textuel pour les pages principales d'un site de restaurant italien (Accueil, Menu, Réservation, Contact, À propos). "
        "Inclue des mots-clés pertinents pour le SEO, des titres accrocheurs et propose des balises meta (<title>, <meta description>)."
    )
    # Correction: Utiliser asyncio.to_thread pour aask
    seo_content = await asyncio.to_thread(seo_expert.aask, seo_prompt) 
    elapsed = time.time() - start_time
    project_context["seo_content"] = seo_content
    # Correction: Passer agent.name à send_agent_message
    await send_agent_message(seo_expert.name, "Contenu et SEO générés", seo_content, "content", websocket, elapsed)
    
    async with aiofiles.open(os.path.join(generated_files_dir, "seo_content.md"), "w", encoding="utf-8") as f:
        await f.write(seo_content)

    # ----------------- Étape 5 : Spécialiste Base de Données (si nécessaire) -----------------
    if db_specialist:
        # Correction: Passer agent.name à send_agent_message
        await send_agent_message(db_specialist.name, "Conçoit le schéma de base de données.", "...", "database", websocket)
        start_time = time.time()
        db_prompt = (
            f"Basé sur le plan d'architecture: '{project_context['architecture_plan']}' et la vision: '{project_context['vision']}', "
            "propose un schéma de base de données (tables, champs, relations, index) pour un site de restaurant italien "
            "(ex: gestion du menu, des réservations, des utilisateurs). "
            "Fournis les instructions SQL de création de table ou les modèles ORM (SQLAlchemy pour Python)."
        )
        # Correction: Utiliser asyncio.to_thread pour aask
        database_schema = await asyncio.to_thread(db_specialist.aask, db_prompt) 
        elapsed = time.time() - start_time
        project_context["database_schema"] = database_schema
        async with aiofiles.open(os.path.join(generated_files_dir, "database_schema.sql"), "w", encoding="utf-8") as f:
            await f.write(database_schema)
        # Correction: Passer agent.name à send_agent_message
        await send_agent_message(db_specialist.name, "Schéma de BDD généré", database_schema, "database", websocket, elapsed)
    else:
        await send_agent_message("System", "Info", "Agent Spécialiste Base de Données (DBMaster) non disponible ou non nécessaire pour cette demande.", "database", websocket, elapsed=None)


    # ----------------- Étape 6 : Ingénieur Backend -----------------
    if backend_engineer_agent:
        # Correction: Passer agent.name à send_agent_message
        await send_agent_message(backend_engineer_agent.name, "Génère le code backend (FastAPI).", "...", "backend_coding", websocket)
        start_time = time.time()
        backend_prompt = (
            f"Basé sur le plan d'architecture: '{project_context['architecture_plan']}', "
            f"la vision: '{project_context['vision']}', et le schéma de BDD (si existant): '{project_context['database_schema']}', "
            "écris le code backend FastAPI pour un site de restaurant italien. "
            "Inclue les routes API pour gérer le menu, les réservations, et potentiellement l'authentification. "
            "Fournis le code Python complet pour les fichiers clés (ex: main.py, models.py, services.py), en utilisant des blocs de code Markdown."
        )
        # Correction: Utiliser asyncio.to_thread pour aask
        backend_code = await asyncio.to_thread(backend_engineer_agent.aask, backend_prompt) 
        elapsed = time.time() - start_time
        project_context["backend_code"] = backend_code
        
        async with aiofiles.open(os.path.join(generated_files_dir, "backend_code_raw_output.md"), "w", encoding="utf-8") as f:
            await f.write(backend_code)
        try:
            extracted_backend_code = extract_code_block(backend_code, "python")
            if extracted_backend_code:
                async with aiofiles.open(os.path.join(generated_files_dir, "backend_app.py"), "w", encoding="utf-8") as f:
                    await f.write(extracted_backend_code)
                # Correction: Passer agent.name à send_agent_message
                await send_agent_message(backend_engineer_agent.name, "Code Backend généré et sauvegardé", extracted_backend_code[:500] + "...", "backend_coding", websocket, elapsed)
            else:
                # Correction: Passer agent.name à send_agent_message
                await send_agent_message(backend_engineer_agent.name, "Code Backend généré (mais extraction difficile)", backend_code, "backend_coding", websocket, elapsed)
        except Exception as e:
            # Correction: Passer agent.name à send_agent_message
            await send_agent_message(backend_engineer_agent.name, "Erreur de sauvegarde/parsing Backend", f"Impossible d'extraire le code Python: {e}\nRaw Output: {backend_code}", "backend_coding", websocket, elapsed)
    else:
        await send_agent_message("System", "Info", "Agent Ingénieur Backend (BackEngineer) non disponible ou non critique.", "backend_coding", websocket, elapsed=None)


    # --- Étape 7 : Ingénieur Frontend ---
    if frontend_engineer_agent:
        # Correction: Passer agent.name à send_agent_message
        await send_agent_message(frontend_engineer_agent.name, "Génère le code frontend (React, HTML, CSS).", "...", "frontend_coding", websocket)
        start_time = time.time()
        frontend_prompt = (
            f"Basé sur le plan d'architecture: '{project_context['architecture_plan']}', "
            f"les propositions de design UI/UX: '{project_context['ui_design_proposals']}', "
            f"le contenu SEO: '{project_context['seo_content']}', "
            f"et les routes API du backend: '{project_context['backend_code'][:1000]}...', "
            "écris le code React, HTML et CSS pour un site web de restaurant italien. "
            "Inclue les pages Accueil, Menu, Réservation, Contact. "
            "Structure le code en composants réutilisables. "
            "Fournis le code complet (ex: App.jsx, index.html, style.css), en utilisant des blocs de code Markdown pour chaque fichier."
        )
        # Correction: Utiliser asyncio.to_thread pour aask
        frontend_code = await asyncio.to_thread(frontend_engineer_agent.aask, frontend_prompt) 
        elapsed = time.time() - start_time
        project_context["frontend_code"] = frontend_code

        async with aiofiles.open(os.path.join(generated_files_dir, "frontend_code_raw_output.md"), "w", encoding="utf-8") as f:
            await f.write(frontend_code)
        try:
            extracted_html = extract_code_block(frontend_code, "html")
            extracted_css = extract_code_block(frontend_code, "css")
            extracted_js_jsx = extract_code_block(frontend_code, "javascript") or extract_code_block(frontend_code, "jsx")

            if extracted_html:
                async with aiofiles.open(os.path.join(generated_files_dir, "index.html"), "w", encoding="utf-8") as f:
                    await f.write(extracted_html)
            
            if extracted_css:
                async with aiofiles.open(os.path.join(generated_files_dir, "style.css"), "w", encoding="utf-8") as f:
                    await f.write(extracted_css)

            if extracted_js_jsx:
                js_filename = "App.jsx" if "import React" in extracted_js_jsx else "script.js"
                async with aiofiles.open(os.path.join(generated_files_dir, js_filename), "w", encoding="utf-8") as f:
                    await f.write(extracted_js_jsx)
            
            if extracted_html or extracted_css or extracted_js_jsx:
                # Correction: Passer agent.name à send_agent_message
                await send_agent_message(frontend_engineer_agent.name, "Code Frontend généré et sauvegardé", "HTML, CSS, JS/JSX générés et enregistrés.", "frontend_coding", websocket, elapsed)
            else:
                # Correction: Passer agent.name à send_agent_message
                await send_agent_message(frontend_engineer_agent.name, "Code Frontend généré (parsing complexe)", frontend_code, "frontend_coding", websocket, elapsed)
                
        except Exception as e:
            # Correction: Passer agent.name à send_agent_message
            await send_agent_message(frontend_engineer_agent.name, "Erreur de sauvegarde/parsing Frontend", f"Impossible d'extraire le code: {e}\nRaw Output: {frontend_code}", "frontend_coding", websocket, elapsed)
    else:
        await send_agent_message("System", "Info", "Agent Ingénieur Frontend (FrontEngineer) non disponible ou non critique.", "frontend_coding", websocket, elapsed=None)


    # --- Étape 8 : Le Critique ---
    # Correction: Passer agent.name à send_agent_message
    if critique: # Ajout de cette vérification car ensure_agent_exists peut retourner None
        await send_agent_message(critique.name, "Analyse le code généré pour les erreurs et failles de sécurité.", "...", "critique", websocket)
        start_time = time.time()
        critique_prompt = (
            f"Critique de manière exhaustive le code frontend et backend généré. "
            f"Code Frontend: '{project_context['frontend_code']}'. "
            f"Code Backend: '{project_context['backend_code']}'. "
            "Cherche les erreurs de logique, les bugs potentiels, les failles de sécurité, "
            "les problèmes de performance, les violations de bonnes pratiques et les améliorations de qualité. "
            "Fournis un rapport clair avec des points précis et des suggestions de correction."
        )
        # Correction: Utiliser asyncio.to_thread pour aask
        critique_report = await asyncio.to_thread(critique.aask, critique_prompt)
        elapsed = time.time() - start_time
        project_context["critique_reports"] = {"general": critique_report}
        # Correction: Passer agent.name à send_agent_message
        await send_agent_message(critique.name, "Rapport de critique", project_context['critique_reports']['general'], "critique", websocket, elapsed)
        
        async with aiofiles.open(os.path.join(generated_files_dir, "critique_report.md"), "w", encoding="utf-8") as f:
            await f.write(critique_report)
    else:
        await send_agent_message("System", "Info", "Agent Critique (TheCritique) non disponible ou non critique.", "critique", websocket, elapsed=None)


    # --- Étape 9 : L'Optimiseur ---
    # Correction: Passer agent.name à send_agent_message
    if optimiseur: # Ajout de cette vérification car ensure_agent_exists peut retourner None
        await send_agent_message(optimiseur.name, "Optimise et corrige le code basé sur les critiques.", "...", "optimization", websocket)
        start_time = time.time()
        optimizer_prompt = (
            f"Basé sur les critiques: '{project_context['critique_reports']['general']}', "
            f"optimise et corrige le code frontend: '{project_context['frontend_code']}' "
            f"et le code backend: '{project_context['backend_code']}'. "
            "Fournis le code final optimisé pour les deux parties, "
            "en séparant clairement le code frontend (HTML/CSS/JS/React) et le code backend (Python/FastAPI) "
            "avec des blocs de code Markdown distincts et des explications concises."
        )
        # Correction: Utiliser asyncio.to_thread pour aask
        optimized_code_response = await asyncio.to_thread(optimiseur.aask, optimizer_prompt)
        elapsed = time.time() - start_time
        
        final_frontend_code = extract_code_block(optimized_code_response, "html") or \
                              extract_code_block(optimized_code_response, "jsx") or \
                              extract_code_block(optimized_code_response, "javascript")
        final_backend_code = extract_code_block(optimized_code_response, "python")

        project_context["optimized_code"] = {
            "frontend": final_frontend_code,
            "backend": final_backend_code
        }

        async with aiofiles.open(os.path.join(generated_files_dir, "final_frontend_site.html"), "w", encoding="utf-8") as f:
            await f.write(final_frontend_code)
        async with aiofiles.open(os.path.join(generated_files_dir, "final_backend_api.py"), "w", encoding="utf-8") as f:
            await f.write(final_backend_code)

        # Correction: Passer agent.name à send_agent_message
        await send_agent_message(optimiseur.name, "Code final optimisé et corrigé", optimized_code_response, "optimization", websocket, elapsed)
    else:
        await send_agent_message("System", "Info", "Agent Optimiseur (TheOptimizer) non disponible ou non critique.", "optimization", websocket, elapsed=None)


    # --- Étape 10 : Le Déployeur / DevOps ---
    # Correction: Passer agent.name à send_agent_message
    if deployer: # L'appel est conditionnel
        await send_agent_message(deployer.name, "Prépare les scripts de déploiement et la configuration DevOps.", "...", "devops", websocket)
        start_time = time.time()
        deploy_prompt = (
            f"Basé sur le code frontend final: '{final_frontend_code[:len(final_frontend_code)//2]}...', "
            f"et le code backend final: '{final_backend_code[:len(final_backend_code)//2]}...', "
            "génère les scripts de déploiement (Dockerfile, commandes shell, fichiers de configuration CI/CD) "
            "pour mettre ce site web de restaurant italien en production (ex: sur Docker, ou un service cloud comme Render/Vercel/Heroku). "
            "Fournis des instructions claires."
        )
        # Correction: Utiliser asyncio.to_thread pour aask
        deployment_scripts = await asyncio.to_thread(deployer.aask, deploy_prompt)
        elapsed = time.time() - start_time
        project_context["deployment_scripts"] = deployment_scripts
        async with aiofiles.open(os.path.join(generated_files_dir, "deployment_instructions.md"), "w", encoding="utf-8") as f:
            await f.write(deployment_scripts)
        # Correction: Passer agent.name à send_agent_message
        await send_agent_message(deployer.name, "Scripts de déploiement générés", project_context['deployment_scripts'], "devops", websocket, elapsed)
    else:
        await send_agent_message("System", "Info", "Agent Déployeur/DevOps (DevOpsGuy) non inclus dans ce workflow.", "devops", websocket, elapsed=None)

    # --- Étape 11 : Le Traducteur (si demande de multilingue) ---
    # Correction: Passer agent.name à send_agent_message
    if translator_instance: # Assigner l'instance de l'agent translator si elle existe
        if ("multilingue" in prompt.lower() or "traduire" in prompt.lower()):
            await send_agent_message(translator_instance.name, "Traduit le contenu du site dans d'autres langues.", "...", "translation", websocket)
            start_time = time.time()
            content_to_translate = project_context['seo_content'] + "\n\n--- Code Frontend ---\n" + project_context['optimized_code']['frontend'][:1000] 
            translation_prompt = (
                f"Traduire le texte et les extraits de code (si pertinent) suivants du français vers l'italien et l'espagnol "
                f"pour un site de restaurant: '{content_to_translate}'. "
                "Fournis le texte traduit dans un format clair, en indiquant la langue et la section originale. "
                "Ne traduis pas le code, seulement les chaînes de caractères dans le code."
            )
            # Correction: Utiliser asyncio.to_thread pour aask
            translated_content = await asyncio.to_thread(translator_instance.aask, translation_prompt)
            elapsed = time.time() - start_time
            project_context["translations"] = {"all": translated_content}
            async with aiofiles.open(os.path.join(generated_files_dir, "translated_content.md"), "w", encoding="utf-8") as f:
                await f.write(translated_content)
            # Correction: Passer agent.name à send_agent_message
            await send_agent_message(translator_instance.name, "Contenu traduit", project_context['translations']['all'], "translation", websocket, elapsed)
        else:
            await send_agent_message("System", "Info", "Pas de demande de traduction multilingue détectée.", "translation", websocket, elapsed=None)
    else:
        await send_agent_message("System", "Info", "Agent Traducteur non disponible.", "translation", websocket, elapsed=None)

    # --- Signal de fin de workflow global ---
    await websocket.send_text(json.dumps({
        "type": "workflow_complete",
        "message": "✅ Projet de site web terminé ! Fichiers générés dans le dossier de session.",
        "final_output_path": generated_files_dir,
        "timestamp": str(datetime.now())
    }))

# --- ROUTES FASTAPI STANDARD ---

@app.get("/")
async def root():
    """Endpoint racine pour vérifier que le backend est opérationnel."""
    # Renvoie une liste correcte des noms d'agents
    return {"message": "Backend Multi-Agents IA opérationnel !", "agents": [agent.name for agent in agents]}

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """
    Endpoint WebSocket pour la communication en temps réel et le déclenchement du workflow.
    """
    await websocket.accept()
    print(f"[{session_id}] WebSocket: Connexion acceptée.") # Log normal de connexion
    try:
        await websocket.send_text(json.dumps({
            "type": "connection_established",
            "message": "Connexion WebSocket établie",
            "session_id": session_id,
            "timestamp": str(datetime.now())
        }))
        
        while True:
            try:
                data = await websocket.receive_text()
                message_data = json.loads(data)
                print(f"[{session_id}] Requête WebSocket reçue: {message_data.get('type')} - {message_data.get('prompt', '')[:50]}...")
                
                if message_data.get("type") == "chat_request":
                    prompt = message_data.get("prompt", "")
                    await run_website_creation_workflow(websocket, prompt, session_id)
                
            except json.JSONDecodeError:
                print(f"[{session_id}] Erreur: Message WebSocket non JSON valide. Ignoré.")
                await websocket.send_text(json.dumps({"type": "error", "message": "Message non JSON valide."}))
            except WebSocketDisconnect:
                raise # Propager pour être géré par l'exception externe
            except Exception as inner_e:
                print(f"[{session_id}] Erreur interne dans la gestion du message WebSocket: {inner_e}")
                traceback.print_exc()
                await websocket.send_text(json.dumps({"type": "error", "message": f"Erreur interne: {str(inner_e)}"}))

    except WebSocketDisconnect:
        print(f"Client {session_id} disconnected")
    except Exception as e:
        print(f"Erreur inattendue dans websocket_endpoint pour session {session_id}: {e}")
        traceback.print_exc()
        try:
            await websocket.close(code=1011)
        except RuntimeError as close_error:
            print(f"[{session_id}] Erreur lors de la tentative de fermeture du WebSocket (déjà fermé ?): {close_error}")

@app.post("/chat")
async def chat_with_agent(chat_data: ChatMessage):
    """
    Endpoint HTTP pour une interaction directe avec un seul agent. Utile pour des tests ou des requêtes ponctuelles hors workflow.
    """
    agent = get_agent_by_name(chat_data.agent_name)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent '{chat_data.agent_name}' inconnu. Agents disponibles: {[a.name for a in agents]}")
    
    response = await asyncio.to_thread(agent.aask, chat_data.message)
    return {
        "agent": chat_data.agent_name,
        "response": response,
        "timestamp": str(datetime.now())
    }

@app.get("/agents")
async def get_agents_info():
    """Retourne la liste et les informations sur tous les agents disponibles."""
    return {
        "agents": [
            {
                "name": agent.name,
                "role": agent.role,
                "model": agent.llm_model,
                "description": agent.description_for_orchestrator
            } for agent in agents
        ]
    }

@app.get("/list_code")
async def list_generated_files(session_id: str = None):
    """
    Liste les fichiers de code généré pour une session spécifique,
    ou tous les fichiers générés si session_id est None.
    """
    base_dir = "generated_code"
    
    files_info = []
    
    if not os.path.exists(base_dir):
        return {"files": [], "message": "Le dossier 'generated_code' n'existe pas encore."}

    if session_id:
        target_dir = os.path.join(base_dir, session_id)
        if os.path.exists(target_dir):
            for root, _, files in os.walk(target_dir):
                for file_name in files:
                    if not file_name.endswith('.zip'):
                        file_path = os.path.join(root, file_name)
                        relative_path = os.path.relpath(file_path, target_dir)
                        files_info.append({"path": relative_path, "content_url": f"/get_code_content?session_id={session_id}&file_path={relative_path}"})
        else:
            return {"files": [], "message": f"No generated code found for session {session_id}"}
    else:
        for session_folder in os.listdir(base_dir):
            session_path = os.path.join(base_dir, session_folder)
            if os.path.isdir(session_path):
                for root, _, files in os.walk(session_path):
                    for file_name in files:
                        if not file_name.endswith('.zip'):
                            file_path = os.path.join(root, file_name)
                            relative_path = os.path.relpath(file_path, base_dir)
                            # Pour l'URL, il faut le chemin relatif à la session, pas à base_dir
                            files_info.append({"path": os.path.relpath(file_path, session_path), "session_id": session_folder, "content_url": f"/get_code_content?session_id={session_folder}&file_path={os.path.relpath(file_path, session_path)}"})

    return {"files": files_info}

@app.get("/get_code_content")
async def get_code_content(session_id: str, file_path: str):
    """Retourne le contenu d'un fichier de code généré pour une session spécifique."""
    full_path = os.path.join("generated_code", session_id, file_path)
    if os.path.exists(full_path) and os.path.isfile(full_path):
        with open(full_path, "r", encoding="utf-8") as f:
            content = f.read()
        return {"file_path": file_path, "content": content}
    raise HTTPException(status_code=404, detail="File not found")

# --- Logique d'exécution de code (telle que vous l'aviez fournie) ---
def _get_executors():
    """Retourne la configuration des exécuteurs par langage."""
    return {
        "python": {
            "extension": ".py",
            "command": [sys.executable, "-c"],
            "direct_code": True
        },
        "javascript": {
            "extension": ".js",
            "command": ["node"],
            "direct_code": False
        },
        "typescript": {
            "extension": ".ts",
            "command": ["npx", "ts-node"],
            "direct_code": False
        }
    }

def _prepare_command(code: str, executor: dict):
    """Prépare la commande d'exécution selon le type d'exécuteur."""
    if executor["direct_code"]:
        return executor["command"] + [code], None
    else:
        with tempfile.NamedTemporaryFile(
            mode='w', 
            suffix=executor["extension"], 
            delete=False,
            encoding='utf-8'
        ) as temp_file:
            temp_file.write(code)
            temp_filename = temp_file.name
        return executor["command"] + [temp_filename], temp_filename

def _process_execution_result(result, executor: dict, temp_filename: str = None):
    """Traite le résultat de l'exécution et nettoie les fichiers temporaires."""
    if not executor["direct_code"] and temp_filename:
        try:
            os.unlink(temp_filename)
        except OSError:
            pass
    
    if result.returncode == 0:
        output = result.stdout.strip()
        if result.stderr.strip():
            output += f"\n--- Avertissements ---\n{result.stderr.strip()}"
        
        return {
            "success": True,
            "output": output if output else "✅ Exécution réussie (aucune sortie)"
        }
    else:
        return {
            "success": False,
            "error": result.stderr.strip() or "Erreur d'exécution inconnue"
        }

@app.post("/execute")
async def execute_code(request: CodeExecutionRequest):
    """
    Exécute du code de manière sécurisée dans un environnement temporaire.
    """
    try:
        code = request.code.strip()
        language = request.language.lower()
        
        if not code:
            return {"success": False, "error": "Code vide fourni"}
        
        executors = _get_executors()
        
        if language not in executors:
            return {
                "success": False,
                "error": f"Langage '{language}' non supporté. Langages disponibles: {', '.join(executors.keys())}"
            }
        
        executor = executors[language]
        cmd, temp_filename = _prepare_command(code, executor)
        
        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=tempfile.gettempdir() # Exécute dans un répertoire temporaire isolé
            )
            
            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=10  # Timeout de 10 secondes pour éviter les boucles infinies
            )
            
            class AsyncResult: # Objet similaire à subprocess.CompletedProcess
                def __init__(self, returncode, stdout, stderr):
                    self.returncode = returncode
                    self.stdout = stdout.decode('utf-8') if stdout else ''
                    self.stderr = stderr.decode('utf-8') if stderr else ''
            
            result = AsyncResult(process.returncode, stdout, stderr)
            
            return _process_execution_result(result, executor, temp_filename)
                
        except asyncio.TimeoutError:
            return {
                "success": False,
                "error": "⏰ Timeout: L'exécution a pris plus de 10 secondes"
            }
        except FileNotFoundError as e:
            return {
                "success": False,
                "error": f"Exécuteur non trouvé: {str(e)}. Vérifiez que '{language}' est installé et dans le PATH."
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": f"Erreur système inattendue lors de l'exécution du code: {str(e)}"
        }

@app.get("/favicon.ico")
async def favicon():
    """Évite l'erreur 404 pour favicon.ico."""
    return Response(content="", media_type="image/x-icon")

@app.get("/test")
async def test_endpoint():
    """Endpoint de test simple pour vérifier l'accessibilité du backend."""
    return {"status": "OK", "message": "Backend accessible", "timestamp": str(datetime.now())}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
