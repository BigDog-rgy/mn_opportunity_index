import json, sys, slugify
from sqlalchemy import func
from sqlmodel import Session, select
from app.db import engine
from app.models import City, CityImage, NewsItem

def load_images(path, sess):
    imgs = json.load(open(path))
    for rec in imgs:
        city = sess.exec(
            select(City).where(func.lower(City.name) == rec["city"].lower())
        ).first()
        if city:
            sess.add(CityImage(city_id=city.id, image_url=rec["image_url"]))

def load_news(path, sess):
    blobs = json.load(open(path))
    for city_name, stories in blobs.items():
        city = sess.exec(
            select(City).where(func.lower(City.name) == city_name.lower())
        ).first()
        if city:
            for s in stories:
                sess.add(NewsItem(city_id=city.id, **s))

if len(sys.argv) != 3:
    print("Usage: python -m app.load_extras images.json news.json"); sys.exit(1)

with Session(engine) as s:
    load_images(sys.argv[1], s)
    load_news(sys.argv[2], s)
    s.commit()
print("Images & news imported")
