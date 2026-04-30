from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import metrics, simulate, options, risk, insights

app = FastAPI(title="Aegis API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(metrics.router, prefix="/metrics", tags=["Metrics"])
app.include_router(simulate.router, prefix="/simulate", tags=["Simulate"])
app.include_router(options.router, prefix="/options", tags=["Options"])
app.include_router(risk.router, prefix="/risk", tags=["Risk"])
app.include_router(insights.router, prefix="/insights", tags=["Insights"])

@app.get("/")
def root():
    return {"message": "Aegis Portfolio Intelligence API", "status": "online"}