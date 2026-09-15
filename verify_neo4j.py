import os
import sys

sys.path.insert(0, os.path.abspath('src/backend'))

from app.config import settings
from neo4j import GraphDatabase

def verify_connection():
    if not settings.NEO4J_PASSWORD:
        print("ERROR: NEO4J_PASSWORD environment variable is not set.")
        sys.exit(1)
        
    try:
        driver = GraphDatabase.driver(settings.NEO4J_URI, auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD))
        driver.verify_connectivity()
        print(f"SUCCESS: Successfully connected to Neo4j at {settings.NEO4J_URI} as user '{settings.NEO4J_USER}'!")
        driver.close()
    except Exception as e:
        print(f"FAILED: Could not connect to Neo4j. Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    verify_connection()
