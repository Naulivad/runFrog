// =====================================================================
// variaveis.js
// Guarda as variáveis globais do jogo. Todos os outros arquivos
// leem e alteram as variáveis que estão aqui.
// =====================================================================

// ---------- ATALHOS DO NAVEGADOR ----------
const canvas = document.getElementById("canvas"); // a "folha" onde o jogo é desenhado
const ctx = canvas.getContext("2d");              // o "pincel" usado para desenhar nela
const porId = id => document.getElementById(id);  // atalho para achar um elemento do HTML

// ---------- CONSTANTES ----------
// Cada direção é [x, y]: andar -1 em y é subir, +1 em y é descer.
const DIRECOES = {
    cima: [0, -1],
    baixo: [0, 1],
    esquerda: [-1, 0],
    direita: [1, 0]
};

const TOTAL_FASES = 10;
const ATRASO_ACIDO = 2.5;          // "vantagem" em linhas: o ácido começa abaixo do mapa
const VERDE_ACIDO = "#9dff6a";     // cor usada nas explosões de ácido
const PENALIDADE_MORTE = 20;       // pontos perdidos cada vez que o sapo morre

// ---------- TAMANHO DO MAPA ----------
let tamanho = 8;     // o mapa é um quadrado de tamanho x tamanho células
let tamCelula = 60;  // largura/altura de cada célula, em pixels

// ---------- MAPA DA FASE ----------
// Cada célula tem um número (índice) = y * tamanho + x.
// Os conjuntos (Set) guardam só os índices das células que têm cada coisa.
let paredes;  // células que são parede
let ossos;    // ossos = espinhos que matam
let moedas;   // moedas ainda não coletadas (10 pontos)
let moscas;   // moscas ainda não coletadas (50 pontos)
let inicio;   // { x, y } onde o sapo começa
let saida;    // { x, y } onde fica o portal
let sapo;     // { x, y } = posição real; { px, py } = posição desenhada (suavizada)

let totalMoedas = 0; // quantas moedas a fase tinha no começo
let totalMoscas = 0; // quantas moscas a fase tinha no começo

// ---------- ESTADO DO JOGO ----------
// estado pode ser: "menu", "jogando", "morto", "venceu" (fase) ou "fim" (jogo)
let estado = "menu";
let apelido = "";

let fase = 1;
let pontos = 0;
let moedasPegas = 0;
let moscasPegas = 0;
let mortes = 0;

// Cópia dos pontos no começo da fase (para voltar a ela ao morrer/reiniciar)
let salvo;

// ---------- TEMPO ----------
let tempo = 0;             // segundos desde que o jogo abriu
let tempoInicioFase = 0;   // valor de "tempo" quando a fase atual começou
let tempoMorto = 0;        // segundos desde que o sapo morreu

// ---------- MOVIMENTO DO SAPO ----------
let direcaoSlide = null;   // direção em que o sapo está deslizando (null = parado)
let ultimaDirecao = null;  // última direção usada (serve para a língua e a animação)
let acumulador = 0;        // soma o tempo para dar um passo a cada 0,03 s
let passosDados = 0;       // quantas células andou neste deslize (0 = bateu logo de cara)

// ---------- ÁCIDO ----------
let tempoAcido = 0;          // segundos desde que o ácido começou a subir
let acidoAtivo = false;      // só começa a subir depois do primeiro movimento
let velocidadeAcido = 0.12;  // linhas por segundo (calculada em cada fase)
let pctAcidoMostrado = -1;   // último % mostrado no HUD (evita escrever à toa)

// ---------- EFEITOS VISUAIS ----------
let particulas = [];       // quadradinhos de explosão
let textosFlutuantes = []; // textos como "+10"
let rastro = [];           // marcas deixadas pelo sapo ao deslizar
let ondas = [];            // quadrados que se expandem nas batidas
let tremor = 0;            // força do tremor de tela
let amassado = 0;          // força do "amassar" do sapo ao bater

// Rosto do sapo: "idle", "slide", "hit", "dead", "happy" ou "win"
let rosto = "idle";
let tempoRosto = 0;        // quanto tempo falta para o rosto voltar ao normal

// Bolhinhas decorativas do fundo
const bolhasFundo = [];
for (let i = 0; i < 36; i++) {
    bolhasFundo.push({
        x: Math.random(),
        y: Math.random(),
        fase: Math.random() * 9,
        velocidade: 0.3 + Math.random()
    });
}

// ---------- TELAS E BOTÕES ----------
let acaoBotao1 = null; // o que o botão principal faz agora
let acaoBotao2 = null; // o que o botão secundário faz agora

// ---------- BANCO DE DADOS (ranking compartilhado) ----------
// Só existe quando o jogo roda dentro do Claude. Fora dele, fica null
// e o ranking usa apenas o armazenamento do próprio navegador.
let banco = null;

(window.claude && claude.use
    ? claude.use("db")
    : Promise.resolve(null)
)
    .then(b => banco = b)
    .catch(() => {});
