// =====================================================================
// luan.js
// Regras do jogo: o que acontece a cada passo do sapo (pegar moeda,
// bater na parede, morrer, vencer) e o ácido.
// =====================================================================

// ---------- HUD (a barra de informações no topo) ----------
function atualizarHud() {
    porId("hud-fase").textContent = fase;
    porId("hud-pontos").textContent = pontos;
    porId("hud-mortes").textContent = mortes;

    const coletados = (totalMoedas - moedas.size) + (totalMoscas - moscas.size);
    const total = totalMoedas + totalMoscas;
    porId("hud-itens").textContent = coletados + "/" + total;
}

// ---------- ÁCIDO ----------

// Quantas linhas o ácido já cobriu (zero ou negativo = ainda não apareceu).
function nivelDoAcido() {
    return velocidadeAcido * tempoAcido - ATRASO_ACIDO;
}

// Linha onde fica a superfície do ácido (diminui conforme ele sobe).
function superficieDoAcido() {
    return tamanho - nivelDoAcido();
}

// Mostra no HUD a % do mapa coberta pelo ácido (só escreve quando muda).
function atualizarHudAcido() {
    const pct = Math.max(0, Math.min(100, Math.round(nivelDoAcido() / tamanho * 100)));

    if (pct !== pctAcidoMostrado) {
        pctAcidoMostrado = pct;
        porId("hud-acido").textContent = pct + "%";
    }
}

// ---------- EFEITOS ----------

function definirRosto(nome, duracao) {
    rosto = nome;
    tempoRosto = duracao;
}

// Solta "quantidade" quadradinhos que voam para todos os lados.
function explosao(x, y, cor, quantidade, velocidade, gravidade) {
    for (let i = 0; i < quantidade; i++) {
        const angulo = Math.random() * 6.283;
        const forca = velocidade * (0.3 + Math.random());

        particulas.push({
            x: x + 0.5,
            y: y + 0.5,
            vx: Math.cos(angulo) * forca,
            vy: Math.sin(angulo) * forca,
            vida: 0.5 + Math.random() * 0.5, // segundos até sumir
            cor,
            gravidade: gravidade || 0
        });
    }
}

// Cria um quadrado que cresce e some (efeito de onda).
function criarOnda(x, y, cor) {
    ondas.push({ x, y, raio: 0, vida: 1, cor });
}

function criarTextoFlutuante(texto, cor, vida, deslocamentoY) {
    textosFlutuantes.push({
        x: sapo.x,
        y: sapo.y + (deslocamentoY || 0),
        texto,
        cor,
        vida
    });
}

// ---------- REINICIAR ----------
function reiniciarFase() {
    if (estado !== "jogando" && estado !== "morto") return;

    // Volta os pontos para como estavam no começo da fase
    pontos = salvo.pontos;
    moedasPegas = salvo.moedasPegas;
    moscasPegas = salvo.moscasPegas;

    carregarFase();

    tremor = 4;
    explosao(inicio.x, inicio.y, VERDE_ACIDO, 22, 4);
    criarOnda(inicio.x, inicio.y, VERDE_ACIDO);
}

porId("btn-reiniciar").onclick = () => reiniciarFase();

// ---------- MORTE ----------

// Parte comum a todas as mortes (espinhos ou ácido).
function iniciarMorte() {
    estado = "morto";
    tempoMorto = 0;
    direcaoSlide = null;

    mortes++;

    // Perde pontos ao morrer (nunca fica abaixo de zero).
    // A penalidade também vai para "salvo", senão ela sumiria quando a fase recomeça.
    const perdidos = Math.min(PENALIDADE_MORTE, pontos);
    pontos -= perdidos;
    salvo.pontos = Math.max(0, salvo.pontos - PENALIDADE_MORTE);
    if (perdidos > 0) criarTextoFlutuante("-" + perdidos, "#ff6b6b", 1.3, -0.7);

    atualizarHud();

    definirRosto("dead", 9);
    tremor = 14;
}

function morrerNosOssos() {
    iniciarMorte();
    explosao(sapo.x, sapo.y, "#d62828", 34, 5.5, 9);
    explosao(sapo.x, sapo.y, VERDE_ACIDO, 14, 4, 9);
}

function matarPeloAcido() {
    iniciarMorte();
    explosao(sapo.x, sapo.y, VERDE_ACIDO, 40, 5, 6);
    explosao(sapo.x, sapo.y, "#d6ffb0", 16, 4, 6);
}

// ---------- UM PASSO DO SAPO ----------
// Chamada várias vezes por segundo enquanto o sapo desliza.
// Cada chamada anda UMA célula na direção do deslize.
function darPasso() {
    const d = direcaoSlide;

    // Parede na frente: para de deslizar
    if (ehParede(sapo.x + d[0], sapo.y + d[1])) {
        direcaoSlide = null;
        if (passosDados > 0) baterNaParede(d); // só "dói" se chegou a andar
        return;
    }

    // Anda uma célula (e deixa um rastro onde estava)
    rastro.push({ x: sapo.x, y: sapo.y, vida: 1 });
    sapo.x += d[0];
    sapo.y += d[1];
    passosDados++;

    // O que existe nessa nova célula?
    const celula = indice(sapo.x, sapo.y);

    if (moedas.delete(celula)) pegarMoeda();
    if (moscas.delete(celula)) pegarMosca();

    if (ossos.has(celula)) {
        morrerNosOssos();
        return;
    }

    if (sapo.x === saida.x && sapo.y === saida.y) chegarNoPortal();
}

function baterNaParede(d) {
    tremor = 6;
    amassado = 1;
    definirRosto("hit", 0.8);

    explosao(sapo.x, sapo.y, "#c9a24a", 10, 2.5);
    criarOnda(sapo.x + d[0] * 0.5, sapo.y + d[1] * 0.5, "#c9a24a");
}

function pegarMoeda() {
    pontos += 10;
    moedasPegas++;
    atualizarHud();

    definirRosto("happy", 0.45);
    explosao(sapo.x, sapo.y, "#ffd166", 10, 3);
    criarTextoFlutuante("+10", "#ffd166", 0.7);
}

function pegarMosca() {
    pontos += 50;
    moscasPegas++;
    atualizarHud();

    definirRosto("happy", 0.7);
    explosao(sapo.x, sapo.y, "#d8d8e0", 24, 4.5);
    tremor = 3;
    criarOnda(sapo.x, sapo.y, "#d8d8e0");
    criarTextoFlutuante("+50", "#d8d8e0", 0.9);
}

function chegarNoPortal() {
    direcaoSlide = null;
    definirRosto("win", 9);
    tremor = 6;

    // Pegou tudo? Ganha bônus.
    const perfeito = !moedas.size && !moscas.size;

    if (perfeito) {
        pontos += 100;
        criarTextoFlutuante("PERFEITO +100", "#ffd166", 1.4, -0.5);
    }

    atualizarHud();
    explosao(sapo.x, sapo.y, "#6bffb8", 44, 5);
    criarOnda(sapo.x, sapo.y, "#6bffb8");

    const faltaram = moedas.size + moscas.size;

    if (fase >= TOTAL_FASES) {
        // Última fase: salva a pontuação e mostra o ranking
        estado = "fim";

        setTimeout(async () => {
            await salvarPontuacao();
            mostrarTelaRanking(true);
        }, 900);

    } else {
        // Espera 0,9 s (para ver a animação) e mostra a tela de fase completa
        estado = "venceu";

        setTimeout(() => {
            const resultado = perfeito
                ? "✨ <b>PERFEITO!</b> Você pegou tudo (+100)."
                : "Faltaram <b>" + faltaram + "</b> itens. Dá para pegar todos!";

            mostrarTela(
                "Fase " + fase + " completa!",
                resultado +
                "<br>Pontos: <b>" + pontos + "</b> · Mortes: <b>" + mortes + "</b>",
                {
                    botao: "Fase " + (fase + 1),
                    acao: () => {
                        porId("sobreposicao").classList.add("hidden");
                        fase++;
                        carregarFase();
                    }
                }
            );
        }, 900);
    }
}
