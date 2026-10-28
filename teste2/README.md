# Fuga da Cobra

Jogo de deslizar num labirinto: você é um sapo dentro do estômago de uma cobra.
Pegue moedas (10 pts) e moscas (50 pts), desvie dos espinhos e fuja pelo portal
antes que o ácido suba. Cada morte tira 20 pontos (o valor fica em `PENALIDADE_MORTE`, no `variaveis.js`).
São 10 fases e um ranking de jogadores.

Para jogar, abra o `index.html` no navegador.

## Arquivos

| Arquivo | O que tem |
|---|---|
| `index.html` | Estrutura da página (barra do topo, canvas, telas) |
| `css/style.css` | Aparência da página |
| `js/variaveis.js` | Variáveis globais do jogo |
| `js/sprites.js` | Desenhos de pixel art (sapo, espinhos, portal, mosca, moeda, parede) |
| `js/ana.js` | Gerador das fases (garante que dá para pegar tudo) |
| `js/luan.js` | Regras: passos do sapo, moedas, morte, ácido, vitória |
| `js/douglas.js` | Controles: teclado, toque e redimensionar |
| `js/heitor.js` | Ranking e telas (inicial, ranking, fase completa) |
| `js/main.js` | Desenho (sapo, mapa, ácido, efeitos) e loop principal |

Os scripts são carregados nessa ordem no `index.html`.
