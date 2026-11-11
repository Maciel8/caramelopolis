# Caramelópolis — mapa vivo da cidade

Desde 11/11/2026 o mapa é a "cidade nova" (obra): `obra_layout.py` → `obra_layout.json` → `obra.js` (index.html). Peças em `sprites/obra2/` (recortes da referência `raca-do-dia/caramelopolis-pixel/ref/obra-ref.png` + mansão e árvore). O mapa antigo ficou em `app.js`.

Site estático (GitHub Pages) com o mapa de Caramelópolis: cada morador tem casa com nome na porta e um cachorro passeando com o nome em cima. Mesmo mundo e mesmos sprites dos episódios (`raca-do-dia/caramelopolis-0N/`).

## Atualizar a cada episódio
1. Ler os comentários do episódio (skill `ig-comentarios`) e adicionar os moradores novos na lista `M` de `build_moradores.py` (nome como no comentário, raça, trabalho, episódio). Atualizar `URNA`, `EPS` e `episodio_atual`.
2. Sprites novos de raça: gerar em `caramelopolis-pixel/raw2` (prompt Stardew), recortar com `prep_sprites.py` e copiar pra `sprites/`. Raça sem sprite usa `dog_caramelo2` automaticamente.
3. `python3 build_moradores.py` → `moradores.json`.
4. `git commit -am "ep. N" && git push` (Pages publica em ~1 min).

## Teste local
`python3 -m http.server 8787` e abrir http://localhost:8787/. Link direto pra um morador: `/#handle` (ex.: `/#racadodia`).
