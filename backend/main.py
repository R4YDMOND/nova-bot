from fastapi import FastAPI 
from fastapi.middleware.cors import CORSMiddleware 
from database import init_db, SessionLocal 
from models import Server 
 
app = FastAPI(title="Nova API", version="0.2.0") 
 
app.add_middleware( 
    CORSMiddleware, 
    allow_origins=["*"], 
    allow_methods=["*"], 
    allow_headers=["*"], 
) 
 
@app.on_event("startup") 
def startup(): 
    init_db() 
 
@app.get("/") 
def root(): 
    return {"status": "ok"} 
 
@app.get("/api/servers") 
def get_servers(): 
    db = SessionLocal() 
    servers = db.query(Server).all() 
    db.close() 
    return {"servers": [{"id": s.id, "name": s.name} for s in servers], "total": len(servers)} 
 
@app.post("/api/servers") 
def create_server(name: str, server_id: str, webhook_url: str = ""): 
    db = SessionLocal() 
    server = Server(name=name, server_id=server_id, webhook_url=webhook_url) 
    db.add(server) 
    db.commit() 
    db.refresh(server) 
    db.close() 
    return {"status": "created", "server": {"id": server.id, "name": server.name}} 
