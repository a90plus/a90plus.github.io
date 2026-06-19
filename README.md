# a90plus.github.io

Static website for World Cup statistics, served at **https://a90plus.github.io**.

No build step. No npm. Open any HTML file directly or serve with `python -m http.server`.

## Pages

| Page | URL | Description |
|------|-----|-------------|
| Home | `/` | Dashboard with latest tournament highlights |
| World Map | `/pages/world-map.html` | D3 choropleth, year-driven |
| Tournament | `/pages/tournament.html` | Bracket, standings, awards |
| Country | `/pages/country.html` | Squad, match log, events |
| Records | `/pages/records.html` | Per-cup leaderboards |
| Players | `/pages/players.html` | Searchable squad browser |
| Head-to-Head | `/pages/head-to-head.html` | Compare two nations |
| Continental | `/pages/continental.html` | Filter by confederation |
| Timeline | `/pages/timeline.html` | All editions 1930→present |
| About | `/pages/about.html` | Philosophy, sources, contributing |

## Data Loading

Data is fetched from `a90plus/a90plus-data` via jsDelivr CDN:

```
https://cdn.jsdelivr.net/gh/a90plus/a90plus-data@main/tournaments/{year}.json
```

A local `data/` folder is used as fallback when running offline.

## Tech Stack

- Plain HTML + CSS + vanilla JS
- D3.js v7 + TopoJSON (CDN)
- Google Fonts (CDN)
- No bundler, no framework, no runtime dependencies

## Local Dev

```bash
cd a90plus.github.io
python -m http.server 8080
# Open http://localhost:8080
```
