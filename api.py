from fastapi import FastAPI
from pydantic import BaseModel
from strands.agent import Agent

app = FastAPI()

agent = Agent(name="feel_forward")

class Message(BaseModel):
    message: str

@app.post("/ask")
async def ask(msg: Message):
    reply = agent.process_message(msg.message)
    return {"response": reply}
