import re


def normalize_phone(phone: str) -> str:
    """
    Normalisasi nomor HP Indonesia ke format 628xxxx.
    Mendukung: 08xxx, +628xxx, 628xxx, 8xxx
    """
    phone = re.sub(r"[\s\-\(\)]", "", phone)
    if phone.startswith("+62"):
        return phone[1:]
    elif phone.startswith("62"):
        return phone
    elif phone.startswith("08"):
        return "62" + phone[1:]
    elif phone.startswith("8"):
        return "62" + phone
    return phone


def to_wa_link(phone: str) -> str:
    """Konversi nomor HP ke link WhatsApp."""
    normalized = normalize_phone(phone)
    return f"https://wa.me/{normalized}"


def to_call_link(phone: str) -> str:
    """Konversi nomor HP ke link telepon."""
    normalized = normalize_phone(phone)
    return f"tel:+{normalized}"
