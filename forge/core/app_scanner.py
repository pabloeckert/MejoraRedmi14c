"""
Escanea apps instaladas en el dispositivo y las clasifica.
"""

import os
import subprocess
from dataclasses import dataclass, field

from forge.core.apps_catalog import (
    DEBLOAT_CATALOG, SAFETYNET_PROTECTED, BUSINESS_CRITICAL,
)
from forge.core.packages_db import PACKAGES_DB, lookup as db_lookup

JOYOSE_PKG = "com.xiaomi.joyose"

CATEGORY_ORDER = [
    "Sistema Xiaomi",
    "Google",
    "Sistema Android",
    "MediaTek",
    "Redes sociales",
    "Comunicación",
    "Entretenimiento",
    "Productividad",
    "Desconocido",
]

_CAT_MAP = {
    "social":  "Redes sociales",
    "google":  "Google",
    "xiaomi":  "Sistema Xiaomi",
    "msft":    "Productividad",
    "entret":  "Entretenimiento",
    "util":    "Sistema Android",
}

_SYSTEM_PREFIXES = ("/system/", "/vendor/", "/product/", "/apex/", "/oem/", "/odm/")


@dataclass
class AppInfo:
    package: str
    apk_path: str
    name: str
    category: str
    source: str          # "catalog" | "db" | "unknown"
    is_disabled: bool
    is_system: bool
    is_protected: bool
    haiku_description: str = ""
    action: str = "keep"  # "keep" | "remove" | "ask"


_ADB_PATH: str | None = None


def _get_adb() -> str:
    global _ADB_PATH
    if _ADB_PATH is None:
        try:
            from forge.core.adb_bridge import find_adb
            _ADB_PATH = find_adb() or "adb"
        except Exception:
            _ADB_PATH = "adb"
    return _ADB_PATH


def _adb_shell(serial: str, *args: str) -> str:
    try:
        result = subprocess.run(
            [_get_adb(), "-s", serial, "shell"] + list(args),
            capture_output=True,
            encoding="utf-8",
            errors="replace",
            timeout=90,
        )
        return result.stdout
    except Exception:
        return ""


def _is_system_path(path: str) -> bool:
    return any(path.startswith(p) for p in _SYSTEM_PREFIXES)


def _derive_display_name(pkg: str) -> str:
    parts = pkg.split(".")
    raw = parts[-1] if len(parts) >= 3 else pkg
    import re
    raw = re.sub(r"[_\-]", " ", raw)
    raw = re.sub(r"([a-z])([A-Z])", r"\1 \2", raw)
    return raw.strip().capitalize() or pkg


def scan_packages(serial: str) -> list[AppInfo]:
    """Lee todas las apps del dispositivo vía pm list packages -f."""
    raw_all = _adb_shell(serial, "pm", "list", "packages", "-f")
    raw_disabled = _adb_shell(serial, "pm", "list", "packages", "-d")

    disabled_pkgs: set[str] = set()
    for line in raw_disabled.splitlines():
        line = line.strip()
        if line.startswith("package:"):
            disabled_pkgs.add(line[len("package:"):].strip())

    apps: list[AppInfo] = []
    seen: set[str] = set()

    for line in raw_all.splitlines():
        line = line.strip()
        if not line.startswith("package:"):
            continue
        rest = line[len("package:"):]
        eq_idx = rest.rfind("=")
        if eq_idx < 0:
            continue
        apk_path = rest[:eq_idx]
        pkg = rest[eq_idx + 1:].strip()
        if not pkg or pkg in seen:
            continue
        seen.add(pkg)

        is_disabled = pkg in disabled_pkgs
        is_system = _is_system_path(apk_path)
        is_protected = (
            pkg in SAFETYNET_PROTECTED
            or pkg in BUSINESS_CRITICAL
            or pkg == JOYOSE_PKG
        )

        if pkg in DEBLOAT_CATALOG:
            entry = DEBLOAT_CATALOG[pkg]
            name = entry.name
            category = _CAT_MAP.get(entry.category, "Desconocido")
            source = "catalog"
            action = "ask"
        elif pkg in PACKAGES_DB:
            db_entry = PACKAGES_DB[pkg]
            name = db_entry.name
            category = db_entry.category
            source = "db"
            action = "keep"
        else:
            name = _derive_display_name(pkg)
            category = "Desconocido"
            source = "unknown"
            action = "ask"

        apps.append(AppInfo(
            package=pkg,
            apk_path=apk_path,
            name=name,
            category=category,
            source=source,
            is_disabled=is_disabled,
            is_system=is_system,
            is_protected=is_protected,
            action=action,
        ))

    return sorted(
        apps,
        key=lambda a: (
            CATEGORY_ORDER.index(a.category) if a.category in CATEGORY_ORDER else 99,
            a.name.lower(),
        ),
    )


def classify_batch_with_haiku(pkgs: list[str], api_key: str) -> dict[str, str]:
    """Describe packages desconocidos con Haiku. Devuelve {pkg: descripcion}."""
    if not pkgs or not api_key:
        return {}
    try:
        import anthropic
    except ImportError:
        return {}

    client = anthropic.Anthropic(api_key=api_key)
    pkg_list = "\n".join(f"- {p}" for p in pkgs)

    try:
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1024,
            messages=[{
                "role": "user",
                "content": (
                    "Describí en español (máx 8 palabras por línea) qué hace cada package Android.\n"
                    "Respondé SOLO con el formato: package_name|descripción\n"
                    "Una línea por package, sin encabezados ni texto extra.\n\n"
                    f"{pkg_list}"
                ),
            }],
        )
        results: dict[str, str] = {}
        for line in message.content[0].text.strip().splitlines():
            if "|" in line:
                pkg, _, desc = line.partition("|")
                pkg = pkg.strip().lstrip("- ")
                desc = desc.strip()
                if pkg and desc:
                    results[pkg] = desc
        return results
    except Exception:
        return {}


def disable_package(serial: str, pkg: str) -> tuple[bool, str]:
    """Desactiva un package. Doble guardrail: joyose + SAFETYNET + BUSINESS_CRITICAL."""
    if pkg == JOYOSE_PKG or pkg in SAFETYNET_PROTECTED or pkg in BUSINESS_CRITICAL:
        return False, "Protegido — operación denegada"

    adb = _get_adb()
    result = subprocess.run(
        [adb, "-s", serial, "shell", "pm", "disable-user", "--user", "0", pkg],
        capture_output=True, encoding="utf-8", errors="replace", timeout=30,
    )
    out = (result.stdout + result.stderr).lower()
    if "disabled" in out or "new state: disabled" in out:
        return True, "Desactivado"

    result = subprocess.run(
        [adb, "-s", serial, "shell", "pm", "uninstall", "-k", "--user", "0", pkg],
        capture_output=True, encoding="utf-8", errors="replace", timeout=30,
    )
    out = (result.stdout + result.stderr).lower()
    if "success" in out:
        return True, "Removido para el usuario (reversible)"

    return False, (result.stderr or result.stdout)[:120].strip()


# ─── CLI ──────────────────────────────────────────────────────────────────────

def _main() -> None:
    import sys
    from collections import defaultdict

    if len(sys.argv) < 3 or sys.argv[1] != "--scan":
        print("Uso: python -m forge.core.app_scanner --scan <SERIAL>")
        sys.exit(1)

    serial = sys.argv[2]

    # ── Paso 1: Escanear ────────────────────────────────────────────────────
    print(f"\nEscaneando {serial} — puede tardar 30-60 s...")
    apps = scan_packages(serial)

    if not apps:
        print("ERROR: sin respuesta del dispositivo. Verificá la conexión ADB.")
        sys.exit(1)

    # ── Paso 2: Mostrar lista completa por categoría ─────────────────────────
    groups: dict[str, list[AppInfo]] = defaultdict(list)
    for app in apps:
        groups[app.category].append(app)

    print()
    for cat in CATEGORY_ORDER:
        cat_apps = groups.get(cat, [])
        if not cat_apps:
            continue
        print(f"{'-'*68}")
        print(f"  {cat.upper()} ({len(cat_apps)})")
        print(f"{'-'*68}")
        for a in sorted(cat_apps, key=lambda x: x.name.lower()):
            tag = "[PROT] " if a.is_protected else ("[DES]  " if a.is_disabled else "       ")
            print(f"  {tag}{a.name:<34}  {a.package}")

    total     = len(apps)
    disabled  = sum(1 for a in apps if a.is_disabled)
    protected = sum(1 for a in apps if a.is_protected)
    unknown_list = [a for a in apps if a.source == "unknown"]

    print(f"\n{'='*68}")
    print(f"  Total: {total} | Desactivadas: {disabled} | Protegidas: {protected} | Desconocidas: {len(unknown_list)}")
    print(f"{'='*68}")

    # ── Paso 3: Listar desconocidas ──────────────────────────────────────────
    if unknown_list:
        print(f"\n  APPS DESCONOCIDAS ({len(unknown_list)}):")
        for a in unknown_list:
            print(f"    {a.package}")

    if not unknown_list:
        print("\nNinguna app desconocida. Nada que auditar.")
        sys.exit(0)

    # ── Paso 4: Consulta Haiku ───────────────────────────────────────────────
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if api_key:
        print(f"\n  Consultar Haiku para describir {len(unknown_list)} apps desconocidas? [S/n]: ", end="", flush=True)
        try:
            resp = input().strip().lower()
        except (KeyboardInterrupt, EOFError):
            resp = "n"
        if resp in ("s", ""):
            pkgs = [a.package for a in unknown_list]
            total_batches = (len(pkgs) + 19) // 20
            descriptions: dict[str, str] = {}
            for i in range(0, len(pkgs), 20):
                batch_num = i // 20 + 1
                batch = pkgs[i : i + 20]
                print(f"  Batch {batch_num}/{total_batches} ({len(batch)} apps)...", flush=True)
                result = classify_batch_with_haiku(batch, api_key)
                descriptions.update(result)
            for a in unknown_list:
                if a.package in descriptions:
                    a.haiku_description = descriptions[a.package]
            print(f"  {len(descriptions)} descripciones recibidas.")
    else:
        print("\n  (ANTHROPIC_API_KEY no configurada — sin descripciones IA)")

    # ── Paso 5: Audit interactivo ────────────────────────────────────────────
    to_remove: list[AppInfo] = []
    print(f"\n{'='*68}")
    print("  AUDIT INTERACTIVO — apps desconocidas")
    print("  s = Quitar | Enter/n = Conservar | q = Terminar")
    print(f"{'='*68}\n")

    for idx, app in enumerate(unknown_list, 1):
        desc = app.haiku_description or "(sin descripcion)"
        print(f"  [{idx}/{len(unknown_list)}] {app.package}")
        print(f"      {desc}")
        print("  Quitar? [s/N/q]: ", end="", flush=True)
        try:
            resp = input().strip().lower()
        except (KeyboardInterrupt, EOFError):
            print("\n  Interrumpido.")
            break
        if resp == "q":
            print("  Terminado.")
            break
        elif resp == "s":
            to_remove.append(app)
            print("  -> QUITAR\n")
        else:
            print("  -> Conservar\n")

    # ── Paso 6: Ejecutar limpieza ────────────────────────────────────────────
    if not to_remove:
        print("\nNinguna app marcada para eliminar.")
        sys.exit(0)

    print(f"\n{'='*68}")
    print(f"  Apps a eliminar ({len(to_remove)}):")
    for a in to_remove:
        print(f"    {a.package}")
    print("\n  Ejecutar? [S/n]: ", end="", flush=True)
    try:
        resp = input().strip().lower()
    except (KeyboardInterrupt, EOFError):
        print("\nCancelado.")
        sys.exit(0)

    if resp not in ("s", ""):
        print("Cancelado.")
        sys.exit(0)

    print("\nEjecutando...")
    ok = fail = 0
    for app in to_remove:
        success, msg = disable_package(serial, app.package)
        if success:
            print(f"  [OK]  {app.package}")
            ok += 1
        else:
            print(f"  [ERR] {app.package} — {msg}")
            fail += 1

    print(f"\n  Limpieza: {ok} OK | {fail} errores.")


if __name__ == "__main__":
    _main()
