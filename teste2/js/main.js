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

function desenharImagem(nome, cx, cy, pw, ph, espelhar) {
    const img = SPRITES_PRONTOS[nome];
    const X = cx - img.largura * pw / 2;
    const Y = cy - img.altura * ph / 2;

    for (const [x, y, largura, cor] of img.retangulos) {
        const xFinal = espelhar ? img.largura - x - largura : x;

        retanguloPixel(X + xFinal * pw, Y + y * ph, largura * pw, ph, cor);
    }
}

const DESENHO_DO_ROSTO = {
    idle: "sapo_idle",
    slide: "sapo_idle",
    happy: "sapo_idle",
    hit: "sapo_hit",
    win: "sapo_win",
    dead: "sapo_dead"
};

const ROSA = "#ff6b9a";

function desenharSapo(cx, cy, tamanho, expressao) {
    const u = tamanho / 15;

    const balanco = expressao === "hit" ? Math.round(Math.sin(tempo * 60) * u * 0.6) : 0;
    const pulo = expressao === "win" ? -Math.round(Math.abs(Math.sin(tempo * 7)) * u * 2.5) : 0;

    retanguloPixel(cx - 5 * u, cy + 6.7 * u, 10 * u, u, "rgba(0,0,0,.35)");

    desenharImagem(
        DESENHO_DO_ROSTO[expressao] || "sapo_idle",
        cx - u + balanco,
        cy - 2 * u + pulo,
        u,
        u
    );

    if (expressao === "happy") {
        const [dx, dy] = ultimaDirecao || [0, 1];

        const lingua = (x, y, largura, altura) =>
            retanguloPixel(cx + x * u, cy + y * u, largura * u, altura * u, ROSA);

        if (dx > 0) lingua(0, 1.5, 9, 1);
        else if (dx < 0) lingua(-9, 1.5, 9, 1);
        else if (dy < 0) lingua(-0.5, -7.5, 1, 9);
        else lingua(-0.5, 1.5, 1, 9);
    }
}

function desenhar() {
    const c = tamCelula;
    const lado = canvas.width;
    const p = c / 8;

    ctx.imageSmoothingEnabled = false;

    ctx.fillStyle = "#3a0a10";
    ctx.fillRect(0, 0, lado, lado);

    ctx.save();

    if (tremor > 0) {
        ctx.translate(
            Math.round((Math.random() - 0.5) * tremor),
            Math.round((Math.random() - 0.5) * tremor)
        );
    }

    const pronto = !moedas.size && !moscas.size;

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

function desenharMapa(c, p) {
    for (let y = 0; y < tamanho; y++) {
        for (let x = 0; x < tamanho; x++) {
            const celula = indice(x, y);
            const X = x * c;
            const Y = y * c;

            const aparecer = Math.min(
                1,
                Math.max(0, (tempo - tempoInicioFase) * 3 - (x + y) * 0.08)
            );

            if (aparecer <= 0) continue;

            ctx.globalAlpha = aparecer;

            ctx.fillStyle = (x + y) % 2 ? "#451018" : "#3b0b12";
            ctx.fillRect(X, Y, c, c);

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
                const respiro = Math.round(
                    Math.sin(tempo * 1.6 + x * 0.7 + y * 0.7) * p * 0.6
                );

                desenharImagem(
                    "parede",
                    X + c / 2,
                    Y + c / 2 + respiro,
                    c / 11,
                    c / 10,
                    (x + y * 3) % 2
                );
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

function desenharMoeda(x, y, X, Y, c, p) {
    const giro = Math.abs(Math.cos(tempo * 3 + x + y));
    const sobeDesce = Math.round(Math.sin(tempo * 3 + x) * p * 0.5);
    const u = c * 0.65 / 8;

    const nome = giro < 0.25 ? "moeda1" : "moeda0";
    const esticar = giro >= 0.25 && giro < 0.6 ? 0.6 : 1;

    desenharImagem(
        nome,
        X + c / 2,
        Y + c / 2 + sobeDesce,
        u * esticar,
        u
    );
}

function desenharMosca(x, y, X, Y, c, p) {
    const tremeX = Math.round(Math.sin(tempo * 9 + x * 3) * p * 0.7);
    const tremeY = Math.round(Math.cos(tempo * 11 + y * 2) * p * 0.7);
    const nome = Math.floor(tempo * 14 + x) % 2 ? "mosca1" : "mosca0";
    const u = c * 0.85 / 15;

    desenharImagem(
        nome,
        X + c / 2 + tremeX,
        Y + c / 2 + tremeY,
        u,
        u
    );
}

const PONTAS_ESPINHOS = [5, 14, 23];

function desenharEspinhos(x, y, X, Y, c, p) {
    const pw = c * 0.98 / 29;
    const ph = pw * 1.3;
    const cx = X + c / 2;
    const cy = Y + c - 7 * ph - p * 0.3;

    desenharImagem("espinhos", cx, cy, pw, ph);

    const x0 = cx - 14.5 * pw;
    const y0 = cy - 7 * ph;

    PONTAS_ESPINHOS.forEach((coluna, n) => {
        const luz = Math.pow(
            Math.max(0, Math.sin(tempo * 2.5 + x * 0.8 + y + n * 2.1)),
            10
        );

        if (luz > 0.05) {
            retanguloPixel(
                x0 + coluna * pw,
                y0 + 2 * ph,
                pw,
                ph * 2,
                "rgba(255,255,255," + luz.toFixed(2) + ")"
            );
        }
    });
}

function desenharBolhasFundo(lado, p) {
    ctx.strokeStyle = "rgba(157,255,106,.3)";
    ctx.lineWidth = 1;

    for (const b of bolhasFundo) {
        const y = ((b.y - tempo * 0.03 * b.velocidade) % 1 + 1) % 1 * lado;
        const x = b.x * lado + Math.sin(tempo * b.velocidade + b.fase) * 10;

        ctx.strokeRect(
            Math.round(x),
            Math.round(y),
            Math.ceil(p * 1.5),
            Math.ceil(p * 1.5)
        );
    }
}

function desenharPortal(c, p, pronto) {
    const cx = saida.x * c + c / 2;
    const cy = saida.y * c + c / 2;
    const rgb = pronto ? "255, 210, 63" : "120, 255, 90";
    const pulso = 1 + 0.04 * Math.sin(tempo * 3);
    const u = c * 1.05 / 66 * pulso;

    const brilho = ctx.createRadialGradient(
        cx,
        cy,
        c * 0.1,
        cx,
        cy,
        c * 0.75
    );

    brilho.addColorStop(
        0,
        "rgba(" + rgb + ", " +
        (0.35 + 0.15 * Math.sin(tempo * 3)).toFixed(2) +
        ")"
    );

    brilho.addColorStop(1, "rgba(" + rgb + ", 0)");

    ctx.fillStyle = brilho;
    ctx.fillRect(cx - c, cy - c, c * 2, c * 2);

    desenharImagem(
        pronto ? "portal_ouro" : "portal",
        cx,
        cy,
        u,
        u
    );
}

function desenharRastro(c) {
    for (const marca of rastro) {
        const lado = Math.ceil(c * 0.28 * marca.vida);

        ctx.fillStyle =
            "rgba(157,255,106," +
            Math.max(0, marca.vida) * 0.5 +
            ")";

        ctx.fillRect(
            Math.round((marca.x + 0.5) * c - lado / 2),
            Math.round((marca.y + 0.5) * c - lado / 2),
            lado,
            lado
        );
    }
}

function desenharAcido(c, lado, p) {
    if (nivelDoAcido() <= 0) return;

    const topo = Math.round(superficieDoAcido() * c);
    const z = Math.ceil(p);

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

    ctx.fillStyle = "rgba(30,120,20,.35)";

    for (let yy = topo + c * 0.6; yy < lado; yy += c * 0.5) {
        ctx.fillRect(0, Math.round(yy), lado, z);
    }

    ctx.strokeStyle = "rgba(214,255,176,.7)";
    ctx.lineWidth = 1;

    for (let i = 0; i < 14; i++) {
        const x = ((i * 97) % 100) / 100 * lado;
        const y =
            lado -
            ((tempo * 0.25 * (1 + i % 3) + i * 0.19) % 1) *
            (lado - topo);

        ctx.strokeRect(
            Math.round(x),
            Math.round(y),
            Math.ceil(p * 1.6),
            Math.ceil(p * 1.6)
        );
    }
}

function desenharJogador(c, p) {
    const cx = sapo.px * c + c / 2;
    const cy = sapo.py * c + c / 2;

    ctx.save();

    if (estado === "morto") {
        ctx.globalAlpha =
            Math.max(0, 1 - Math.max(0, tempoMorto - 0.6) * 2.5);
    }

    let sx = 1;
    let sy = 1;

    if (direcaoSlide) {
        sx = direcaoSlide[0] ? 1.25 : 0.85;
        sy = direcaoSlide[1] ? 1.25 : 0.85;
    } else if (estado === "morto") {
        sx = 1 + Math.min(tempoMorto * 2, 0.5);
        sy = Math.max(0.4, 1 - tempoMorto * 1.4);
    } else if (amassado > 0) {
        const horizontal = ultimaDirecao && ultimaDirecao[0];

        sx = horizontal ? 1 - amassado * 0.3 : 1 + amassado * 0.3;
        sy = horizontal ? 1 + amassado * 0.3 : 1 - amassado * 0.3;
    }

    let cyFinal = cy;

    if (estado === "morto") {
        cyFinal += c * 0.2 * Math.min(1, tempoMorto * 2);
    }

    if (estado === "jogando" && !direcaoSlide) {
        cyFinal += Math.round(Math.sin(tempo * 3) * p * 0.4);
    }

    ctx.translate(cx, cyFinal);
    ctx.scale(sx, sy);
    ctx.translate(-cx, -cyFinal);

    const expressao =
        tempoRosto > 0
            ? rosto
            : (direcaoSlide ? "slide" : "idle");

    desenharSapo(cx, cyFinal, c * 0.9, expressao);

    ctx.restore();
}

function desenharEfeitos(c, p) {
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

    ctx.font = Math.floor(c * 0.26) + "px 'Press Start 2P',monospace";
    ctx.textAlign = "center";

    for (const texto of textosFlutuantes) {
        ctx.globalAlpha = Math.min(1, texto.vida * 2);

        ctx.fillStyle = "#000";
        ctx.fillText(
            texto.texto,
            (texto.x + 0.5) * c + 2,
            texto.y * c + 2
        );

        ctx.fillStyle = texto.cor;
        ctx.fillText(
            texto.texto,
            (texto.x + 0.5) * c,
            texto.y * c
        );
    }

    ctx.globalAlpha = 1;
}

function desenharAvisos(lado) {
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
        ctx.fillStyle =
            "rgba(214,40,40," +
            Math.min(0.4, tempoMorto) +
            ")";

        ctx.fillRect(0, 0, lado, lado);
    }
}

function desenharEfeitoCRT(lado) {
    ctx.fillStyle = "rgba(0,0,0,.12)";

    for (let y = 0; y < lado; y += 4) {
        ctx.fillRect(0, y, lado, 1);
    }
}

function atualizarEfeitos(dt) {
    particulas = particulas.filter(q => {
        q.x += q.vx * dt;
        q.y += q.vy * dt;
        q.vx *= 0.96;
        q.vy = q.vy * 0.96 + q.gravidade * dt;
        q.vida -= dt;

        return q.vida > 0;
    });

    textosFlutuantes = textosFlutuantes.filter(t => {
        t.y -= dt * 1.2;
        t.vida -= dt;

        return t.vida > 0;
    });

    ondas = ondas.filter(o => {
        o.raio += dt * 3;
        o.vida -= dt * 2;

        return o.vida > 0;
    });

    rastro = rastro.filter(m => {
        m.vida -= dt * 3.5;

        return m.vida > 0;
    });

    tremor = Math.max(0, tremor - dt * 40);
    amassado = Math.max(0, amassado - dt * 5);

    if (tempoRosto > 0 && rosto !== "dead" && rosto !== "win") {
        tempoRosto -= dt;
    }
}

let ultimoQuadro = performance.now();

function loopDoJogo(agora) {
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

function atualizarAcido(dt) {
    if (estado === "jogando" && acidoAtivo) {
        tempoAcido += dt;

        if (superficieDoAcido() <= sapo.y + 0.5) {
            matarPeloAcido();
        }
    }
}

function moverSapo(dt) {
    if (estado === "jogando" && direcaoSlide) {
        acumulador += dt;

        while (acumulador >= 0.03 && direcaoSlide && estado === "jogando") {
            acumulador -= 0.03;
            darPasso();
        }
    }
}

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

function suavizarSapo(dt) {
    const velocidade = Math.min(1, dt * 28);

    sapo.px += (sapo.x - sapo.px) * velocidade;
    sapo.py += (sapo.y - sapo.py) * velocidade;
}

gerarFase(1);
ajustarTamanho();

sapo = {
    x: inicio.x,
    y: inicio.y,
    px: inicio.x,
    py: inicio.y
};

atualizarHud();
mostrarTelaInicial();

requestAnimationFrame(loopDoJogo);

