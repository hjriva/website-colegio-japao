import { ReqDisciplinas } from '../util.js';

document.addEventListener('DOMContentLoaded', () => { 
    const lista = document.getElementById('lista-disciplinas')
    ReqDisciplinas(lista)
})