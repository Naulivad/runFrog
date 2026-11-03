const canvas = document.getElementById("canvas"); 
const ctx = canvas.getContext("2d");              
const porId = id => document.getElementById(id);  

const DIRECOES = {
    cima: [0, -1],
    baixo: [0, 1],
    esquerda: [-1, 0],
    direita: [1, 0]
};

const TOTAL_FASES = 20;
const ATRASO_ACIDO = 0;          
const VERDE_ACIDO = "#9dff6a";     
const PENALIDADE_MORTE = 20;       

let tamanho = 8;     
let tamCelula = 60;  


let paredes;  
let ossos;    
let moedas;  
let moscas;   
let inicio;   
let saida;    
let sapo;    

let totalMoedas = 0; 
let totalMoscas = 0; 


let estado = "menu";
let apelido = "";

let fase = 1;
let pontos = 0;
let moedasPegas = 0;
let moscasPegas = 0;
let mortes = 0;


let salvo;


let tempo = 0;             
let tempoInicioFase = 0;   
let tempoMorto = 0;        


let direcaoSlide = null;   
let ultimaDirecao = null;  
let acumulador = 0;        
let passosDados = 0;       

let tempoAcido = 0;          
let acidoAtivo = false;      
let velocidadeAcido = 0.12;  
let pctAcidoMostrado = -1;  


let particulas = [];       
let textosFlutuantes = []; 
let rastro = [];           
let ondas = [];            
let tremor = 0;           
let amassado = 0;          


let rosto = "idle";
let tempoRosto = 0; 


const bolhasFundo = [];
for (let i = 0; i < 36; i++) {
    bolhasFundo.push({
        x: Math.random(),
        y: Math.random(),
        fase: Math.random() * 9,
        velocidade: 0.3 + Math.random()
    });
}

let acaoBotao1 = null; 
let acaoBotao2 = null; 
let banco = null;

(window.claude && claude.use
    ? claude.use("db")
    : Promise.resolve(null)
)
    .then(b => banco = b)
    .catch(() => {});
