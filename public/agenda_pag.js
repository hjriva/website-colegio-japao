import { criaCardEvento } from '/util.js';

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('AgendaPublica');

    fetch('/agenda')
        .then(res => res.json())
        .then(data => data.forEach(entrada => criaCardEvento(entrada, container)))
        .catch(err => console.error(err));
});