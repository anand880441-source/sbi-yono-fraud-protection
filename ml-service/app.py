from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from url_classifier import URLClassifier
import uvicorn
import json
import os

app = FastAPI(title="SBI YONO Fraud Detection API", version="1.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

classifier = URLClassifier()

class URLRequest(BaseModel):
    url: str

class URLResponse(BaseModel):
    url: str
    is_legitimate: bool
    confidence: float
    warning: str
    features: dict

@app.on_event("startup")
async def startup_event():
    if not classifier.load_model():
        classifier.train()
        print("Model trained and saved successfully")
    else:
        print("Model loaded successfully")

@app.get("/")
async def root():
    return {
        "service": "SBI YONO Fraud Detection",
        "status": "active",
        "version": "1.0"
    }

@app.post("/detect_url", response_model=URLResponse)
async def detect_url(request: URLRequest):
    try:
        result = classifier.predict(request.url)
        
        warning = ""
        if not result['is_legitimate']:
            warning = "⚠️ WARNING: This link appears suspicious! Only download YONO from official app stores (Google Play Store or Apple App Store)."
        else:
            warning = "✓ This link appears safe. Always verify the URL before entering credentials."
        
        return URLResponse(
            url=request.url,
            is_legitimate=result['is_legitimate'],
            confidence=result['confidence'],
            warning=warning,
            features=result['features']
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/report_fake_app")
async def report_fake_app(request: Request):
    """Endpoint to report fake YONO apps"""
    try:
        # Parse JSON body
        body = await request.json()
        url = body.get('url')
        reporter = body.get('reporter', 'anonymous')
        source = body.get('source', 'unknown')
        
        # Log the report
        print(f"📢 Fake app reported!")
        print(f"   URL: {url}")
        print(f"   Reporter: {reporter}")
        print(f"   Source: {source}")
        
        # Here you can add database storage
        
        return {
            "status": "reported",
            "message": "Thank you for reporting. This will be reviewed and blocked.",
            "url": url
        }
    except Exception as e:
        print(f"Error reporting app: {e}")
        return {
            "status": "error",
            "message": str(e)
        }

@app.get("/model_metrics")
async def get_model_metrics():
    """Get model performance metrics"""
    try:
        if os.path.exists('models/metrics.json'):
            with open('models/metrics.json', 'r') as f:
                metrics = json.load(f)
            return metrics
        else:
            return {"error": "Metrics not available. Train model first."}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
