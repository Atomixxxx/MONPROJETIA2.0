# app/common/utils.py
import json
from datetime import datetime
from fastapi import WebSocket

async def send_agent_message(agent_name: str, status: str, content: str, stage: str, websocket: WebSocket, elapsed: float = None):
    """
    Envoie un message d'agent via WebSocket avec un format standardisé.
    
    Args:
        agent_name: Nom de l'agent
        status: Statut du message (ex: "En cours", "Terminé", "Erreur")
        content: Contenu du message
        stage: Étape du workflow (ex: "vision", "architecture", etc.)
        websocket: Connexion WebSocket
        elapsed: Temps d'exécution en secondes (optionnel)
    """
    message = {
        "type": "agent_message",
        "agent": agent_name,
        "status": status,
        "content": content,
        "stage": stage,
        "elapsed": elapsed,
        "timestamp": datetime.now().isoformat()
    }
    
    try:
        await websocket.send_text(json.dumps(message, ensure_ascii=False))
    except Exception as e:
        print(f"Erreur lors de l'envoi du message WebSocket: {e}")

def format_agent_response(agent_name: str, role: str, content: str, execution_time: float = None) -> str:
    """
    Formate une réponse d'agent de manière standardisée.
    
    Args:
        agent_name: Nom de l'agent
        role: Rôle de l'agent
        content: Contenu de la réponse
        execution_time: Temps d'exécution en secondes
        
    Returns:
        Réponse formatée en Markdown
    """
    header = f"🤖 **{agent_name} ({role})**\n\n"
    
    if execution_time:
        header += f"⏱️ *Exécuté en {execution_time:.2f}s*\n\n"
    
    return header + content

def extract_code_blocks(text: str) -> dict:
    """
    Extrait tous les blocs de code d'un texte Markdown.
    
    Args:
        text: Texte contenant des blocs de code Markdown
        
    Returns:
        Dictionnaire {langage: code}
    """
    import re
    
    # Pattern pour matcher les blocs de code ```langage ... ```
    pattern = r'```(\w+)\s*\n(.*?)\n```'
    matches = re.findall(pattern, text, re.DOTALL)
    
    code_blocks = {}
    for language, code in matches:
        if language in code_blocks:
            # Si le langage existe déjà, on concatène
            code_blocks[language] += f"\n\n# --- Bloc additionnel ---\n\n{code.strip()}"
        else:
            code_blocks[language] = code.strip()
    
    return code_blocks

def validate_agent_selection(selected_agents: list, available_agents: list) -> tuple[list, list]:
    """
    Valide la sélection d'agents.
    
    Args:
        selected_agents: Liste des agents sélectionnés
        available_agents: Liste des agents disponibles
        
    Returns:
        Tuple (agents_valides, agents_invalides)
    """
    valid_agents = []
    invalid_agents = []
    
    for agent_id in selected_agents:
        if agent_id in available_agents:
            valid_agents.append(agent_id)
        else:
            invalid_agents.append(agent_id)
    
    return valid_agents, invalid_agents

def generate_session_summary(project_context: dict, agents_used: list, execution_time: float) -> str:
    """
    Génère un résumé de session de workflow.
    
    Args:
        project_context: Contexte du projet
        agents_used: Liste des agents utilisés
        execution_time: Temps total d'exécution
        
    Returns:
        Résumé formaté en Markdown
    """
    summary = f"""# 📊 Résumé de Session Workflow

## 🎯 Demande Utilisateur
{project_context.get('user_request', 'Non spécifiée')}

## 👥 Agents Collaborateurs ({len(agents_used)})
{chr(10).join([f'• **{agent}**' for agent in agents_used])}

## ⏱️ Performance
- **Temps total :** {execution_time:.2f} secondes
- **Fichiers générés :** {len(project_context.get('code_files', []))}
- **Étapes réalisées :** {len(project_context.get('results', {}))}

## 📁 Fichiers Créés
"""
    
    for file_info in project_context.get('code_files', []):
        summary += f"- `{file_info['filename']}` ({file_info['language']}) - par {file_info['agent']}\n"
    
    summary += f"""
## 🎉 Statut
✅ **Workflow terminé avec succès !**

---
*Généré le {datetime.now().strftime('%d/%m/%Y à %H:%M:%S')}*
"""
    
    return summary