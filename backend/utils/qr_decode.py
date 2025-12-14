from __future__ import annotations
from dataclasses import dataclass
from typing import List
from io import BytesIO

from PIL import Image
from pyzbar.pyzbar import decode as zbar_decode

@dataclass
class QRDecoded:
    data: str
    type: str

def decode_qr_image(file_bytes: bytes) -> List[QRDecoded]:
    img = Image.open(BytesIO(file_bytes)).convert("RGB")
    results = zbar_decode(img)

    decoded: List[QRDecoded] = []
    for r in results:
        s = r.data.decode("utf-8", errors="replace").strip()
        decoded.append(QRDecoded(data=s, type=r.type))
    return decoded
