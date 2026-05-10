import { criaCardEvento } from '/util.js';

function acoesAdmin(ev, entrada) {
    const btnEditar = document.createElement('button');
    btnEditar.textContent = 'Alterar';
    btnEditar.addEventListener('click', () => editarEntrada(entrada.identrada));

    const btnExcluir = document.createElement('button');
    btnExcluir.textContent = 'Excluir';
    btnExcluir.addEventListener('click', () => excluirEntrada(entrada.identrada));

    ev.appendChild(btnEditar);
    ev.appendChild(btnExcluir);
}

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('controleAgenda');

    fetch('/agenda')
        .then(res => res.json())
        .then(data => data.forEach(entrada => criaCardEvento(entrada, container, acoesAdmin)))
        .catch(err => console.error(err));
});

function editarEntrada(idElem) {
    console.log(idElem)
}

function excluirEntrada(idElem) {
    console.log(idElem)
}