// Começa um deslize na direção pedida ("cima", "baixo", "esquerda", "direita").
function mover(direcao) {

    // Só move se está jogando e se o sapo já parou
    if (estado !== "jogando" || direcaoSlide) return;

    direcaoSlide = DIRECOES[direcao];
    ultimaDirecao = direcaoSlide;

    passosDados = 0;
    acumulador = 0;

    acidoAtivo = true; // o ácido começa a subir no primeiro movimento
}

// ---------- TECLADO ----------
const TECLAS = {
    ArrowUp: "cima",     w: "cima",     W: "cima",
    ArrowDown: "baixo",  s: "baixo",    S: "baixo",
    ArrowLeft: "esquerda", a: "esquerda", A: "esquerda",
    ArrowRight: "direita", d: "direita",  D: "direita"
};

addEventListener("keydown", e => {

    // Fora da partida (menu, ranking...) o teclado fica livre para digitar o apelido
    if (estado !== "jogando" && estado !== "morto") return;

    if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        reiniciarFase();
        return;
    }

    const direcao = TECLAS[e.key];

    if (direcao) {
        e.preventDefault(); // impede a página de rolar com as setas
        mover(direcao);
    }
});

// ---------- TOQUE (arrastar o dedo) ----------
let toqueX;
let toqueY;

canvas.addEventListener("touchstart", e => {
    toqueX = e.touches[0].clientX;
    toqueY = e.touches[0].clientY;
}, { passive: true });

canvas.addEventListener("touchend", e => {
    const dx = e.changedTouches[0].clientX - toqueX;
    const dy = e.changedTouches[0].clientY - toqueY;

    // Arrastou muito pouco: ignora
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;

    // Decide se foi mais na horizontal ou na vertical
    if (Math.abs(dx) > Math.abs(dy)) {
        mover(dx > 0 ? "direita" : "esquerda");
    } else {
        mover(dy > 0 ? "baixo" : "cima");
    }
});

// ---------- JANELA ----------
addEventListener("resize", ajustarTamanho);
