from sqlmodel import SQLModel, Field, Relationship
from typing import List, Optional

class City(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    slug: str
    population: int | None
    county: str
    county_website: Optional[str] = None

    images:   List["CityImage"] = Relationship(back_populates="city")
    articles: List["NewsItem"]  = Relationship(back_populates="city")

class CityImage(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    city_id: int | None = Field(default=None, foreign_key="city.id")
    image_url: str

    city: City = Relationship(back_populates="images")

class NewsItem(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    city_id: int | None = Field(default=None, foreign_key="city.id")
    title: str
    link: str
    description: str

    city: City = Relationship(back_populates="articles")
