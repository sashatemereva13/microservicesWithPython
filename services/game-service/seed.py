import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine
from app.models import Base, Game


GAMES = [
    {
        "title": "The Legend of Zelda: Breath of the Wild",
        "genre": "Action-adventure",
        "platform": "Nintendo Switch",
        "release_year": 2017,
        "cover_url": "https://example.com/zelda-botw.jpg",
    },
    {
        "title": "Elden Ring",
        "genre": "Action RPG",
        "platform": "PC",
        "release_year": 2022,
        "cover_url": "https://example.com/elden-ring.jpg",
    },
    {
        "title": "Minecraft",
        "genre": "Sandbox",
        "platform": "PC",
        "release_year": 2011,
        "cover_url": "https://example.com/minecraft.jpg",
    },
    {
        "title": "Hollow Knight",
        "genre": "Metroidvania",
        "platform": "PC",
        "release_year": 2017,
        "cover_url": "https://example.com/hollow-knight.jpg",
    },
    {
        "title": "Stardew Valley",
        "genre": "Simulation RPG",
        "platform": "PC",
        "release_year": 2016,
        "cover_url": "https://example.com/stardew-valley.jpg",
    },
]


def run():
    # Alembic should create tables, but this makes the seed safer if run locally.
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    imported = 0

    for data in GAMES:
        existing = db.query(Game).filter(Game.title == data["title"]).first()

        if existing:
            continue

        game = Game(
            title=data["title"],
            genre=data["genre"],
            platform=data["platform"],
            release_year=data["release_year"],
            cover_url=data["cover_url"],
        )

        db.add(game)
        imported += 1

    db.commit()
    db.close()

    print(f"Imported {imported} games.")


if __name__ == "__main__":
    run()