# start_agents.py - Script de lancement complet
import os
import sys
import subprocess
import time
import requests
import ollama
from pathlib import Path

def check_ollama_status():
    """Vérifie si Ollama est démarré"""
    try:
        response = requests.get("http://localhost:11434/api/tags", timeout=5)
        return response.status_code == 200
    except:
        return False

def check_required_models():
    """Vérifie les modèles requis"""
    required_models = [
        "agent-visionnaire",
        "agent-architecte", 
        "agent-frontend-engineer",
        "agent-backend-engineer",
        "agent-designer-ui-ux",
        "agent-seo-content-expert",
        "agent-database-specialist",
        "agent-deployer-devops",
        "agent-critique",
        "agent-optimiseur",
        "agent-translator"
    ]
    
    try:
        models = ollama.list()
        available_models = [model['name'] for model in models.get('models', [])]
        missing_models = [model for model in required_models if model not in available_models]
        return available_models, missing_models
    except:
        return [], required_models

def install_missing_models(missing_models):
    """Installe les modèles manquants"""
    print(f"📦 Installation de {len(missing_models)} modèles manquants...")
    
    for model in missing_models:
        print(f"⬇️ Installation de {model}...")
        try:
            # Commande d'installation via subprocess
            result = subprocess.run(
                ["ollama", "pull", model], 
                capture_output=True, 
                text=True,
                timeout=300  # 5 minutes max par modèle
            )
            
            if result.returncode == 0:
                print(f"✅ {model} installé avec succès")
            else:
                print(f"❌ Erreur installation {model}: {result.stderr}")
        except subprocess.TimeoutExpired:
            print(f"⏰ Timeout lors de l'installation de {model}")
        except Exception as e:
            print(f"❌ Erreur {model}: {e}")

def start_ollama():
    """Démarre Ollama si nécessaire"""
    if not check_ollama_status():
        print("🔄 Démarrage d'Ollama...")
        try:
            # Démarrage d'Ollama en arrière-plan
            subprocess.Popen(
                ["ollama", "serve"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            
            # Attente du démarrage
            for i in range(30):  # 30 secondes max
                if check_ollama_status():
                    print("✅ Ollama démarré avec succès")
                    return True
                time.sleep(1)
                print(f"⏳ Attente Ollama... ({i+1}/30)")
            
            print("❌ Timeout - Ollama n'a pas démarré")
            return False
        except Exception as e:
            print(f"❌ Erreur démarrage Ollama: {e}")
            return False
    else:
        print("✅ Ollama déjà démarré")
        return True

def start_backend():
    """Démarre le backend FastAPI"""
    print("🚀 Démarrage du backend...")
    
    # Vérification du fichier backend
    backend_file = "backend_stable_enhanced.py"
    if not os.path.exists(backend_file):
        print(f"❌ Fichier {backend_file} non trouvé")
        return False
    
    try:
        # Démarrage du backend
        subprocess.run([
            sys.executable, backend_file
        ], check=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Erreur démarrage backend: {e}")
        return False
    except KeyboardInterrupt:
        print("\n🛑 Arrêt demandé par l'utilisateur")
        return False

def check_backend_health():
    """Vérifie la santé du backend"""
    try:
        response = requests.get("http://localhost:8002/test", timeout=5)
        return response.status_code == 200
    except:
        return False

def main():
    """Fonction principale"""
    print("🤖 === DÉMARRAGE AGENTS IA OLLAMA ===\n")
    
    # 1. Vérification et démarrage d'Ollama
    if not start_ollama():
        print("❌ Impossible de démarrer Ollama")
        return
    
    # 2. Vérification des modèles
    print("\n📋 Vérification des modèles...")
    available_models, missing_models = check_required_models()
    
    print(f"✅ Modèles disponibles: {len(available_models)}")
    if available_models:
        for model in available_models[:5]:  # Affiche les 5 premiers
            print(f"   • {model}")
        if len(available_models) > 5:
            print(f"   • ... et {len(available_models) - 5} autres")
    
    if missing_models:
        print(f"\n❌ Modèles manquants: {len(missing_models)}")
        for model in missing_models:
            print(f"   • {model}")
        
        response = input("\n📦 Installer les modèles manquants ? (o/N): ")
        if response.lower() in ['o', 'oui', 'y', 'yes']:
            install_missing_models(missing_models)
        else:
            print("⚠️ Certains agents ne seront pas disponibles")
    
    # 3. Démarrage du backend
    print(f"\n🚀 Démarrage du backend sur le port 8002...")
    print("📱 Interface React disponible via WebSocket")
    print("🔗 API: http://localhost:8002")
    print("📊 Status: http://localhost:8002/agents")
    print("\n⏹️ Appuyez sur Ctrl+C pour arrêter\n")
    
    # Démarrage du backend
    start_backend()

if __name__ == "__main__":
    main()