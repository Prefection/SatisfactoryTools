# SatisfactoryTools (personal fork)

Personal fork of [greeny/SatisfactoryTools](https://github.com/greeny/SatisfactoryTools) —
tools for planning Satisfactory factories (production chains, factory graphs).

> **Please read**
> - This is a **personal project**, changed to suit my own requirements.
> - **Not accepting contributions.** Issues and pull requests are not monitored or accepted.
> - **No guarantees.** No support, no promised updates, no roadmap. It may change,
>   break, or stop at any time.
>
> Want the maintained, official version? Use the upstream project linked above.

## Stack

Rebuilt from the original AngularJS 1.7 + Webpack + Yarn + PHP stack to
**Bun + Vite + Vue 3** (TypeScript), hosted static on Cloudflare Pages. It is fully
client-side: the production solver (linear programming) and factory graph run in the
browser, with no backend and no external API. Game data lives in `data/`; the domain
logic under `src/` is shared framework-free code.

## Requirements

- [Bun](https://bun.sh) (runtime + package manager)

## Development

- `bun install` — install dependencies
- `bun run dev` — dev server with hot reload
- `bun run build` — production build to `dist/`
- `bun run preview` — serve the production build locally

## Updating game data

Get the latest `Docs.json` from your game installation, place it in the `data`
folder, then run `bun run parseDocs` to regenerate `data.json` (plus `diff.txt` and
`imageMapping.json`). _(The data-pipeline scripts still run via `ts-node`; they are
being ported to Bun.)_

## Updating icons

Extract the game images with `umodel` (UE Viewer):

```shell
.\umodel.exe -path="...\SatisfactoryExperimental\FactoryGame\Content\Paks" -out=".\out256" -png -export *_256.uasset -game=ue4.22
.\umodel.exe -path="...\SatisfactoryExperimental\FactoryGame\Content\Paks" -out=".\out256" -png -export *_256_New.uasset -game=ue4.22
```

Copy the resulting `out256` folder to `data/icons`, then run `bun run generateImages`
(run `bun run parseDocs` first if you haven't).

## License

MIT — see [LICENSE](LICENSE). Original work by greeny.
