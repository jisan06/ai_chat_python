
from fastapi import FastAPI

app = FastAPI(title="AI Chat App")

@app.get("/")
def home():
    return {"message": "AI Chat App Backend is running!"}
