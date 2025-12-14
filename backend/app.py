from __future__ import annotations
import os
import joblib

from flask import Flask, request, jsonify
from flask_cors import CORS

from config import Config
from utils.qr_decode import decode_qr_image

def load_model(model_path: str):
    if not os.path.exists(model_path):
        return None
    return joblib.load(model_path)

app = Flask(__name__)
app.config.from_object(Config)
app.config["MAX_CONTENT_LENGTH"] = Config.MAX_CONTENT_LENGTH

CORS(app, resources={r"/api/*": {"origins": "*"}})

MODEL = load_model(app.config["MODEL_PATH"])

@app.get("/api/health")
def health():
    return {"ok": True, "model_loaded": MODEL is not None}, 200

def predict_payload(payload: str):
    if MODEL is None:
        return None, {"error": "Model not found. Train it first and ensure MODEL_PATH is correct."}, 503

    payload = (payload or "").strip()
    if not payload:
        return None, {"error": "payload is empty"}, 400

    prob = float(MODEL.predict_proba([payload])[0, 1])
    label = 1 if prob >= app.config["THRESHOLD"] else 0
    return {"payload": payload, "prob_malicious": prob, "label": label, "threshold": app.config["THRESHOLD"]}, None, 200

@app.post("/api/predict")
def predict():
    data = request.get_json(silent=True) or {}
    payload = data.get("payload", "")
    result, err, code = predict_payload(payload)
    if err:
        return jsonify(err), code
    return jsonify(result), 200

@app.post("/api/scan-image")
def scan_image():
    if MODEL is None:
        return jsonify({"error": "Model not found. Train it first."}), 503

    if "file" not in request.files:
        return jsonify({"error": "Missing multipart file field: file"}), 400

    f = request.files["file"]
    file_bytes = f.read()
    if not file_bytes:
        return jsonify({"error": "Empty upload"}), 400

    decoded = decode_qr_image(file_bytes)
    if not decoded:
        return jsonify({"error": "No QR detected in image"}), 200

    out = []
    for d in decoded:
        pred, err, code = predict_payload(d.data)
        if err:
            return jsonify(err), code
        out.append({"qr_type": d.type, **pred})

    return jsonify({"results": out}), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
