# 🚀 Plateforme IA Collaborative

Une plateforme moderne de développement collaboratif avec IA, comparable à Bolt, Replit et CodeSandbox.

## 🏗️ Architecture

### Frontend (React + Vite)
- **Monaco Editor** avec auto-save et coloration syntaxique
- **WebSocket** pour la collaboration temps réel
- **Terminal intégré** avec commandes interactives
- **Templates de projets** prêts à l'emploi
- **Chat IA** pour l'assistance au développement

### Backend (FastAPI + Python)
- **API REST** complète pour la gestion des projets
- **WebSocket** pour la collaboration en temps réel
- **Exécution de code** isolée avec Docker
- **Base de données** SQLite/PostgreSQL
- **Système de fichiers** avec versioning

## 🚀 Démarrage Rapide

### 1. Frontend (Mode Développement)
```bash
# Installer les dépendances
npm install

# Démarrer en mode simulation (sans backend réel)
npm run dev

# Ou avec votre backend FastAPI + Ollama
VITE_ENABLE_MOCK=false npm run dev
```

### 2. Backend FastAPI + Ollama
```bash
# 1. Démarrer Ollama (requis pour les agents IA)
ollama serve

# 2. Vérifier que vos modèles agents sont disponibles
ollama list
# Vous devriez voir : agent-visionnaire, agent-architecte, etc.

# 3. Démarrer votre backend FastAPI
cd app
python main.py

# Backend disponible sur http://localhost:8000
# WebSocket: ws://localhost:8000/ws
```

### 3. Avec Docker
```bash
# Démarrer tous les services
docker-compose up -d

# Frontend: http://localhost:3000
# Backend: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

## 🔧 Configuration

### Variables d'environnement
```bash
# Frontend (.env) 
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
VITE_ENABLE_MOCK=false
VITE_OLLAMA_URL=http://localhost:11434

# Backend (environnement)
OLLAMA_HOST=localhost:11434
CORS_ORIGINS=http://localhost:5173
```

## 📡 API Endpoints

### Agents Multi-IA
- `GET /agents` - Liste des agents disponibles
- `POST /chat` - Interaction avec un agent spécifique
- `WS /ws/{session_id}` - Workflow création de site web

### Projets
- `GET /api/projects` - Liste des projets
- `POST /api/projects` - Créer un projet
- `PUT /api/projects/{id}` - Mettre à jour un projet
- `DELETE /api/projects/{id}` - Supprimer un projet

### Fichiers
- `GET /api/projects/{id}/files` - Fichiers d'un projet
- `POST /api/projects/{id}/files` - Créer un fichier
- `PUT /api/projects/{id}/files/{file_id}` - Mettre à jour un fichier
- `DELETE /api/projects/{id}/files/{file_id}` - Supprimer un fichier

### Exécution
- `POST /api/execute` - Exécuter du code


### Généraux
- `GET /list_code` - Fichiers générés
- `GET /get_code_content` - Contenu d'un fichier

## 🎯 Fonctionnalités

### ✅ Implémentées
- **Système Multi-Agent Ollama** avec 12 agents spécialisés
- **Workflow création de site web** automatisé
- **Monaco Editor** avec auto-save (30s)
- **WebSocket** temps réel pour workflows
- **Système de fichiers** avec versioning
- Exécution de code (Python/JavaScript/TypeScript)
- Terminal intégré avec commandes
- Templates de projets
- **Chat IA avancé** avec commandes spécialisées
- Interface responsive

### 🔄 En Cours
- Déploiement automatique
- Collaboration multi-utilisateurs
- Système de permissions
- Monitoring et logs

## 🤖 Agents IA Disponibles

- 🔮 **Mike** - Visionnaire et coordinateur
- 🏗️ **Bob** - Architecte système  
- 🎨 **Front Engineer** - Développement frontend
- ⚙️ **Back Engineer** - Développement backend
- ✨ **UI Designer** - Design et UX
- 📈 **SEO Expert** - Contenu et référencement
- 🗃️ **DB Master** - Base de données
- 🚀 **DevOps Guy** - Déploiement et infrastructure
- 🔍 **The Critique** - Analyse qualité et sécurité
- ⚡ **The Optimizer** - Optimisation de code
- 🌍 **Translator Bot** - Traduction et localisation

## 🛠️ Développement

### Structure du projet
```
├── src/
│   ├── components/       # Composants React
│   ├── services/        # Services API et WebSocket
│   ├── hooks/           # Hooks personnalisés
│   └── types/           # Types TypeScript
├── app/                 # Votre backend FastAPI + Agents
└── docs/               # Documentation
```

### Commandes utiles
```bash
# Tests
npm run test

# Build
npm run build

# Lint
npm run lint

# Type check
npm run type-check
```

## 🔒 Sécurité

- Exécution de code en sandbox
- Validation des entrées
- CORS configuré
- Limitation des requêtes
- Isolation des sessions

## 🔧 Configuration Ollama

Assurez-vous d'avoir vos modèles agents installés :
```bash
ollama pull agent-visionnaire
ollama pull agent-architecte
# ... pour tous vos agents
```

## 📊 Monitoring

- Logs détaillés WebSocket
- Métriques d'exécution
- Surveillance de la base de données
- Health checks

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature
3. Commiter les changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## 📄 License

MIT License - voir le fichier LICENSE pour plus de détails.