import os
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, roc_auc_score

DATA_PATH = os.getenv("DATA_PATH", "data/qr_dataset.csv")
MODEL_OUT = os.getenv("MODEL_OUT", "models/qr_malicious_model.joblib")

def main():
    df = pd.read_csv(DATA_PATH)

    if "payload" not in df.columns or "label" not in df.columns:
        raise ValueError("CSV must contain columns: payload,label")

    df["payload"] = df["payload"].fillna("").astype(str).str.strip()
    df = df[df["payload"] != ""]
    y = df["label"].astype(int)
    X = df["payload"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = Pipeline([
        ("tfidf", TfidfVectorizer(analyzer="char", ngram_range=(3, 5), min_df=2)),
        ("clf", LogisticRegression(max_iter=2000, class_weight="balanced"))
    ])

    model.fit(X_train, y_train)

    proba = model.predict_proba(X_test)[:, 1]
    pred = (proba >= 0.5).astype(int)

    print("ROC AUC:", roc_auc_score(y_test, proba))
    print(classification_report(y_test, pred, digits=4))

    os.makedirs(os.path.dirname(MODEL_OUT), exist_ok=True)
    joblib.dump(model, MODEL_OUT)
    print(f"Saved model => {MODEL_OUT}")

if __name__ == "__main__":
    main()
