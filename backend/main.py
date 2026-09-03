import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import metrics, simulate, options, risk, insights, stress, validation

app = FastAPI(title="Aegis API", version="1.0.0")

origins = ["http://localhost:3000", "https://*.vercel.app"]
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(metrics.router,    prefix="/metrics",    tags=["Metrics"])
app.include_router(simulate.router,   prefix="/simulate",   tags=["Simulate"])
app.include_router(options.router,    prefix="/options",    tags=["Options"])
app.include_router(risk.router,       prefix="/risk",       tags=["Risk"])
app.include_router(insights.router,   prefix="/insights",   tags=["Insights"])
app.include_router(stress.router,     prefix="/stress",     tags=["Stress"])
app.include_router(validation.router, prefix="/validation", tags=["Validation"])

@app.get("/")
def root():
    return {"message": "Aegis Portfolio Intelligence API", "status": "online"}