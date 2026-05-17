import { criaCardEvento } from '/util.js';
//Puxando a função do arquivo util.js

/*Adicionando evento no carregamento da página,
para que os itens apareçam*/
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('AgendaPublica');

    fetch('/agenda')
        .then(res => res.json())
        .then(data => data.forEach(entrada => criaCardEvento(entrada, container)))
        .catch(err => console.error(err));
});

