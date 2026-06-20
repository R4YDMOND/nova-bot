from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float 
from datetime import datetime 
from database import Base 
 
class Server(Base): 
    __tablename__ = "servers" 
    id = Column(Integer, primary_key=True) 
    name = Column(String, nullable=False) 
    server_id = Column(String, unique=True) 
    webhook_url = Column(String, default="") 
    is_active = Column(Boolean, default=True) 
    created_at = Column(DateTime, default=datetime.utcnow) 
 
class ModuleConfig(Base): 
    __tablename__ = "module_configs" 
    id = Column(Integer, primary_key=True) 
    server_id = Column(Integer) 
    module_name = Column(String) 
    is_enabled = Column(Boolean, default=False) 
    config = Column(Text, default="") 
 
class AISettings(Base): 
    __tablename__ = "ai_settings" 
    id = Column(Integer, primary_key=True) 
    server_id = Column(Integer, unique=True) 
    bot_name = Column(String, default="Nova") 
    personality = Column(String, default="friendly") 
    temperature = Column(Float, default=0.7) 
    system_prompt = Column(Text, default="") 

class Member(Base):
    __tablename__ = "members"

    id = Column(Integer, primary_key=True, index=True)
    server_id = Column(String(255), nullable=False, index=True)
    user_id = Column(String(255), nullable=False)
    username = Column(String(255), nullable=False)
    avatar_url = Column(String(1024), nullable=True)
    level = Column(Integer, default=1)
    xp = Column(Integer, default=0)
    messages = Column(Integer, default=0)
    voice_minutes = Column(Integer, default=0)
    reactions = Column(Integer, default=0)
    last_active = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
