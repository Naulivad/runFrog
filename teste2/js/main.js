// =====================================================================
// main.js
// Tudo que é DESENHADO (pixel art, sapo, mapa, ácido, efeitos) e o
// loop principal do jogo, que roda ~60 vezes por segundo.
// =====================================================================

// ---------- PIXEL ART ----------
// Os desenhos (sapo, espinhos, portal, mosca, moeda e parede) ficam no arquivo
// sprites.js. Aqui só ficam as funções que desenham eles na tela.

// Desenha um retângulo "arredondado para pixels inteiros",
// para a pixel art ficar nítida (sem bordas borradas).
function retanguloPixel(x, y, largura, altura, cor) {
    const x0 = Math.round(x);
    const y0 = Math.round(y);

    ctx.fillStyle = cor;
    ctx.fillRect(
        x0,
        y0,
        Math.max(1, Math.round(x + largura) - x0),
        Math.max(1, Math.round(y + altura) - y0)
    );
}

// Desenha uma imagem de pixel art (de sprites.js) no canvas.
//   nome     - nome do desenho, ex.: "moeda0"
//   cx, cy   - ponto onde fica o CENTRO do desenho
//   pw, ph   - largura e altura de cada "pixel" do desenho, em pixels da tela
//   espelhar - true para virar o desenho da esquerda para a direita
function desenharImagem(nome, cx, cy, pw, ph, espelhar) {
    const img = SPRITES_PRONTOS[nome];
    const X = cx - img.largura * pw / 2;
    const Y = cy - img.altura * ph / 2;

    for (const [x, y, largura, cor] of img.retangulos) {
        const xFinal = espelhar ? img.largura - x - largura : x;

        retanguloPixel(X + xFinal * pw, Y + y * ph, largura * pw, ph, cor);
    }
}

// ---------- O SAPO ----------
// O rosto do sapo escolhe qual desenho usar (andando, bateu, passou de fase, morreu).
const DESENHO_DO_ROSTO = {
    idle: "sapo_idle", slide: "sapo_idle", happy: "sapo_idle",
    hit: "sapo_hit", win: "sapo_win", dead: "sapo_dead"
};

const ROSA = "#ff6b9a"; // cor da língua

// cx, cy = centro do sapo; tamanho = largura do corpo; expressao = nome do rosto.
// O desenho do sapo tem 15 "pixels" de largura (o resto do quadro é espaço
// para as estrelinhas e brilhos), por isso u = tamanho / 15.
function desenharSapo(cx, cy, tamanho, expressao) {
    const u = tamanho / 15; // tamanho de cada pixel do desenho

    // Animações por cima do desenho
    const balanco = expressao === "hit" ? Math.round(Math.sin(tempo * 60) * u * 0.6) : 0;           // treme ao bater
    const pulo = expressao === "win" ? -Math.round(Math.abs(Math.sin(tempo * 7)) * u * 2.5) : 0;    // pula ao vencer

    // Sombra no chão
    retanguloPixel(cx - 5 * u, cy + 6.7 * u, 10 * u, u, "rgba(0,0,0,.35)");

    // (o -u e o -2u acertam o corpo do sapo no centro, já que o quadro tem espaço extra em cima e nos lados)
    desenharImagem(DESENHO_DO_ROSTO[expressao] || "sapo_idle", cx - u + balanco, cy - 2 * u + pulo, u, u);

    // Feliz: joga a língua para pegar o item, na direção em que o sapo ia
    if (expressao === "happy") {
        const [dx, dy] = ultimaDirecao || [0, 1];
        const lingua = (x, y, largura, altura) =>
            retanguloPixel(cx + x * u, cy + y * u, largura * u, altura * u, ROSA);

        if (dx > 0) lingua(0, 1.5, 9, 1);            // direita
        else if (dx < 0) lingua(-9, 1.5, 9, 1);      // esquerda
        else if (dy < 0) lingua(-0.5, -7.5, 1, 9);   // cima
        else lingua(-0.5, 1.5, 1, 9);                // baixo
    }
}

// ---------- DESENHO DA CENA ----------
// A cada quadro, desenhar() pinta tudo de novo, de trás para frente:
// fundo, mapa, bolhas, portal, rastro, ácido, sapo, efeitos, avisos.

function desenhar() {
    const c = tamCelula;
    const lado = canvas.width;
    const p = c / 8; // tamanho de "um pixel" da pixel art

    ctx.imageSmoothingEnabled = false; // mantém os pixels nítidos

    // Fundo
    ctx.fillStyle = "#3a0a10";
    ctx.fillRect(0, 0, lado, lado);

    ctx.save();

    // Tremor de tela: move tudo um pouquinho para um lado aleatório
    if (tremor > 0) {
        ctx.translate(
            Math.round((Math.random() - 0.5) * tremor),
            Math.round((Math.random() - 0.5) * tremor)
        );
    }

    const pronto = !moedas.size && !moscas.size; // pegou tudo? o portal fica dourado

    desenharMapa(c, p);
    desenharBolhasFundo(lado, p);
    desenharPortal(c, p, pronto);
    desenharRastro(c);
    desenharAcido(c, lado, p);
    desenharJogador(c, p);
    desenharEfeitos(c, p);
    desenharAvisos(lado);

    ctx.restore();

    desenharEfeitoCRT(lado);
}

// Chão, paredes, espinhos, moedas e moscas, célula por célula.
function desenharMapa(c, p) {
    for (let y = 0; y < tamanho; y++) {
        for (let x = 0; x < tamanho; x++) {

            const celula = indice(x, y);
            const X = x * c;
            const Y = y * c;

            // Animação de entrada: as células aparecem em diagonal no começo da fase
            const aparecer = Math.min(1, Math.max(0, (tempo - tempoInicioFase) * 3 - (x + y) * 0.08));
            if (aparecer <= 0) continue;

            ctx.globalAlpha = aparecer;

            // Chão em xadrez
            ctx.fillStyle = (x + y) % 2 ? "#451018" : "#3b0b12";
            ctx.fillRect(X, Y, c, c);

            // Bolhinhas subindo em algumas células
            if ((x * 7 + y * 3) % 3 === 0) {
                const sobe = (tempo * 0.5 + x * 0.37 + y * 0.61) % 1;

                ctx.fillStyle = "rgba(255,150,150,.35)";
                ctx.fillRect(
                    Math.round(X + c * 0.2 + ((x * 13 + y * 5) % 5) * c * 0.12),
                    Math.round(Y + c * (1 - sobe)),
                    Math.ceil(p),
                    Math.ceil(p)
                );
            }

            if (paredes.has(celula)) {
                // a parede "respira" subindo e descendo um pouquinho
                const respiro = Math.round(Math.sin(tempo * 1.6 + x * 0.7 + y * 0.7) * p * 0.6);
                desenharImagem("parede", X + c / 2, Y + c / 2 + respiro, c / 11, c / 10, (x + y * 3) % 2);
            }

            if (ossos.has(celula)) {
                desenharEspinhos(x, y, X, Y, c, p);
            }

            if (moedas.has(celula)) desenharMoeda(x, y, X, Y, c, p);
            if (moscas.has(celula)) desenharMosca(x, y, X, Y, c, p);

            ctx.globalAlpha = 1;
        }
    }
}

// A moeda gira: de frente, meio de lado (mais estreita) e de lado.
function desenharMoeda(x, y, X, Y, c, p) {
    const giro = Math.abs(Math.cos(tempo * 3 + x + y)); // 1 = de frente, 0 = de lado
    const sobeDesce = Math.round(Math.sin(tempo * 3 + x) * p * 0.5);
    const u = c * 0.65 / 8;                              // tamanho de cada pixel do desenho

    const nome = giro < 0.25 ? "moeda1" : "moeda0";      // de lado ou de frente
    const esticar = giro >= 0.25 && giro < 0.6 ? 0.6 : 1; // virando: mais estreita

    desenharImagem(nome, X + c / 2, Y + c / 2 + sobeDesce, u * esticar, u);
}

// A mosca treme no lugar e bate as asas (troca de quadro 14 vezes por segundo).
function desenharMosca(x, y, X, Y, c, p) {
    const tremeX = Math.round(Math.sin(tempo * 9 + x * 3) * p * 0.7);
    const tremeY = Math.round(Math.cos(tempo * 11 + y * 2) * p * 0.7);
    const nome = Math.floor(tempo * 14 + x) % 2 ? "mosca1" : "mosca0"; // asas abertas / fechadas
    const u = c * 0.85 / 15;

    desenharImagem(nome, X + c / 2 + tremeX, Y + c / 2 + tremeY, u, u);
}

// Os espinhos de metal: ficam no chão da célula e brilham de vez em quando.
const PONTAS_ESPINHOS = [5, 14, 23]; // coluna da ponta de cada espinho, dentro do desenho (29 de largura)

function desenharEspinhos(x, y, X, Y, c, p) {
    const pw = c * 0.98 / 29; // largura de cada pixel do desenho
    const ph = pw * 1.3;      // um pouco mais alto, para os espinhos ficarem pontudos
    const cx = X + c / 2;
    const cy = Y + c - 7 * ph - p * 0.3; // o desenho tem 14 de altura; a base encosta no chão

    desenharImagem("espinhos", cx, cy, pw, ph);

    // Brilhinho que passa pela ponta de cada espinho
    const x0 = cx - 14.5 * pw;
    const y0 = cy - 7 * ph;

    PONTAS_ESPINHOS.forEach((coluna, n) => {
        const luz = Math.pow(Math.max(0, Math.sin(tempo * 2.5 + x * 0.8 + y + n * 2.1)), 10);

        if (luz > 0.05) {
            retanguloPixel(x0 + coluna * pw, y0 + 2 * ph, pw, ph * 2, "rgba(255,255,255," + luz.toFixed(2) + ")");
        }
    });
}

// Quadradinhos de bolha que sobem pelo fundo inteiro.
function desenharBolhasFundo(lado, p) {
    ctx.strokeStyle = "rgba(157,255,106,.3)";
    ctx.lineWidth = 1;

    for (const b of bolhasFundo) {
        const y = ((b.y - tempo * 0.03 * b.velocidade) % 1 + 1) % 1 * lado;
        const x = b.x * lado + Math.sin(tempo * b.velocidade + b.fase) * 10;

        ctx.strokeRect(Math.round(x), Math.round(y), Math.ceil(p * 1.5), Math.ceil(p * 1.5));
    }
}

// O portal (desenho do sprites.js): pulsa e tem um brilho por trás.
// Fica dourado quando o sapo já pegou tudo.
function desenharPortal(c, p, pronto) {
    const cx = saida.x * c + c / 2;
    const cy = saida.y * c + c / 2;
    const rgb = pronto ? "255, 210, 63" : "120, 255, 90";
    const pulso = 1 + 0.04 * Math.sin(tempo * 3);
    const u = c * 1.05 / 66 * pulso; // o desenho do portal tem 66 de altura

    // Brilho por trás
    const brilho = ctx.createRadialGradient(cx, cy, c * 0.1, cx, cy, c * 0.75);
    brilho.addColorStop(0, "rgba(" + rgb + ", " + (0.35 + 0.15 * Math.sin(tempo * 3)).toFixed(2) + ")");
    brilho.addColorStop(1, "rgba(" + rgb + ", 0)");
    ctx.fillStyle = brilho;
    ctx.fillRect(cx - c, cy - c, c * 2, c * 2);

    desenharImagem(pronto ? "portal_ouro" : "portal", cx, cy, u, u);
}

// Quadradinhos verdes que ficam para trás e vão sumindo.
function desenharRastro(c) {
    for (const marca of rastro) {
        const lado = Math.ceil(c * 0.28 * marca.vida);

        ctx.fillStyle = "rgba(157,255,106," + Math.max(0, marca.vida) * 0.5 + ")";
        ctx.fillRect(
            Math.round((marca.x + 0.5) * c - lado / 2),
            Math.round((marca.y + 0.5) * c - lado / 2),
            lado,
            lado
        );
    }
}

// O ácido sobe de baixo para cima, com a superfície ondulando.
function desenharAcido(c, lado, p) {
    if (nivelDoAcido() <= 0) return; // ainda não apareceu

    const topo = Math.round(superficieDoAcido() * c);
    const z = Math.ceil(p);

    // Coluna por coluna: corpo do ácido + linha clara na superfície
    for (let X = 0; X < lado; X += z) {
        const onda = Math.round(
            Math.sin(tempo * 5 + X / c * 3) * p * 0.8 +
            Math.sin(tempo * 9 + X / c * 7) * p * 0.4
        );
        const yy = topo + onda;

        ctx.fillStyle = "rgba(110,230,40,.86)";
        ctx.fillRect(X, yy, z, lado - yy);

        ctx.fillStyle = "#d6ffb0";
        ctx.fillRect(X, yy, z, z);
    }

    // Listras escuras dentro do ácido
    ctx.fillStyle = "rgba(30,120,20,.35)";
    for (let yy = topo + c * 0.6; yy < lado; yy += c * 0.5) {
        ctx.fillRect(0, Math.round(yy), lado, z);
    }

    // Bolhas subindo dentro do ácido
    ctx.strokeStyle = "rgba(214,255,176,.7)";
    ctx.lineWidth = 1;

    for (let i = 0; i < 14; i++) {
        const x = ((i * 97) % 100) / 100 * lado;
        const y = lado - ((tempo * 0.25 * (1 + i % 3) + i * 0.19) % 1) * (lado - topo);

        ctx.strokeRect(Math.round(x), Math.round(y), Math.ceil(p * 1.6), Math.ceil(p * 1.6));
    }
}

// Desenha o sapo com esticar/amassar, respiração e morte.
function desenharJogador(c, p) {
    const cx = sapo.px * c + c / 2;
    const cy = sapo.py * c + c / 2;

    ctx.save();

    // Morrendo: some aos poucos
    if (estado === "morto") {
        ctx.globalAlpha = Math.max(0, 1 - Math.max(0, tempoMorto - 0.6) * 2.5);
    }

    // Escala horizontal (sx) e vertical (sy) do sapo
    let sx = 1;
    let sy = 1;

    if (direcaoSlide) {
        // deslizando: estica na direção do movimento
        sx = direcaoSlide[0] ? 1.25 : 0.85;
        sy = direcaoSlide[1] ? 1.25 : 0.85;

    } else if (estado === "morto") {
        // morto: achata no chão
        sx = 1 + Math.min(tempoMorto * 2, 0.5);
        sy = Math.max(0.4, 1 - tempoMorto * 1.4);

    } else if (amassado > 0) {
        // bateu na parede: amassa
        const horizontal = ultimaDirecao && ultimaDirecao[0];
        sx = horizontal ? 1 - amassado * 0.3 : 1 + amassado * 0.3;
        sy = horizontal ? 1 + amassado * 0.3 : 1 - amassado * 0.3;
    }

    // Altura: afunda um pouco ao morrer, "respira" quando está parado
    let cyFinal = cy;
    if (estado === "morto") {
        cyFinal += c * 0.2 * Math.min(1, tempoMorto * 2);
    }
    if (estado === "jogando" && !direcaoSlide) {
        cyFinal += Math.round(Math.sin(tempo * 3) * p * 0.4);
    }

    // Aplica a escala em torno do centro do sapo
    ctx.translate(cx, cyFinal);
    ctx.scale(sx, sy);
    ctx.translate(-cx, -cyFinal);

    // Expressão: a temporária (feliz, batido...) ou a normal (deslizando/parado)
    const expressao = tempoRosto > 0 ? rosto : (direcaoSlide ? "slide" : "idle");
    desenharSapo(cx, cyFinal, c * 0.9, expressao);

    ctx.restore();
}

// Ondas, partículas e textos flutuantes.
function desenharEfeitos(c, p) {

    // Ondas (quadrados que crescem)
    for (const onda of ondas) {
        ctx.globalAlpha = Math.max(0, onda.vida);
        ctx.strokeStyle = onda.cor;
        ctx.lineWidth = Math.ceil(p * 0.8);

        ctx.strokeRect(
            Math.round((onda.x + 0.5 - onda.raio) * c),
            Math.round((onda.y + 0.5 - onda.raio) * c),
            Math.round(onda.raio * 2 * c),
            Math.round(onda.raio * 2 * c)
        );
    }

    // Partículas (quadradinhos)
    for (const particula of particulas) {
        ctx.globalAlpha = Math.max(0, particula.vida);
        ctx.fillStyle = particula.cor;

        ctx.fillRect(
            Math.round(particula.x * c),
            Math.round(particula.y * c),
            Math.ceil(c * 0.09),
            Math.ceil(c * 0.09)
        );
    }

    // Textos flutuantes (com uma sombra preta atrás)
    ctx.font = Math.floor(c * 0.26) + "px 'Press Start 2P',monospace";
    ctx.textAlign = "center";

    for (const texto of textosFlutuantes) {
        ctx.globalAlpha = Math.min(1, texto.vida * 2);

        ctx.fillStyle = "#000";
        ctx.fillText(texto.texto, (texto.x + 0.5) * c + 2, texto.y * c + 2);

        ctx.fillStyle = texto.cor;
        ctx.fillText(texto.texto, (texto.x + 0.5) * c, texto.y * c);
    }

    ctx.globalAlpha = 1;
}

// Telas vermelhas: aviso de ácido perto e flash ao morrer.
function desenharAvisos(lado) {

    // Ácido a menos de 3,2 linhas do sapo: a tela pisca em vermelho
    const acidoPerto =
        estado === "jogando" &&
        acidoAtivo &&
        superficieDoAcido() - sapo.y < 3.2;

    if (acidoPerto) {
        const brilho = 0.07 + 0.07 * Math.sin(tempo * 14);
        ctx.fillStyle = "rgba(255,40,40," + brilho + ")";
        ctx.fillRect(0, 0, lado, lado);
    }

    if (estado === "morto") {
        ctx.fillStyle = "rgba(214,40,40," + Math.min(0.4, tempoMorto) + ")";
        ctx.fillRect(0, 0, lado, lado);
    }
}

// Linhas escuras horizontais, como uma TV antiga (CRT).
function desenharEfeitoCRT(lado) {
    ctx.fillStyle = "rgba(0,0,0,.12)";

    for (let y = 0; y < lado; y += 4) {
        ctx.fillRect(0, y, lado, 1);
    }
}

// ---------- ATUALIZAR EFEITOS ----------
// Move e envelhece os efeitos. "dt" = segundos desde o último quadro.
// Cada lista é refeita só com os itens que ainda estão "vivos" (vida > 0).
function atualizarEfeitos(dt) {

    particulas = particulas.filter(q => {
        q.x += q.vx * dt;
        q.y += q.vy * dt;
        q.vx *= 0.96;                              // vai perdendo velocidade
        q.vy = q.vy * 0.96 + q.gravidade * dt;     // gravidade puxa para baixo
        q.vida -= dt;
        return q.vida > 0;
    });

    textosFlutuantes = textosFlutuantes.filter(t => {
        t.y -= dt * 1.2;                           // sobe
        t.vida -= dt;
        return t.vida > 0;
    });

    ondas = ondas.filter(o => {
        o.raio += dt * 3;                          // cresce
        o.vida -= dt * 2;
        return o.vida > 0;
    });

    rastro = rastro.filter(m => {
        m.vida -= dt * 3.5;
        return m.vida > 0;
    });

    tremor = Math.max(0, tremor - dt * 40);
    amassado = Math.max(0, amassado - dt * 5);

    // O rosto temporário volta ao normal, menos "dead" e "win" (ficam até recomeçar)
    if (tempoRosto > 0 && rosto !== "dead" && rosto !== "win") {
        tempoRosto -= dt;
    }
}

// ---------- LOOP PRINCIPAL ----------
let ultimoQuadro = performance.now();

function loopDoJogo(agora) {

    // dt = tempo desde o último quadro (no máximo 0,05 s, para não "pular" se a aba travar)
    const dt = Math.min(0.05, (agora - ultimoQuadro) / 1000);
    ultimoQuadro = agora;
    tempo += dt;

    atualizarAcido(dt);
    moverSapo(dt);
    verificarMorte(dt);
    suavizarSapo(dt);

    atualizarEfeitos(dt);
    desenhar();
    atualizarHudAcido();

    requestAnimationFrame(loopDoJogo);
}

// O ácido sobe com o tempo e mata o sapo se alcançar a linha dele.
function atualizarAcido(dt) {
    if (estado === "jogando" && acidoAtivo) {
        tempoAcido += dt;

        if (superficieDoAcido() <= sapo.y + 0.5) matarPeloAcido();
    }
}

// Enquanto desliza, dá um passo (uma célula) a cada 0,03 segundo.
function moverSapo(dt) {
    if (estado === "jogando" && direcaoSlide) {
        acumulador += dt;

        while (acumulador >= 0.03 && direcaoSlide && estado === "jogando") {
            acumulador -= 0.03;
            darPasso();
        }
    }
}

// Depois de morrer, espera 1,2 s e recomeça a fase com os pontos de antes.
function verificarMorte(dt) {
    if (estado === "morto") {
        tempoMorto += dt;

        if (tempoMorto > 1.2) {
            pontos = salvo.pontos;
            moedasPegas = salvo.moedasPegas;
            moscasPegas = salvo.moscasPegas;
            carregarFase();
        }
    }
}

// A posição desenhada (px, py) corre atrás da posição real (x, y),
// por isso o sapo parece deslizar suavemente.
function suavizarSapo(dt) {
    const velocidade = Math.min(1, dt * 28);

    sapo.px += (sapo.x - sapo.px) * velocidade;
    sapo.py += (sapo.y - sapo.py) * velocidade;
}

// ---------- INICIALIZAÇÃO ----------
// Gera a fase 1 só para ter um fundo atrás da tela inicial.
gerarFase(1);
ajustarTamanho();

sapo = { x: inicio.x, y: inicio.y, px: inicio.x, py: inicio.y };

atualizarHud();
mostrarTelaInicial();

requestAnimationFrame(loopDoJogo);
