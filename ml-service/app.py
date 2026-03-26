from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from url_classifier import URLClassifier
import uvicorn

app = FastAPI(title="SBI YONO Fraud Detection API", version="1.0")

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize classifier
classifier = URLClassifier()

# Load or train model on startup
@app.on_event("startup")
async def startup_event():
    if not classifier.load_model():
        classifier.train()
        print("Model trained and saved successfully")
    else:
        print("Model loaded successfully")

class URLRequest(BaseModel):
    url: str

class URLResponse(BaseModel):
    url: str
    is_legitimate: bool
    confidence: float
    warning: str
    features: dict

@app.get("/")
async def root():
    return {
        "service": "SBI YONO Fraud Detection",
        "status": "active",
        "version": "1.0"
    }

@app.post("/detect_url", response_model=URLResponse)
async def detect_url(request: URLRequest):
    """Detect if a URL is legitimate or fake"""
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
async def report_fake_app(url: str, reporter: str = None):
    """Endpoint to report fake YONO apps"""
    # Store in database (will connect later)
    return {
        "status": "reported",
        "message": "Thank you for reporting. This will be reviewed and blocked.",
        "url": url
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)