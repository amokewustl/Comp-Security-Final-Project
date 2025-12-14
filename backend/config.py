import os

class Config:
    MODEL_PATH = os.getenv("MODEL_PATH", "models/qr_malicious_model.joblib")
    THRESHOLD = float(os.getenv("THRESHOLD", "0.5"))
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH", 5 * 1024 * 1024))  # 5MB
