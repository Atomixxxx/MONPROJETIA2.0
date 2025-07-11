import { ProjectTemplate } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class TemplateService {
  private templates: ProjectTemplate[] = [
    {
      id: 'react-app',
      name: 'React App',
      description: 'Application React moderne avec TypeScript',
      language: 'typescript',
      icon: '⚛️',
      files: [
        {
          name: 'App.tsx',
          language: 'typescript',
          content: `import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>🚀 React App</h1>
        <p>Bienvenue dans votre nouvelle application React!</p>
      </header>
    </div>
  );
}

export default App;`
        },
        {
          name: 'App.css',
          language: 'css',
          content: `.App {
  text-align: center;
}

.App-header {
  background-color: #282c34;
  padding: 20px;
  color: white;
  border-radius: 8px;
  margin: 20px;
}

.App-header h1 {
  margin: 0 0 10px 0;
}

.App-header p {
  margin: 0;
  opacity: 0.8;
}`
        },
        {
          name: 'package.json',
          language: 'json',
          content: `{
  "name": "react-app",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^4.9.5"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test"
  }
}`
        }
      ],
      packages: ['react', 'react-dom', 'typescript']
    },
    {
      id: 'python-api',
      name: 'API Python FastAPI',
      description: 'API REST avec FastAPI et SQLite',
      language: 'python',
      icon: '🐍',
      files: [
        {
          name: 'main.py',
          language: 'python',
          content: `from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import sqlite3
from datetime import datetime

app = FastAPI(title="Mon API", version="1.0.0")

# Modèle de données
class Item(BaseModel):
    id: Optional[int] = None
    name: str
    description: str
    created_at: Optional[datetime] = None

# Base de données
def init_db():
    conn = sqlite3.connect('app.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

@app.on_event("startup")
async def startup_event():
    init_db()

@app.get("/")
async def root():
    return {"message": "🚀 API FastAPI opérationnelle!"}

@app.get("/items", response_model=List[Item])
async def get_items():
    conn = sqlite3.connect('app.db')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM items')
    items = cursor.fetchall()
    conn.close()
    
    return [
        Item(id=item[0], name=item[1], description=item[2], created_at=item[3])
        for item in items
    ]

@app.post("/items", response_model=Item)
async def create_item(item: Item):
    conn = sqlite3.connect('app.db')
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO items (name, description) VALUES (?, ?)',
        (item.name, item.description)
    )
    item_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return Item(id=item_id, name=item.name, description=item.description)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)`
        },
        {
          name: 'requirements.txt',
          language: 'text',
          content: `fastapi==0.104.1
uvicorn==0.24.0
pydantic==2.5.0
python-multipart==0.0.6
sqlite3`
        }
      ],
      packages: ['fastapi', 'uvicorn', 'pydantic']
    },
    {
      id: 'node-server',
      name: 'Serveur Node.js',
      description: 'Serveur Express avec API REST',
      language: 'javascript',
      icon: '🟢',
      files: [
        {
          name: 'server.js',
          language: 'javascript',
          content: `const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Base de données en mémoire
let items = [
  { id: '1', name: 'Item 1', description: 'Description de l\'item 1' },
  { id: '2', name: 'Item 2', description: 'Description de l\'item 2' }
];

// Routes
app.get('/', (req, res) => {
  res.json({ message: '🚀 Serveur Node.js opérationnel!' });
});

app.get('/api/items', (req, res) => {
  res.json(items);
});

app.post('/api/items', (req, res) => {
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Le nom est requis' });
  }
  
  const newItem = {
    id: uuidv4(),
    name,
    description: description || '',
    createdAt: new Date().toISOString()
  };
  
  items.push(newItem);
  res.status(201).json(newItem);
});

app.get('/api/items/:id', (req, res) => {
  const item = items.find(i => i.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Item non trouvé' });
  }
  res.json(item);
});

app.put('/api/items/:id', (req, res) => {
  const index = items.findIndex(i => i.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Item non trouvé' });
  }
  
  items[index] = { ...items[index], ...req.body };
  res.json(items[index]);
});

app.delete('/api/items/:id', (req, res) => {
  const index = items.findIndex(i => i.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Item non trouvé' });
  }
  
  items.splice(index, 1);
  res.status(204).send();
});

app.listen(port, () => {
  console.log(\`🚀 Serveur démarré sur le port \${port}\`);
});`
        },
        {
          name: 'package.json',
          language: 'json',
          content: `{
  "name": "node-server",
  "version": "1.0.0",
  "description": "Serveur Express avec API REST",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}`
        }
      ],
      packages: ['express', 'cors', 'uuid']
    },
    {
      id: 'html-website',
      name: 'Site Web HTML',
      description: 'Site web statique avec HTML, CSS et JavaScript',
      language: 'html',
      icon: '🌐',
      files: [
        {
          name: 'index.html',
          language: 'html',
          content: `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mon Site Web</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <nav>
            <h1>🚀 Mon Site Web</h1>
            <ul>
                <li><a href="#home">Accueil</a></li>
                <li><a href="#about">À propos</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </nav>
    </header>

    <main>
        <section id="home" class="hero">
            <h2>Bienvenue sur mon site!</h2>
            <p>Découvrez mes projets et mes créations</p>
            <button onclick="showMessage()">Cliquez-moi!</button>
        </section>

        <section id="about" class="section">
            <h2>À propos</h2>
            <p>Je suis un développeur passionné par la création d'expériences web modernes.</p>
        </section>

        <section id="contact" class="section">
            <h2>Contact</h2>
            <p>N'hésitez pas à me contacter pour vos projets!</p>
        </section>
    </main>

    <footer>
        <p>&copy; 2024 Mon Site Web. Tous droits réservés.</p>
    </footer>

    <script src="script.js"></script>
</body>
</html>`
        },
        {
          name: 'style.css',
          language: 'css',
          content: `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Arial', sans-serif;
    line-height: 1.6;
    color: #333;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

header {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    position: sticky;
    top: 0;
    z-index: 1000;
}

nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
}

nav h1 {
    color: white;
    font-size: 1.5rem;
}

nav ul {
    display: flex;
    list-style: none;
    gap: 2rem;
}

nav a {
    color: white;
    text-decoration: none;
    transition: opacity 0.3s;
}

nav a:hover {
    opacity: 0.8;
}

.hero {
    text-align: center;
    padding: 4rem 2rem;
    color: white;
}

.hero h2 {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.hero p {
    font-size: 1.2rem;
    margin-bottom: 2rem;
    opacity: 0.9;
}

.hero button {
    background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
    color: white;
    border: none;
    padding: 1rem 2rem;
    font-size: 1.1rem;
    border-radius: 50px;
    cursor: pointer;
    transition: transform 0.3s, box-shadow 0.3s;
}

.hero button:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

.section {
    padding: 4rem 2rem;
    max-width: 1200px;
    margin: 0 auto;
    background: white;
    margin-bottom: 2rem;
    border-radius: 10px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.section h2 {
    color: #333;
    margin-bottom: 1rem;
    font-size: 2rem;
}

.section p {
    font-size: 1.1rem;
    color: #666;
}

footer {
    text-align: center;
    padding: 2rem;
    background: rgba(0, 0, 0, 0.1);
    color: white;
    margin-top: 2rem;
}

@media (max-width: 768px) {
    nav {
        flex-direction: column;
        gap: 1rem;
    }
    
    nav ul {
        gap: 1rem;
    }
    
    .hero h2 {
        font-size: 2rem;
    }
    
    .section {
        margin: 1rem;
    }
}`
        },
        {
          name: 'script.js',
          language: 'javascript',
          content: `// Fonctions JavaScript pour le site

function showMessage() {
    alert('🎉 Merci d\'avoir cliqué! Bienvenue sur mon site web.');
}

// Animation au scroll
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('.section');
    const scrollY = window.pageYOffset;
    
    sections.forEach((section, index) => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        
        if (scrollY > sectionTop - window.innerHeight + 100) {
            section.style.opacity = '1';
            section.style.transform = 'translateY(0)';
        }
    });
});

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Site web chargé avec succès!');
    
    // Préparer les sections pour l'animation
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(50px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });
    
    // Navigation douce
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});

// Effet de particules simple
function createParticles() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.width = '2px';
        particle.style.height = '2px';
        particle.style.background = 'rgba(255, 255, 255, 0.5)';
        particle.style.borderRadius = '50%';
        particle.style.pointerEvents = 'none';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animation = \`float \${Math.random() * 3 + 2}s infinite ease-in-out\`;
        
        hero.appendChild(particle);
    }
}

// Ajouter les animations CSS
const style = document.createElement('style');
style.textContent = \`
    @keyframes float {
        0%, 100% {
            transform: translateY(0px);
            opacity: 1;
        }
        50% {
            transform: translateY(-20px);
            opacity: 0.5;
        }
    }
\`;
document.head.appendChild(style);

// Initialiser les particules
setTimeout(createParticles, 1000);`
        }
      ]
    }
  ];

  getTemplates(): ProjectTemplate[] {
    return this.templates;
  }

  getTemplate(id: string): ProjectTemplate | undefined {
    return this.templates.find(t => t.id === id);
  }

  createProjectFromTemplate(templateId: string, projectName: string): ProjectTemplate | null {
    const template = this.getTemplate(templateId);
    if (!template) return null;

    return {
      ...template,
      id: uuidv4(),
      name: projectName,
      description: template.description
    };
  }
}