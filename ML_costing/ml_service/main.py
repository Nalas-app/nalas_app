from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import pandas as pd
import os
'''uvicorn main:app --reload'''

app = FastAPI()

# Get absolute path to model folder
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "model", "cost_model.pkl")

model = joblib.load(MODEL_PATH)

class CostRequest(BaseModel):
    event_type: str
    location: str
    quantity: int
    ingredient_cost: float
    labor_cost: float
    overhead_cost: float
    demand_index: float

@app.post("/predict-cost")
def predict_cost(request: CostRequest):
    input_data = pd.DataFrame([request.dict()])
    prediction = model.predict(input_data)[0]
    return {"predicted_cost": float(prediction)}
@app.get("/")
def home():
    return {"message": "Nalas ML Costing Engine is running"}