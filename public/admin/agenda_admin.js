

//Puxa a função do arquivo util.js, para que todos os arquivos apareçam na tela
import { criaCardEvento } from '/util.js';

//Aqui cria a função para que cada item tenha os botões de editar e excluir
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

//Chama ambas as funções acoesAdmin e criaCardEvento, no carregamento da página
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('controleAgenda');

    fetch('/agenda')
        .then(res => res.json())
        .then(data => data.forEach(entrada => criaCardEvento(entrada, container, acoesAdmin)))
        .catch(err => console.error(err));
});

//Função para editar itens
function editarEntrada(idElem) {
    fetch('/Alteracao_BD', {
    method: "POST", 
    body: JSON.stringify({ 
        idEntrada: idElem,
        nome: b,
        descricao: c}), 
    headers: {"Content-type": "application/json; charset=UTF-8"}})
.then((data => {console.log(data);}))
.catch(error => console.log(error))
}

//Função para excluir itens
function excluirEntrada(idElem) {
    fetch('/deletar', {
    method: "POST", 
    body: JSON.stringify({ 
    idEntrada: idElem}), 
    headers: {"Content-type": "application/json; charset=UTF-8"}})
    .then((data => {console.log(data);}))
    .catch(error => console.log(error))
}

//Função para inserir novos itens
function InserirNovo() {
    let tituloevento = window.document.getElementById('NomeNovoEvento').value
    let ilustraimg = window.document.getElementById('ImagemNovoEvento').files[0]
    let descr = window.document.getElementById('DescNovoEvento').value;
    let datapost = window.document.getElementById('dataNovoEvento').value;
    let horario = window.document.getElementById('HoraNovoEvento').value

    const formData = new FormData();
    formData.append('titulo', tituloevento);
    formData.append('descricao', descr);
    formData.append('data', datapost);
    formData.append('horario', horario);
    if (ilustraimg) {
        formData.append('imagem', ilustraimg); // mesmo nome usado no multer
    }

    fetch('/updateBD', {
        method: "POST",
        body: formData,
        })
    .then(res => res.json())
    .then(data => console.log(data))
    .catch(error => console.log(error));
}

//Chamando função InserirNovo() no botão de salvar
window.document.getElementById('InsertValue').addEventListener('click', () => {InserirNovo()})