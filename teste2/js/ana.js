// =====================================================================
// ana.js
// Gera cada fase.
//
// Ideia principal: primeiro sorteamos um CAMINHO possível (uma sequência
// de deslizes). Moedas e moscas são colocadas nesse caminho, então SEMPRE
// dá para pegar tudo. Os ossos (que matam) vão em células fora do caminho.
// =====================================================================

// ---------- ALEATÓRIO COM SEMENTE ----------
// Com a mesma semente, sai sempre a mesma sequência de números.
// Por isso a fase 3 é igual toda vez que você joga.
function criarAleatorio(semente) {
    return function () {
        semente |= 0;
        semente = semente + 0x6D2B79F5 | 0;

        let mistura = Math.imul(semente ^ semente >>> 15, 1 | semente);
        mistura = mistura + Math.imul(mistura ^ mistura >>> 7, 61 | mistura) ^ mistura;

        return ((mistura ^ mistura >>> 14) >>> 0) / 4294967296; // número entre 0 e 1
    };
}

// ---------- AJUDANTES DO MAPA ----------

// Converte (x, y) no número da célula.
const indice = (x, y) => y * tamanho + x;

// Vale true se a célula é parede ou está fora do mapa.
function ehParede(x, y) {
    return (
        x < 0 || y < 0 ||
        x >= tamanho || y >= tamanho ||
        paredes.has(indice(x, y))
    );
}

// ---------- GERADOR DA FASE ----------
function gerarFase(lv) {

    tamanho = Math.min(14, 7 + Math.ceil(lv * 0.75)); // mapas maiores nas fases altas
    let passosAlvo = 4 + Math.round(lv * 1.1);        // quantos deslizes o caminho terá

    // Tenta várias vezes até sair um mapa bom
    for (let tentativa = 0; tentativa < 800; tentativa++) {

        // Se está difícil achar mapa, pede caminhos um pouco mais curtos
        if (tentativa && tentativa % 120 === 0) {
            passosAlvo = Math.max(3, passosAlvo - 1);
        }

        const sorteio = criarAleatorio(lv * 977 + tentativa * 31 + 5);

        paredes = new Set();
        ossos = new Set();
        moedas = new Set();
        moscas = new Set();

        // 1) Espalha paredes (mais paredes nas fases altas)
        const densidade = 0.12 + lv * 0.012;
        for (let i = 0; i < tamanho * tamanho; i++) {
            if (sorteio() < densidade) paredes.add(i);
        }

        // 2) Sorteia onde o sapo começa
        inicio = sortearInicio(sorteio);
        if (!inicio) continue;

        // 3) Sorteia um caminho que termina numa célula nova (será o portal)
        const caminho = sortearCaminho(sorteio, passosAlvo);
        if (!caminho) continue;

        // 4) Calcula a velocidade do ácido; se for impossível, tenta outro mapa
        const velocidade = calcularVelocidadeAcido(lv, tentativa, caminho.tempoDeChegada);
        if (velocidade === null) continue;
        velocidadeAcido = velocidade;

        // 5) Coloca portal, moscas, moedas e ossos
        saida = caminho.paradas[caminho.paradas.length - 1];
        posicionarMoscasEMoedas(sorteio, lv, caminho);
        posicionarOssos(sorteio, lv, caminho);

        totalMoedas = moedas.size;
        totalMoscas = moscas.size;
        return;
    }
}

// Procura uma célula livre (sem parede) para o sapo começar.
// Devolve { x, y } ou null se não achou.
function sortearInicio(sorteio) {
    let x, y;
    let tentativas = 0;

    do {
        x = sorteio() * tamanho | 0;
        y = sorteio() * tamanho | 0;
        tentativas++;
    } while (paredes.has(indice(x, y)) && tentativas < 60);

    return paredes.has(indice(x, y)) ? null : { x, y };
}

// Sorteia uma sequência de deslizes a partir do início.
// Devolve:
//   paradas          - lugares onde o sapo para entre um deslize e outro
//   visitadas        - todas as células por onde o caminho passa
//   tempoDeChegada   - em quantos segundos (aprox.) o jogador chega em cada célula
// Devolve null se não conseguiu fazer um caminho bom.
function sortearCaminho(sorteio, passosAlvo) {

    let atual = { x: inicio.x, y: inicio.y };
    const visitadas = new Set([indice(atual.x, atual.y)]);
    const paradas = [atual];
    const tempoDeChegada = new Map();

    for (let passo = 0; passo < passosAlvo + 10; passo++) {

        // Vê para onde dá para deslizar (as 4 direções) a partir daqui
        const opcoes = [];

        for (const d of Object.values(DIRECOES)) {
            let x = atual.x;
            let y = atual.y;
            let novas = 0;           // quantas células ainda não visitadas esse deslize cobre
            const celulas = [];

            while (!ehParede(x + d[0], y + d[1])) {
                x += d[0];
                y += d[1];
                celulas.push(indice(x, y));
                if (!visitadas.has(indice(x, y))) novas++;
            }

            if (celulas.length) opcoes.push({ x, y, celulas, novas });
        }

        if (!opcoes.length) return null; // sapo preso, caminho ruim

        // Prefere deslizes que passam por células novas
        const comNovas = opcoes.filter(o => o.novas > 0);
        const lista = comNovas.length ? comNovas : opcoes;
        const escolhida = lista[sorteio() * lista.length | 0];

        // Chegou ao número de passos e parou numa célula nova? Então acabou.
        const terminou =
            passo + 1 >= passosAlvo &&
            !visitadas.has(indice(escolhida.x, escolhida.y));

        // Anota quando o jogador chega em cada célula (0,85 s por deslize + 0,03 s por célula)
        escolhida.celulas.forEach((celula, j) => {
            if (!tempoDeChegada.has(celula)) {
                tempoDeChegada.set(celula, passo * 0.85 + (j + 1) * 0.03);
            }
        });

        escolhida.celulas.forEach(celula => visitadas.add(celula));

        atual = { x: escolhida.x, y: escolhida.y };
        paradas.push(atual);

        if (terminou) return { paradas, visitadas, tempoDeChegada };
    }

    return null;
}

// O ácido não pode ser rápido demais, senão o caminho fica impossível.
// Aqui calculamos a velocidade máxima que ainda deixa o jogador chegar
// em todas as células do caminho antes do ácido.
// Devolve a velocidade, ou null se esse mapa não serve.
function calcularVelocidadeAcido(lv, tentativa, tempoDeChegada) {

    const desejada = 0.14 + lv * 0.03; // quanto mais alta a fase, mais rápido
    let maxima = 9;

    for (const [celula, segundos] of tempoDeChegada) {
        if (segundos > 0) {
            const linha = celula / tamanho | 0;
            const linhasAteOAcido = tamanho - linha - 0.5 + ATRASO_ACIDO;
            maxima = Math.min(maxima, linhasAteOAcido * 0.95 / segundos);
        }
    }

    // Quanto mais tentativas falham, mais aceitamos um ácido lento
    const minimoAceito = desejada * Math.max(0, 0.75 - tentativa * 0.00108);
    if (maxima < minimoAceito) return null;

    return Math.max(0.04, Math.min(desejada, maxima));
}

// Coloca as moscas (valem mais) e as moedas ao longo do caminho.
function posicionarMoscasEMoedas(sorteio, lv, caminho) {

    const indiceSaida = indice(saida.x, saida.y);
    const indiceInicio = indice(inicio.x, inicio.y);

    // Moscas ficam em lugares onde o sapo PARA (exceto início e saída)
    const meios = [...new Set(caminho.paradas.map(p => indice(p.x, p.y)))]
        .filter(c => c !== indiceSaida && c !== indiceInicio);

    const quantasMoscas = Math.min(meios.length, 1 + Math.floor(lv / 2));

    for (let i = 0; i < quantasMoscas; i++) {
        const posicao = sorteio() * meios.length | 0;
        moscas.add(meios.splice(posicao, 1)[0]);
    }

    // Moedas ficam em todo o resto do caminho
    for (const celula of caminho.visitadas) {
        if (celula !== indiceSaida && celula !== indiceInicio && !moscas.has(celula)) {
            moedas.add(celula);
        }
    }
}

// Coloca ossos em células fora do caminho (assim o caminho perfeito continua livre).
function posicionarOssos(sorteio, lv, caminho) {

    // Células livres: sem parede e fora do caminho
    const livres = [];
    for (let celula = 0; celula < tamanho * tamanho; celula++) {
        if (!paredes.has(celula) && !caminho.visitadas.has(celula)) livres.push(celula);
    }

    // Ossos "perigosos": na mesma linha ou coluna de uma parada do sapo
    const alinhadas = livres.filter(celula =>
        caminho.paradas.some(p =>
            p.x === celula % tamanho || p.y === (celula / tamanho | 0)
        )
    );

    const candidatas = alinhadas.length >= 3 ? alinhadas : livres;
    const quantos = Math.min(candidatas.length, Math.round(2 + lv * 2.3));

    for (let i = 0; i < quantos; i++) {
        const posicao = sorteio() * candidatas.length | 0;
        ossos.add(candidatas.splice(posicao, 1)[0]);
    }
}

// ---------- TAMANHO NA TELA ----------

// Calcula o tamanho das células para o mapa caber na janela.
function ajustarTamanho() {
    const lado = Math.min(innerWidth - 12, innerHeight - 120, 940);

    tamCelula = Math.max(16, Math.floor(lado / tamanho));

    canvas.width = tamCelula * tamanho;
    canvas.height = tamCelula * tamanho;
}

// ---------- CARREGAR UMA FASE ----------
function carregarFase() {

    gerarFase(fase);
    ajustarTamanho();

    tempoInicioFase = tempo;

    // x,y = posição real; px,py = posição desenhada (vai deslizando até x,y)
    sapo = { x: inicio.x, y: inicio.y, px: inicio.x, py: inicio.y };

    // Guarda os pontos de agora: se o sapo morrer, volta para estes valores
    salvo = { pontos, moedasPegas, moscasPegas };

    tempoAcido = 0;
    acidoAtivo = false;

    estado = "jogando";
    direcaoSlide = null;
    tempoRosto = 0;

    particulas = [];
    rastro = [];
    textosFlutuantes = [];
    ondas = [];

    atualizarHud();
}
