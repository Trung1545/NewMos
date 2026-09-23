from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import List

app = FastAPI(
    title="Shoe E-Commerce AI Service",
    description="Microservice hỗ trợ gợi ý giày thông minh và tìm kiếm bằng hình ảnh",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "ai-service"}

@app.get("/api/v1/recommendations/{product_id}")
def get_recommendations(product_id: str):
    """
    Gợi ý các sản phẩm giày tương đồng dựa trên Vector Embeddings của sản phẩm
    """
    return {
        "source_product_id": product_id,
        "recommendations": [
            {"product_id": "shoe-sample-1", "similarity_score": 0.94},
            {"product_id": "shoe-sample-2", "similarity_score": 0.88}
        ]
    }
