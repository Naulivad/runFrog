
// =====================================================================
// heitor.js
// Tela inicial com botão JOGAR e salvamento das estatísticas.
// =====================================================================

// ---------- SALVAR DADOS NO NAVEGADOR ----------

const CHAVE_RANKING = "gruta_rank";

function lerRankingLocal() {
    try {
        return JSON.parse(localStorage.getItem(CHAVE_RANKING) || "[]");
    } catch (erro) {
        return [];
    }
}

function salvarRankingLocal(lista) {
    try {
        localStorage.setItem(CHAVE_RANKING, JSON.stringify(lista));
    } catch (erro) {}
}

function chaveDoApelido(nome) {
    const simples = String(nome).toLowerCase().replace(/[^a-z0-9]/g, "");
    return "n_" + (simples || "anon");
}

// ---------- SALVAR PONTUAÇÃO E ESTATÍSTICAS ----------

async function salvarPontuacao() {

    const registro = {
        nick: apelido || "Jogador",
        score: pontos,
        deaths: mortes,
        coins: moedasPegas,
        stars: moscasPegas,
        ts: Date.now()
    };

    // Salva no navegador
    const lista = lerRankingLocal();

    const posicao = lista.findIndex(
        r => chaveDoApelido(r.nick) === chaveDoApelido(registro.nick)
    );

    if (posicao < 0) {
        lista.push(registro);
    } else if (lista[posicao].score < pontos) {
        lista[posicao] = registro;
    }

    salvarRankingLocal(lista);

    // Salva no banco compartilhado, se existir
    if (banco) {
        try {
            const doc = banco.collection("ranking").doc(chaveDoApelido(registro.nick));
            const atual = await doc.get();

            if (!atual.exists || (atual.data().score || 0) < pontos) {
                await doc.set(registro);
            }
        } catch (erro) {}
    }
}

// ---------- TELAS DO JOGO ----------

function mostrarTela(titulo, mensagemHtml, opcoes) {

    porId("titulo").textContent = titulo;
    porId("mensagem").innerHTML = mensagemHtml;

    porId("campo-apelido").classList.add("hidden");
    porId("lista-ranking").classList.add("hidden");

    porId("botao-principal").textContent = opcoes.botao;
    acaoBotao1 = opcoes.acao;

    porId("botao-secundario").classList.add("hidden");
    acaoBotao2 = null;

    porId("sobreposicao").classList.remove("hidden");
}

// ---------- TELA INICIAL ----------

function mostrarTelaInicial() {

    estado = "menu";

    mostrarTela(
        "Fuga da Cobra",
        "Você é um sapo engolido por uma cobra! " +
        "Pegue todas as moedas e moscas, desvie dos espinhos " +
        "e fuja pelo portal antes que o ácido suba!",
        {
            botao: "JOGAR",
            acao: comecarJogo
        }
    );
}

// ---------- COMEÇAR JOGO ----------

function comecarJogo() {

    apelido = "Jogador";

    fase = 1;
    pontos = 0;
    moedasPegas = 0;
    moscasPegas = 0;
    mortes = 0;

    porId("sobreposicao").classList.add("hidden");

    carregarFase();
}

// ---------- BOTÃO ----------

porId("botao-principal").onclick = () => {
    if (acaoBotao1) acaoBotao1();
};
