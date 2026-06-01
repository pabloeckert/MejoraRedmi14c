"""
Calcula el perfil de debloat personalizado dado un serial de dispositivo.

No ejecuta nada directamente. Devuelve listas de packages para que el
motor Bash (bloatware_run) las consuma, o para el dry-run.

Relación con los scripts Bash:
  _POCO_MODE  ←→  PROFILE_POCO_MODE  en  src/cli/data/bloatware_db.sh
  Si modificás uno, modificás el otro.
"""

from __future__ import annotations

import json
from pathlib import Path

from forge.core.apps_catalog import (
    BUSINESS_CRITICAL, SAFETYNET_PROTECTED, WORK_INDICATOR_APPS, pkg_to_name,
)
from forge.db.database import get_device


# ─── Lista base (espejo de PROFILE_POCO_MODE en bloatware_db.sh) ─────────────

_POCO_MODE: list[str] = [
    # Facebook / Meta
    "com.facebook.katana",
    "com.facebook.stella",   # nuevo nombre de katana (2024+)
    "com.facebook.orca",
    "com.facebook.lite",
    "com.facebook.services",
    "com.facebook.system",
    # Redes sociales
    "com.instagram.android",
    "com.zhiliaoapp.musically",
    "com.ss.android.ugc.trill",
    "com.twitter.android",
    "com.snapchat.android",
    "com.pinterest",
    "com.reddit.frontpage",
    "com.linkedin.android",
    # Google pesado
    "com.google.android.youtube",
    "com.google.android.apps.maps",
    "com.google.android.gm",
    "com.android.chrome",
    "com.google.android.videos",
    "com.google.android.apps.youtube.music",
    "com.google.android.apps.tachyon",
    "com.google.android.talk",
    "com.google.android.apps.subscriptions.red",
    "com.google.android.apps.chromecast.app",
    # Entretenimiento
    "com.spotify.music",
    "com.netflix.mediaclient",
    "tv.twitch.android.app",
    "com.amazon.mShop.android.shopping",
    # Microsoft preinstalado
    "com.microsoft.office.word",
    "com.microsoft.office.excel",
    "com.microsoft.office.powerpoint",
    "com.microsoft.office.outlook",
    "com.microsoft.skydrive",
    "com.microsoft.teams",
    "com.microsoft.bing",
]


# ─── Core ─────────────────────────────────────────────────────────────────────

def _load_profile(serial: str) -> dict:
    device = get_device(serial) or {}
    try:
        return json.loads(device.get("profile_json") or "{}")
    except (json.JSONDecodeError, TypeError):
        return {}


def has_profile(serial: str) -> bool:
    """True si el dispositivo tiene un perfil de usuario guardado."""
    return bool(_load_profile(serial).get("name"))


def _is_work_user(profile: dict) -> bool:
    """True si el perfil indica uso laboral — activa protección de BUSINESS_CRITICAL."""
    apps_keep = set(profile.get("apps", []))
    return bool(apps_keep & WORK_INDICATOR_APPS)


def build_debloat_list(serial: str) -> tuple[list[str], list[str]]:
    """
    Devuelve (to_remove, excluded).

    to_remove — packages a desactivar con pm disable-user --user 0
    excluded  — packages en la lista base que se protegen:
                  · elegidos por el usuario en el wizard (apps_keep)
                  · SafetyNet si banking=True
                  · BUSINESS_CRITICAL si banking=True O perfil laboral
    """
    profile = _load_profile(serial)

    apps_keep: set[str] = set(profile.get("apps", []))
    banking:   bool     = bool(profile.get("banking", False))

    protected = set(apps_keep)
    if banking:
        protected |= SAFETYNET_PROTECTED
    if banking or _is_work_user(profile):
        protected |= BUSINESS_CRITICAL

    to_remove = [pkg for pkg in _POCO_MODE if pkg not in protected]
    excluded  = [pkg for pkg in _POCO_MODE if pkg in protected]

    return to_remove, excluded


# ─── Dry-run ─────────────────────────────────────────────────────────────────

def dry_run_report(serial: str) -> str:
    """Genera el reporte completo de qué haría un debloat sin ejecutar nada."""
    profile   = _load_profile(serial)
    to_remove, excluded = build_debloat_list(serial)

    name    = profile.get("name", "(sin nombre)")
    banking = bool(profile.get("banking", False))
    wa_h    = profile.get("wa_hours", 0)
    bank_n  = profile.get("bank_name", "")
    apps_k  = profile.get("apps", [])

    lines = [
        "╔══════════════════════════════════════════════════════════════╗",
        "║  DRY-RUN — Debloat personalizado                            ║",
        "╚══════════════════════════════════════════════════════════════╝",
        "",
        f"  Perfil:      {name}",
        f"  Serial:      {serial}",
        f"  WhatsApp:    {wa_h}h/día",
        f"  Banca:       {'SÍ — ' + bank_n + ' (SafetyNet activo)' if banking else 'No'}",
    ]

    work_user = _is_work_user(profile)
    if apps_k:
        lines.append(f"  Apps keep:   {len(apps_k)} protegidas por el usuario")
    if banking or work_user:
        trigger = "banca" if banking else "apps de trabajo"
        lines.append(f"  Bus.critical: Gmail, Chrome, Maps, Calendar protegidas [{trigger}]")

    lines += [
        "",
        f"  [DESACTIVAR]  {len(to_remove)} apps",
        "  " + "─" * 60,
    ]

    for pkg in sorted(to_remove, key=pkg_to_name):
        lines.append(f"  pm disable-user --user 0 {pkg}")
        lines.append(f"  {'':26}└─ {pkg_to_name(pkg)}")

    if excluded:
        lines += [
            "",
            f"  [PROTEGIDAS]  {len(excluded)} apps — no se tocan",
            "  " + "─" * 60,
        ]
        for pkg in sorted(excluded, key=pkg_to_name):
            if pkg in SAFETYNET_PROTECTED:
                reason = "SafetyNet / banca"
            elif pkg in BUSINESS_CRITICAL:
                reason = "crítica de negocio (automática)"
            else:
                reason = "protegida por el usuario"
            lines.append(f"  # {pkg_to_name(pkg):<32}  [{reason}]")

    lines += [
        "",
        "  Modo real: pm disable-user --user 0 <pkg>  (reversible)",
        "  Revertir:  pm enable <pkg>  o  pm install-existing --user 0 <pkg>",
    ]

    return "\n".join(lines)


# ─── Escritura del perfil runtime para Bash ──────────────────────────────────

def write_runtime_profile(serial: str, output_path: str | Path) -> tuple[list[str], list[str]]:
    """
    Escribe src/cli/data/profile_runtime.sh con el array PROFILE_RUNTIME.
    profile_optimize.sh lo sourcea antes de llamar a bloatware_run.
    Devuelve (to_remove, excluded).
    """
    to_remove, excluded = build_debloat_list(serial)
    profile = _load_profile(serial)
    name    = profile.get("name", "usuario")

    content = [
        "#!/bin/bash",
        "# Auto-generado por forge/core/debloat_engine.py — no editar a mano",
        f"# Perfil: {name} | Serial: {serial}",
        "",
        "PROFILE_RUNTIME=(",
    ]
    for pkg in to_remove:
        content.append(f'    "{pkg}"  # {pkg_to_name(pkg)}')
    content.append(")")
    content.append("")

    Path(output_path).write_text("\n".join(content), encoding="utf-8")
    return to_remove, excluded
