import os
import pandas as pd

PICKLE_PATH = os.getenv("backend/qr_codes_29.pickle", "qr_codes_29_labels.pickle")

def main():
    print("Loading:", PICKLE_PATH)
    obj = pd.read_pickle(PICKLE_PATH)

    print("\n=== TYPE ===")
    print(type(obj))

    # Common cases:
    # 1) pandas DataFrame
    # 2) dict with payload/label fields
    # 3) list of tuples/dicts
    if hasattr(obj, "head"):
        print("\n=== DataFrame columns ===")
        print(list(obj.columns))
        print("\n=== head() ===")
        print(obj.head(5))
        return

    if isinstance(obj, dict):
        print("\n=== Dict keys ===")
        print(list(obj.keys())[:50])
        # show a preview of a few keys
        for k in list(obj.keys())[:5]:
            v = obj[k]
            print(f"\nKey: {k}  Type: {type(v)}")
            try:
                print("Len:", len(v))
            except Exception:
                pass
        return

    if isinstance(obj, list):
        print("\n=== List length ===", len(obj))
        if len(obj) > 0:
            print("\n=== First element type ===", type(obj[0]))
            print("First element preview:", obj[0])
        return

    print("\nUnhandled object type; preview:", repr(obj)[:500])

if __name__ == "__main__":
    main()
