"""The rule for what may be uploaded as a receipt: a JPEG, PNG or WEBP photo, or a PDF, of 5 MB at most.

The receipts module's domain rule, applied by the upload (application/upload_receipt.py) before anything is stored.
The type is read from the file's first bytes (its signature), never from its name or the Content-Type the client
sent: those are only claims, and the model is told the media type, so it has to be true. Pure functions.
"""

from app.core.errors import BusinessRuleError
from app.core.i18n import translatable
from app.modules.receipts.i18n import ReceiptText
from app.modules.receipts.values import MAX_RECEIPT_BYTES, MAX_RECEIPT_MB, ReceiptMediaType

# Each type's signature: the bytes its files carry, and where. WEBP is a RIFF container ("RIFF", four bytes of
# size, "WEBP", then a VP8/VP8L/VP8X chunk); PNG starts with its 8-byte header followed by the IHDR chunk.
_SIGNATURES: dict[ReceiptMediaType, tuple[tuple[int, bytes], ...]] = {
    ReceiptMediaType.JPEG: ((0, b"\xff\xd8\xff"),),
    ReceiptMediaType.PNG: ((0, b"\x89PNG\r\n\x1a\n"),),
    ReceiptMediaType.WEBP: ((0, b"RIFF"), (8, b"WEBP")),
    ReceiptMediaType.PDF: ((0, b"%PDF-"),),
}
_WEBP_CHUNKS = (b"VP8 ", b"VP8L", b"VP8X")
# A type without a signature could never be recognised: fail at import, not on an upload.
assert set(_SIGNATURES) == set(ReceiptMediaType)


def _matches_structure(media_type: ReceiptMediaType, data: bytes) -> bool:
    """True if `data` carries the required header structure for `media_type` beyond its initial magic bytes."""
    match media_type:
        case ReceiptMediaType.JPEG:
            return len(data) >= 4 and 0xC0 <= data[3] <= 0xFE
        case ReceiptMediaType.PNG:
            return len(data) >= 16 and data[12:16] == b"IHDR"
        case ReceiptMediaType.WEBP:
            return len(data) >= 16 and data[12:16] in _WEBP_CHUNKS
        case ReceiptMediaType.PDF:
            return data.startswith((b"%PDF-1.", b"%PDF-2."))


def media_type_of(data: bytes) -> ReceiptMediaType | None:
    """Which accepted kind of file `data` is, from its first bytes; None if it's none of them."""
    for media_type, marks in _SIGNATURES.items():
        if all(data[offset : offset + len(mark)] == mark for offset, mark in marks) and _matches_structure(
            media_type, data
        ):
            return media_type
    return None


def check_receipt_file(data: bytes) -> ReceiptMediaType:
    """The file's media type, if it may be a receipt.

    Raises BusinessRuleError (a 422, in the request's language) for an empty file, one over MAX_RECEIPT_BYTES, or one
    that isn't a JPEG, PNG, WEBP or PDF.
    """
    if not data:
        raise BusinessRuleError(translatable(ReceiptText.EMPTY_FILE))
    if len(data) > MAX_RECEIPT_BYTES:
        raise BusinessRuleError(translatable(ReceiptText.TOO_LARGE, max_mb=MAX_RECEIPT_MB))
    media_type = media_type_of(data)
    if media_type is None:
        raise BusinessRuleError(translatable(ReceiptText.UNSUPPORTED_TYPE))
    return media_type
