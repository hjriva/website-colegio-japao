import { criaCardEvento } from '/util.js';

const containerHoje = document.getElementById('eventos-hoje');
const containerProximos = document.getElementById('proximos-eventos');
const containerDia = document.getElementById('eventos-dia');
const inputData = document.getElementById('input-data');
const btnAnterior = document.getElementById('btn-anterior');
const btnProximo = document.getElementById('btn-proximo');
const infoPagina = document.getElementById('info-pagina');

let paginaAtual = 1;
let totalProximos = 0;
const LIMITE = 10;

function carregaHoje() {
    fetch('/agenda/hoje')
        .then(res => res.json())
        .then(eventos => {
            containerHoje.innerHTML = '';
            if (eventos.length === 0) {
                containerHoje.innerHTML = '<p>Nenhum evento hoje.</p>';
                return;
            }
            eventos.forEach(entrada => criaCardEvento(entrada, containerHoje));
        })
        .catch(err => console.error(err));
}

function carregaProximos(pagina = 1) {
    fetch(`/agenda/proximos?pagina=${pagina}`)
        .then(res => res.json())
        .then(({ eventos, total }) => {
            containerProximos.innerHTML = '';
            totalProximos = total;
            paginaAtual = pagina;

            if (eventos.length === 0) {
                containerProximos.innerHTML = '<p>Nenhum próximo evento.</p>';
            } else {
                eventos.forEach(entrada => criaCardEvento(entrada, containerProximos));
            }

            atualizaPaginacao();
        })
        .catch(err => console.error(err));
}

function atualizaPaginacao() {
    const totalPaginas = Math.ceil(totalProximos / LIMITE);
    infoPagina.textContent = `Página ${paginaAtual} de ${totalPaginas}`;
    btnAnterior.disabled = paginaAtual === 1;
    btnProximo.disabled = paginaAtual >= totalPaginas;
}

function carregaEventosDia(data) {
    containerDia.innerHTML = '';
    fetch(`/agenda/dia?data=${data}`)
        .then(res => res.json())
        .then(eventos => {
            if (eventos.length === 0) {
                containerDia.innerHTML = '<p>Nenhum evento neste dia.</p>';
                return;
            }
            eventos.forEach(entrada => criaCardEvento(entrada, containerDia));
        })
        .catch(err => console.error(err));
}

document.addEventListener('DOMContentLoaded', () => {
    carregaHoje();
    carregaProximos();

    inputData.addEventListener('change', () => carregaEventosDia(inputData.value));
    btnAnterior.addEventListener('click', () => carregaProximos(paginaAtual - 1));
    btnProximo.addEventListener('click', () => carregaProximos(paginaAtual + 1));
});