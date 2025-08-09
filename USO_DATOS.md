# Guía rápida: Uso de los datos de FPL-Elo-Insights

Este dataset conecta datos oficiales de FPL con métricas avanzadas (Elo) y defensivas (CBIT).
Úsalo así:

## 1) Descarga de datos
- Carpeta: `data/2025-2026/`
- Por Gameweek: `By Gameweek/GW{x}/`
- Por Torneo: `By Tournament/{tournament_name}/`

## 2) Importación
- Abre los CSV en Excel / Python (pandas) / R.
- Identifica tablas: `players`, `teams`, `playerstats`, `matches`, `fixtures`, `playermatchstats`.

## 3) Relación de tablas (ejemplos)
- `players.player_id` ↔ `playerstats.id` y `playermatchstats.player_id`
- `teams.id` ↔ `matches.home_team` / `away_team`
- `matches.match_id` ↔ `playermatchstats.match_id`

## 4) Primeros análisis (ideas)
- Ranking por `points_per_game` o `form`.
- Detección de rivales favorables con `elo` y `fixture_difficulty`.
- Comparar xG/xA vs puntos reales para hallar diferenciales.

> Consejo: Documenta en tu PR qué columnas usaste y por qué. Te ayudará a mantener trazabilidad.
