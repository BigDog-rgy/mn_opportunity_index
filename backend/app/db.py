import os
from sqlmodel import create_engine, Session

engine = create_engine(os.getenv("DATABASE_URL"), echo=False)

def get_session():
    with Session(engine) as session:
        yield session
