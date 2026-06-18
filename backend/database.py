from sqlalchemy import create_engine 
from sqlalchemy.orm import sessionmaker, declarative_base 
 
DATABASE_URL = "sqlite:///./nova.db" 
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False}) 
SessionLocal = sessionmaker(bind=engine) 
Base = declarative_base() 
 
def init_db(): 
    Base.metadata.create_all(bind=engine) 
    print("OK: Database ready") 
