"""
Exemple d'intégration Backend FastAPI
Compatible avec le frontend React
"""

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import uvicorn
import asyncio
import json
import sqlite3
import uuid
from datetime import datetime
import subprocess
import tempfile
import os

app = FastAPI(title="AI Collaborative Platform API", version="1.0.0")

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modèles Pydantic
class ProjectCreate(BaseModel):
    name: str
    description: str
    language: str
    isShared: bool = False

class Project(BaseModel):
    id: str
    name: str
    description: str
    language: str
    createdAt: datetime
    updatedAt: datetime
    isShared: bool

class FileCreate(BaseModel):
    name: str
    path: str
    content: str
    language: str

class File(BaseModel):
    id: str
    name: str
    path: str
    content: str
    language: str
    size: int
    lastModified: datetime
    version: int
    projectId: str

class CodeExecutionRequest(BaseModel):
    code: str
    language: str

class ExecutionResult(BaseModel):
    id: str
    code: str
    output: str
    errors: str
    duration: int
    timestamp: datetime
    language: str
    status: str

# Gestionnaire WebSocket
class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.user_sessions: Dict[str, dict] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        self.user_sessions[user_id] = {
            "connected_at": datetime.now(),
            "last_heartbeat": datetime.now()
        }
        await self.broadcast_user_joined(user_id)

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        if user_id in self.user_sessions:
            del self.user_sessions[user_id]

    async def send_personal_message(self, message: str, user_id: str):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections.values():
            await connection.send_text(message)

    async def broadcast_user_joined(self, user_id: str):
        message = {
            "type": "user_join",
            "payload": {"userId": user_id, "name": f"User {user_id[:8]}"},
            "timestamp": datetime.now().isoformat()
        }
        await self.broadcast(json.dumps(message))

manager = WebSocketManager()

# Base de données (SQLite pour simplicité)
def init_db():
    conn = sqlite3.connect('collaborative_platform.db')
    cursor = conn.cursor()
    
    # Table des projets
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            language TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_shared BOOLEAN DEFAULT FALSE
        )
    ''')
    
    # Table des fichiers
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS files (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            path TEXT NOT NULL,
            content TEXT,
            language TEXT,
            size INTEGER,
            last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            version INTEGER DEFAULT 1,
            project_id TEXT,
            FOREIGN KEY (project_id) REFERENCES projects (id)
        )
    ''')
    
    # Table des exécutions
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS executions (
            id TEXT PRIMARY KEY,
            code TEXT NOT NULL,
            output TEXT,
            errors TEXT,
            duration INTEGER,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            language TEXT,
            status TEXT
        )
    ''')
    
    conn.commit()
    conn.close()

# Initialiser la base de données au démarrage
init_db()

# Routes API

@app.get("/")
async def root():
    return {"message": "🚀 AI Collaborative Platform API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now()}

# Routes des projets
@app.get("/api/projects", response_model=List[Project])
async def get_projects():
    conn = sqlite3.connect('collaborative_platform.db')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM projects ORDER BY created_at DESC')
    projects = cursor.fetchall()
    conn.close()
    
    return [
        Project(
            id=p[0], name=p[1], description=p[2], language=p[3],
            createdAt=p[4], updatedAt=p[5], isShared=bool(p[6])
        ) for p in projects
    ]

@app.post("/api/projects", response_model=Project)
async def create_project(project: ProjectCreate):
    project_id = str(uuid.uuid4())
    conn = sqlite3.connect('collaborative_platform.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO projects (id, name, description, language, is_shared)
        VALUES (?, ?, ?, ?, ?)
    ''', (project_id, project.name, project.description, project.language, project.isShared))
    
    conn.commit()
    conn.close()
    
    # Broadcast nouveau projet
    await manager.broadcast(json.dumps({
        "type": "project_created",
        "payload": {"projectId": project_id, "name": project.name}
    }))
    
    return Project(
        id=project_id,
        name=project.name,
        description=project.description,
        language=project.language,
        createdAt=datetime.now(),
        updatedAt=datetime.now(),
        isShared=project.isShared
    )

@app.put("/api/projects/{project_id}", response_model=Project)
async def update_project(project_id: str, project: ProjectCreate):
    conn = sqlite3.connect('collaborative_platform.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        UPDATE projects 
        SET name=?, description=?, language=?, is_shared=?, updated_at=CURRENT_TIMESTAMP
        WHERE id=?
    ''', (project.name, project.description, project.language, project.isShared, project_id))
    
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Project not found")
    
    conn.commit()
    conn.close()
    
    return Project(
        id=project_id,
        name=project.name,
        description=project.description,
        language=project.language,
        createdAt=datetime.now(),
        updatedAt=datetime.now(),
        isShared=project.isShared
    )

@app.delete("/api/projects/{project_id}")
async def delete_project(project_id: str):
    conn = sqlite3.connect('collaborative_platform.db')
    cursor = conn.cursor()
    
    # Supprimer les fichiers associés
    cursor.execute('DELETE FROM files WHERE project_id=?', (project_id,))
    # Supprimer le projet
    cursor.execute('DELETE FROM projects WHERE id=?', (project_id,))
    
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Project not found")
    
    conn.commit()
    conn.close()
    
    return {"message": "Project deleted successfully"}

# Routes des fichiers
@app.get("/api/projects/{project_id}/files", response_model=List[File])
async def get_project_files(project_id: str):
    conn = sqlite3.connect('collaborative_platform.db')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM files WHERE project_id=?', (project_id,))
    files = cursor.fetchall()
    conn.close()
    
    return [
        File(
            id=f[0], name=f[1], path=f[2], content=f[3], language=f[4],
            size=f[5], lastModified=f[6], version=f[7], projectId=f[8]
        ) for f in files
    ]

@app.post("/api/projects/{project_id}/files", response_model=File)
async def create_file(project_id: str, file: FileCreate):
    file_id = str(uuid.uuid4())
    conn = sqlite3.connect('collaborative_platform.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO files (id, name, path, content, language, size, project_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (file_id, file.name, file.path, file.content, file.language, len(file.content), project_id))
    
    conn.commit()
    conn.close()
    
    # Broadcast nouveau fichier
    await manager.broadcast(json.dumps({
        "type": "file_created",
        "payload": {"fileId": file_id, "projectId": project_id, "name": file.name}
    }))
    
    return File(
        id=file_id,
        name=file.name,
        path=file.path,
        content=file.content,
        language=file.language,
        size=len(file.content),
        lastModified=datetime.now(),
        version=1,
        projectId=project_id
    )

@app.put("/api/projects/{project_id}/files/{file_id}", response_model=File)
async def update_file(project_id: str, file_id: str, content_update: dict):
    content = content_update.get("content", "")
    
    conn = sqlite3.connect('collaborative_platform.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        UPDATE files 
        SET content=?, size=?, last_modified=CURRENT_TIMESTAMP, version=version+1
        WHERE id=? AND project_id=?
    ''', (content, len(content), file_id, project_id))
    
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="File not found")
    
    # Récupérer le fichier mis à jour
    cursor.execute('SELECT * FROM files WHERE id=?', (file_id,))
    file_data = cursor.fetchone()
    conn.commit()
    conn.close()
    
    # Broadcast mise à jour du fichier
    await manager.broadcast(json.dumps({
        "type": "file_updated",
        "payload": {"fileId": file_id, "projectId": project_id, "content": content}
    }))
    
    return File(
        id=file_data[0], name=file_data[1], path=file_data[2], content=file_data[3],
        language=file_data[4], size=file_data[5], lastModified=file_data[6],
        version=file_data[7], projectId=file_data[8]
    )

# Exécution de code
@app.post("/api/execute", response_model=ExecutionResult)
async def execute_code(request: CodeExecutionRequest):
    execution_id = str(uuid.uuid4())
    start_time = datetime.now()
    
    try:
        # Créer un fichier temporaire
        with tempfile.NamedTemporaryFile(mode='w', suffix=f'.{request.language}', delete=False) as tmp:
            tmp.write(request.code)
            tmp_path = tmp.name
        
        # Exécuter le code selon le langage
        if request.language == 'python':
            result = subprocess.run(
                ['python', tmp_path],
                capture_output=True,
                text=True,
                timeout=30
            )
        elif request.language in ['javascript', 'typescript']:
            result = subprocess.run(
                ['node', tmp_path],
                capture_output=True,
                text=True,
                timeout=30
            )
        else:
            raise HTTPException(status_code=400, detail="Unsupported language")
        
        # Nettoyer le fichier temporaire
        os.unlink(tmp_path)
        
        duration = int((datetime.now() - start_time).total_seconds() * 1000)
        
        execution_result = ExecutionResult(
            id=execution_id,
            code=request.code,
            output=result.stdout,
            errors=result.stderr,
            duration=duration,
            timestamp=datetime.now(),
            language=request.language,
            status="success" if result.returncode == 0 else "error"
        )
        
        # Sauvegarder l'exécution en base
        conn = sqlite3.connect('collaborative_platform.db')
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO executions (id, code, output, errors, duration, language, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (execution_id, request.code, result.stdout, result.stderr, duration, request.language, execution_result.status))
        conn.commit()
        conn.close()
        
        # Broadcast résultat d'exécution
        await manager.broadcast(json.dumps({
            "type": "execution_result",
            "payload": execution_result.dict()
        }))
        
        return execution_result
        
    except subprocess.TimeoutExpired:
        return ExecutionResult(
            id=execution_id,
            code=request.code,
            output="",
            errors="Execution timeout: Code execution exceeded 30 seconds",
            duration=30000,
            timestamp=datetime.now(),
            language=request.language,
            status="timeout"
        )
    except Exception as e:
        return ExecutionResult(
            id=execution_id,
            code=request.code,
            output="",
            errors=str(e),
            duration=0,
            timestamp=datetime.now(),
            language=request.language,
            status="error"
        )

# WebSocket
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, userId: str):
    await manager.connect(websocket, userId)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Gérer le heartbeat
            if message.get("type") == "heartbeat":
                manager.user_sessions[userId]["last_heartbeat"] = datetime.now()
                await manager.send_personal_message(json.dumps({
                    "type": "heartbeat_ack",
                    "timestamp": datetime.now().isoformat()
                }), userId)
            else:
                # Broadcast le message à tous les utilisateurs connectés
                await manager.broadcast(data)
                
    except WebSocketDisconnect:
        manager.disconnect(userId)
        await manager.broadcast(json.dumps({
            "type": "user_leave",
            "payload": {"userId": userId}
        }))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)