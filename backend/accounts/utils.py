import hashlib
import secrets
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired


def clean_phone(phone):
    """
    Normalizes a phone number to Ugandan format: +256XXXXXXXXX.
    Uses simple checks and easy variable names.
    """
    if not phone:
        return ""
    
    digits = str(phone).strip().replace(" ", "").replace("-", "")
    
    if digits.startswith("0"):
        return "+256" + digits[1:]
    elif digits.startswith("256"):
        return "+" + digits
    elif not digits.startswith("+"):
        return "+256" + digits
        
    return digits


def get_client_ip(request):
    """Extracts client IP address safely from request metadata."""
    if not request:
        return ""
    x_forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded:
        return x_forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "")


def generate_secure_otp():
    """
    Generates a cryptographically strong 6-digit numeric OTP and salted SHA-256 hash.
    Returns: (code, salt, code_hash)
    """
    code = f"{secrets.randbelow(1000000):06d}"
    salt = secrets.token_hex(16)
    code_hash = hashlib.sha256((code + salt).encode()).hexdigest()
    return code, salt, code_hash


def hash_code(code, salt):
    """Computes SHA-256 hash of code + salt."""
    return hashlib.sha256((str(code).strip() + str(salt)).encode()).hexdigest()


def make_verification_token(phone):
    """Creates a cryptographically signed, timestamped token for registration handover."""
    signer = TimestampSigner(salt="tundagula-otp-verification")
    return signer.sign(phone)


def check_verification_token(token, phone, max_age=900):
    """
    Verifies the cryptographic token for the given phone.
    Default max age is 900 seconds (15 minutes).
    """
    if not token or not phone:
        return False
    signer = TimestampSigner(salt="tundagula-otp-verification")
    try:
        signed_phone = signer.unsign(token, max_age=max_age)
        return signed_phone == phone
    except (BadSignature, SignatureExpired):
        return False
