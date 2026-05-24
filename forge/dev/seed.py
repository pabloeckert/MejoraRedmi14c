"""
Perfil de prueba para desarrollo — Valentina, dispositivo simulado.

Uso:  python -m forge.dev.seed
      python -m forge.dev.seed --clear   (elimina el perfil de prueba)
"""

import json
import sys

from forge.db.database import get_connection, init_db, save_profile, upsert_device

SERIAL = "TEST-VALENTINA-001"


def seed():
    init_db()

    upsert_device(
        serial=SERIAL,
        model="Redmi 14C",
        android_ver="16",
        hyperos_ver="HyperOS 3.0",
    )

    save_profile(SERIAL, {
        "name":       "Valentina",
        "apps": [
            "com.whatsapp",              # WhatsApp — usa 4h/día, protegida
            "com.instagram.android",     # Instagram — protegida por el usuario
            "com.spotify.music",         # Spotify — protegida por el usuario
        ],
        "wa_hours":   4,                 # 4h/día → prioridad máxima background
        "photo_type": "personas",        # selfies, familia
        "banking":    True,              # usa Galicia → SafetyNet activo
        "bank_name":  "Galicia",
    })

    print(f"Perfil insertado: Valentina ({SERIAL})")
    print("  · WhatsApp protegido (4h/día)")
    print("  · Instagram protegido")
    print("  · Spotify protegido")
    print("  · Banca móvil: Galicia (SafetyNet activo)")


def clear():
    with get_connection() as conn:
        conn.execute("DELETE FROM devices WHERE serial = ?", (SERIAL,))
    print(f"Perfil de prueba eliminado ({SERIAL})")


if __name__ == "__main__":
    if "--clear" in sys.argv:
        clear()
    else:
        seed()
