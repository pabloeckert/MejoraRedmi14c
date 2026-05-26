"""
Motor de Game Mode para Redmi Forge.

Estrategia de enable() — opción C (unificado con fallback):
  1. cmd game mode performance <pkg>   → juegos que declaran performance
  2. cmd game set --fps 0 --downscale disable <pkg>  → juegos que solo tienen custom
  3. cmd power set-fixed-performance-mode-enabled true  → todo lo demás (WhatsApp, etc.)

El estado de fixed_performance_mode no es legible desde ADB sin root,
por lo que se rastrea en _fixed_perf_active (en memoria de la sesión).
"""
from __future__ import annotations

import subprocess
from dataclasses import dataclass
from typing import Literal

Mechanism = Literal["game_api_performance", "game_api_custom", "fixed_performance"]

_fixed_perf_active: bool = False


@dataclass
class GameModeResult:
    success: bool
    mechanism: Mechanism | None = None
    warning: str | None = None
    error: str | None = None

    def __str__(self) -> str:
        if not self.success:
            return f"[FAIL] {self.error}"
        parts = [f"[OK] {self.mechanism}"]
        if self.warning:
            parts.append(f"  WARN: {self.warning}")
        return "\n".join(parts)


def _run(serial: str, *args: str, timeout: int = 20) -> tuple[int, str]:
    res = subprocess.run(
        ["adb", "-s", serial, "shell", *args],
        capture_output=True,
        text=True,
        timeout=timeout,
    )
    return res.returncode, (res.stdout + res.stderr).strip()


def enable(serial: str, package_name: str) -> GameModeResult:
    """Activa modo rendimiento máximo para la app. Tres mecanismos en cascada."""
    global _fixed_perf_active

    # 1. Game Mode performance (juegos que lo declaran explícitamente)
    rc, out = _run(serial, "cmd", "game", "mode", "performance", package_name)
    if rc == 0:
        return GameModeResult(success=True, mechanism="game_api_performance")

    # 2. Juego válido pero sin soporte de performance → custom sin restricciones
    if "not supported" in out:
        rc2, out2 = _run(
            serial,
            "cmd", "game", "set",
            "--fps", "0", "--downscale", "disable",
            package_name,
        )
        if rc2 == 0:
            return GameModeResult(
                success=True,
                mechanism="game_api_custom",
                warning="Juego no soporta performance mode - custom mode aplicado (FPS libre, sin downscale)",
            )
        return GameModeResult(success=False, error=f"game set falló: {out2}")

    # 3. No es juego → Fixed Performance Mode global
    if "not of game type" in out:
        rc3, out3 = _run(
            serial, "cmd", "power", "set-fixed-performance-mode-enabled", "true"
        )
        if rc3 == 0:
            _fixed_perf_active = True
            return GameModeResult(
                success=True,
                mechanism="fixed_performance",
                warning=(
                    f"{package_name} no es juego - Fixed Performance Mode global activado "
                    "(afecta todo el sistema mientras este activo)"
                ),
            )
        return GameModeResult(success=False, error=f"fixed performance mode falló: {out3}")

    return GameModeResult(success=False, error=out)


def disable(serial: str, package_name: str) -> GameModeResult:
    """Revierte el boost. Usa Game API para juegos, Fixed Performance para el resto."""
    global _fixed_perf_active

    rc, out = _run(serial, "cmd", "game", "mode", "standard", package_name)
    if rc == 0:
        return GameModeResult(success=True, mechanism="game_api_performance")

    if "not of game type" in out:
        rc2, out2 = _run(
            serial, "cmd", "power", "set-fixed-performance-mode-enabled", "false"
        )
        if rc2 == 0:
            _fixed_perf_active = False
            return GameModeResult(success=True, mechanism="fixed_performance")
        return GameModeResult(success=False, error=f"fixed performance off falló: {out2}")

    return GameModeResult(success=False, error=out)


def status(serial: str) -> dict:
    """
    Retorna el estado actual de Game Mode en el dispositivo.

    Salida:
      {
        "games": {pkg: {"current": str, "available": list[str]}},
        "fixed_performance": bool,   # solo fiable si enable/disable se llamaron en esta sesión
      }

    Escanea todos los paquetes en una sola sesión ADB (≈ 330 pkgs → ~30s primera vez).
    """
    script = (
        "pm list packages | sed 's/package://' | "
        "while read pkg; do "
        "  result=$(cmd game list-modes $pkg 2>/dev/null); "
        '  if ! echo "$result" | grep -q "not of game type"; then '
        '    echo "PKG:$pkg|$result"; '
        "  fi; "
        "done"
    )
    _, out = _run(serial, script, timeout=90)

    games: dict[str, dict] = {}
    for line in out.splitlines():
        if not line.startswith("PKG:"):
            continue
        _, rest = line.split("PKG:", 1)
        pkg, _, info = rest.partition("|")

        current = ""
        available: list[str] = []

        parts = info.split("current mode:")
        if len(parts) > 1:
            current = parts[1].split(",")[0].strip()

        avail_parts = info.split("available game modes: [")
        if len(avail_parts) > 1:
            available = [m.strip() for m in avail_parts[1].rstrip("]").split(",")]

        games[pkg.strip()] = {"current": current, "available": available}

    return {
        "games": games,
        "fixed_performance": _fixed_perf_active,
    }


if __name__ == "__main__":
    import sys
    import json

    def usage():
        print("Uso: python -m forge.core.game_mode <serial> <enable|disable|status> [package]")
        sys.exit(1)

    if len(sys.argv) < 3:
        usage()

    serial = sys.argv[1]
    cmd = sys.argv[2]

    if cmd in ("enable", "disable"):
        if len(sys.argv) < 4:
            usage()
        pkg = sys.argv[3]
        fn = enable if cmd == "enable" else disable
        result = fn(serial, pkg)
        print(result)
        sys.exit(0 if result.success else 1)

    if cmd == "status":
        print("Escaneando paquetes (puede tardar ~30s)...")
        st = status(serial)
        print(f"\nFixed Performance Mode: {'ACTIVO' if st['fixed_performance'] else 'inactivo'}")
        print(f"\nJuegos detectados ({len(st['games'])}):")
        for pkg, info in sorted(st["games"].items()):
            marker = " ← BOOSTED" if info["current"] not in ("standard", "") else ""
            print(f"  {pkg}  |  modo: {info['current']}  |  disponibles: {info['available']}{marker}")
        sys.exit(0)

    usage()
