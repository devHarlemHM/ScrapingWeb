import hashlib
import hmac
import os


_ITERATIONS = 120_000


def hash_password(raw_password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", raw_password.encode("utf-8"), salt, _ITERATIONS)
    return f"pbkdf2_sha256${_ITERATIONS}${salt.hex()}${digest.hex()}"


def verify_password(raw_password: str, encoded_password: str) -> bool:
    try:
        scheme, iterations_text, salt_hex, digest_hex = encoded_password.split("$", 3)
        if scheme != "pbkdf2_sha256":
            return False
        iterations = int(iterations_text)
        salt = bytes.fromhex(salt_hex)
        expected = bytes.fromhex(digest_hex)
    except (ValueError, TypeError):
        return False

    actual = hashlib.pbkdf2_hmac("sha256", raw_password.encode("utf-8"), salt, iterations)
    return hmac.compare_digest(actual, expected)
