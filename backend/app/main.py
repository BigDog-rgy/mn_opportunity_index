from fastapi import FastAPI, Depends, HTTPException
from sqlmodel import select, SQLModel
from app.db import engine, get_session
from app.models import City, CityImage, NewsItem

app = FastAPI(title="Cities API")

# create tables once
SQLModel.metadata.create_all(engine)

@app.get("/cities")
def list_cities(session=Depends(get_session)):
    return session.exec(select(City)).all()

@app.get("/city/{slug}")
def one_city(slug: str, session=Depends(get_session)):
    city = session.exec(select(City).where(City.slug == slug)).first()
    if not city:
        raise HTTPException(404, "Not found")
    return city

@app.get("/city/{slug}/images")
def images(slug: str, session=Depends(get_session)):
    city = session.exec(select(City).where(City.slug == slug)).first()
    if not city:
        raise HTTPException(404, "City not found")
    return city.images

@app.get("/city/{slug}/news")
def news(slug: str, session=Depends(get_session)):
    city = session.exec(select(City).where(City.slug == slug)).first()
    if not city:
        raise HTTPException(404, "City not found")
    return city.articles