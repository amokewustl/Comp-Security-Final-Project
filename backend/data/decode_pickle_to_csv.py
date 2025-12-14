import os
import pandas as pd
import numpy as np
from PIL import Image, ImageOps
from pyzbar.pyzbar import decode as zbar_decode

X_PATH = os.getenv("X_PATH", "data/qr_codes_29.pickle")
Y_PATH = os.getenv("Y_PATH", "data/qr_codes_29_labels.pickle")
OUT_CSV = os.getenv("OUT_CSV", "data/qr_dataset.csv")

# For quick testing, set MAX_N=200 etc.
MAX_N = int(os.getenv("MAX_N", "0"))  # 0 = all

SCALES = [6, 8, 10]  # upscaling factors to help decoder
PADDING = 20         # quiet-zone padding (in pixels after scaling)

def try_decode(pil_img: Image.Image):
    res = zbar_decode(pil_img)
    if not res:
        return None
    try:
        return res[0].data.decode("utf-8", errors="replace").strip()
    except Exception:
        return str(res[0].data)

def arr_to_pil(arr01: np.ndarray) -> Image.Image:
    # arr is 0/1 -> convert to 0/255 grayscale
    img = (arr01.astype(np.uint8) * 255)
    return Image.fromarray(img, mode="L")

def main():
    X = pd.read_pickle(X_PATH)  # expected: ndarray (N,69,69)
    y = pd.read_pickle(Y_PATH)  # expected: ndarray (N,)

    if not isinstance(X, np.ndarray) or not isinstance(y, np.ndarray):
        raise ValueError("Expected both X and y to be numpy arrays from the pickles.")
    if len(X) != len(y):
        raise ValueError(f"Length mismatch: X={len(X)} y={len(y)}")

    n = len(X) if MAX_N == 0 else min(MAX_N, len(X))
    print(f"Loaded X: {X.shape}, y: {y.shape}. Processing n={n}")

    rows = []
    decoded_ok = 0
    decoded_fail = 0

    for i in range(n):
        arr = X[i]
        label = int(y[i])

        base = arr_to_pil(arr)

        payload = None
        # Try normal and inverted (depends on how 0/1 maps to black/white)
        for invert in [False, True]:
            img = ImageOps.invert(base) if invert else base

            for s in SCALES:
                up = img.resize((img.size[0] * s, img.size[1] * s), resample=Image.NEAREST)
                up = ImageOps.expand(up, border=PADDING, fill=255)  # add quiet zone (white)

                payload = try_decode(up)
                if payload:
                    break
            if payload:
                break

        if payload:
            decoded_ok += 1
        else:
            decoded_fail += 1
            payload = ""  # keep for debugging; we will drop empties later

        rows.append({"index": i, "payload": payload, "label": label})

        if (i + 1) % 500 == 0:
            print(f"Processed {i+1}/{n} | decoded_ok={decoded_ok} decoded_fail={decoded_fail}")

    df = pd.DataFrame(rows)
    before = len(df)
    df = df[df["payload"] != ""].copy()  # drop failures
    after = len(df)

    os.makedirs(os.path.dirname(OUT_CSV), exist_ok=True)
    df.to_csv(OUT_CSV, index=False)

    print(f"\nSaved: {OUT_CSV}")
    print(f"Total rows: {before} | kept (decoded): {after} | dropped: {before-after}")
    print(df.head(5))

if __name__ == "__main__":
    main()
