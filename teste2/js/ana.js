
function criarAleatorio(semente) {
    return function () {
        semente |= 0;
        semente = semente + 0x6D2B79F5 | 0;

        let mistura = Math.imul(semente ^ semente >>> 15, 1 | semente);
        mistura = mistura + Math.imul(mistura ^ mistura >>> 7, 61 | mistura) ^ mistura;

        return ((mistura ^ mistura >>> 14) >>> 0) / 4294967296; 
    };
}


const indice = (x, y) => y * tamanho + x;

function ehParede(x, y) {
    return (
        x < 0 || y < 0 ||
        x >= tamanho || y >= tamanho ||
        paredes.has(indice(x, y))
    );
}


function gerarFase(lv) {

    tamanho = Math.min(14, 7 + Math.ceil(lv * 0.75)); 
    let passosAlvo = 4 + Math.round(lv * 1.1);        

  
    for (let tentativa = 0; tentativa < 800; tentativa++) {

      
        if (tentativa && tentativa % 120 === 0) {
            passosAlvo = Math.max(3, passosAlvo - 1);
        }

        const sorteio = criarAleatorio(lv * 977 + tentativa * 31 + 5);

        paredes = new Set();
        ossos = new Set();
        moedas = new Set();
        moscas = new Set();

  
        const densidade = 0.12 + lv * 0.012;
        for (let i = 0; i < tamanho * tamanho; i++) {
            if (sorteio() < densidade) paredes.add(i);
        }

        
        inicio = sortearInicio(sorteio);
        if (!inicio) continue;

       
        const caminho = sortearCaminho(sorteio, passosAlvo);
        if (!caminho) continue;

        
        const velocidade = calcularVelocidadeAcido(lv, tentativa, caminho.tempoDeChegada);
        if (velocidade === null) continue;
        velocidadeAcido = velocidade;

        
        saida = caminho.paradas[caminho.paradas.length - 1];
        posicionarMoscasEMoedas(sorteio, lv, caminho);
        posicionarOssos(sorteio, lv, caminho);

        totalMoedas = moedas.size;
        totalMoscas = moscas.size;
        return;
    }
}


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


function sortearCaminho(sorteio, passosAlvo) {

    let atual = { x: inicio.x, y: inicio.y };
    const visitadas = new Set([indice(atual.x, atual.y)]);
    const paradas = [atual];
    const tempoDeChegada = new Map();

    for (let passo = 0; passo < passosAlvo + 10; passo++) {

        
        const opcoes = [];

        for (const d of Object.values(DIRECOES)) {
            let x = atual.x;
            let y = atual.y;
            let novas = 0;         
            const celulas = [];

            while (!ehParede(x + d[0], y + d[1])) {
                x += d[0];
                y += d[1];
                celulas.push(indice(x, y));
                if (!visitadas.has(indice(x, y))) novas++;
            }

            if (celulas.length) opcoes.push({ x, y, celulas, novas });
        }

        if (!opcoes.length) return null; 

        
        const comNovas = opcoes.filter(o => o.novas > 0);
        const lista = comNovas.length ? comNovas : opcoes;
        const escolhida = lista[sorteio() * lista.length | 0];

        
        const terminou =
            passo + 1 >= passosAlvo &&
            !visitadas.has(indice(escolhida.x, escolhida.y));

       
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


function calcularVelocidadeAcido(lv, tentativa, tempoDeChegada) {

    const desejada = 0.14 + lv * 0.03; 
    let maxima = 9;

    for (const [celula, segundos] of tempoDeChegada) {
        if (segundos > 0) {
            const linha = celula / tamanho | 0;
            const linhasAteOAcido = tamanho - linha - 0.5 + ATRASO_ACIDO;
            maxima = Math.min(maxima, linhasAteOAcido * 0.95 / segundos);
        }
    }


    const minimoAceito = desejada * Math.max(0, 0.75 - tentativa * 0.00108);
    if (maxima < minimoAceito) return null;

    return Math.max(0.04, Math.min(desejada, maxima));
}

function posicionarMoscasEMoedas(sorteio, lv, caminho) {

    const indiceSaida = indice(saida.x, saida.y);
    const indiceInicio = indice(inicio.x, inicio.y);

    const meios = [...new Set(caminho.paradas.map(p => indice(p.x, p.y)))]
        .filter(c => c !== indiceSaida && c !== indiceInicio);

    const quantasMoscas = Math.min(meios.length, 1 + Math.floor(lv / 2));

    for (let i = 0; i < quantasMoscas; i++) {
        const posicao = sorteio() * meios.length | 0;
        moscas.add(meios.splice(posicao, 1)[0]);
    }


    for (const celula of caminho.visitadas) {
        if (celula !== indiceSaida && celula !== indiceInicio && !moscas.has(celula)) {
            moedas.add(celula);
        }
    }
}

function posicionarOssos(sorteio, lv, caminho) {


    const livres = [];
    for (let celula = 0; celula < tamanho * tamanho; celula++) {
        if (!paredes.has(celula) && !caminho.visitadas.has(celula)) livres.push(celula);
    }


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


function ajustarTamanho() {
    const lado = Math.min(innerWidth - 12, innerHeight - 120, 940);

    tamCelula = Math.max(16, Math.floor(lado / tamanho));

    canvas.width = tamCelula * tamanho;
    canvas.height = tamCelula * tamanho;
}


function carregarFase() {

    gerarFase(fase);
    ajustarTamanho();

    tempoInicioFase = tempo;

    sapo = { x: inicio.x, y: inicio.y, px: inicio.x, py: inicio.y };


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
