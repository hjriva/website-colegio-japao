
document.addEventListener("DOMContentLoaded", () => {

    const container = window.document.getElementById('controleAgenda')
    const mainPage = window.document.getElementById('controleAgenda')

    container.innerHTML = 'teste'

    fetch('/agenda')
    .then(response => response.json()
    .then(data => {
        console.log(data);
        data.forEach(entrada => {
            const ev = document.createElement('div')
            ev.classList.add('eventos_agenda');
            mainPage.appendChild(ev);

            const title = document.createElement('div');
            title.textContent = `${entrada.titulo}: \n
            ${entrada.descricao}`  
            title.classList.add('editaveis')
            const descr = document.createElement('div');

            ev.appendChild(title)
            ev.appendChild(descr)
            ev.setAttribute('id', entrada.idEntrada)

            //Botão de editar de cada evento
            const bot_editar = document.createElement('input');
            bot_editar.setAttribute('type', 'button')
            bot_editar.setAttribute('value', "editar")
            bot_editar.addEventListener('click', HabilitarEdit)
            
            ev.appendChild(bot_editar);

            //Botão de excluir de cada evento
            const bot_excl = document.createElement('input');
            bot_excl.setAttribute('type', 'button')
            bot_excl.setAttribute('value', "excluir")
            bot_excl.addEventListener('click', () => {
                DeletarItem(entrada.idEntrada)
            })
            
            ev.appendChild(bot_excl);
        })
    }))
    .catch(error => console.log(error))

})

//baseado no meu código antigo

window.document.getElementById("cria").addEventListener('click', () =>  {
    let HoraEvento = window.document.getElementById('HoraNovoEvento');
    let DataEvento = window.document.getElementById('dataNovoEvento');
    let NomeEvento = window.document.getElementById('NomeNovoEvento').value;
    let descrEvento = window.document.getElementById('DescNovoEvento').value; 
    let ImgEvento = window.document.getElementById('ImagemNovoEvento');

fetch('/updateBD', {
    method: "POST", 
    body: JSON.stringify({ 
        nome: NomeEvento}), 
    headers: {"Content-type": "application/json; charset=UTF-8"}})
.then((data => {console.log(data);}))
.catch(error => console.log(error))
})

let initialValue;

function HabilitarEdit(event) {
    //alert('teste');
    const x = event.target.parentNode.childNodes
    x.forEach(item => {
        if (item.classList.contains('editaveis')) {
            console.log(item)
        let itemInput = document.createElement('input');
        
        let labelItem = document.createElement('label')
        labelItem.innerText = 'Nome: '

        itemInput.type = 'text';
	    itemInput.value = item.textContent;
        initialValue = item;
        //item.prepend(itemInput);
        item.textContent = ''
        item.appendChild(labelItem)
	   item.appendChild(itemInput)
        //itemInput.select();

}})

event.target.style.display = 'none'
let inputSalvar = document.createElement('input')
inputSalvar.setAttribute('type', 'button')
inputSalvar.setAttribute('value', 'Salvar')
inputSalvar.addEventListener('click', () => {Editar(event.target.parentNode.id, 'a', 'b')})
event.target.parentNode.appendChild(inputSalvar)
}

function DeletarItem(x) {
    alert(x)

    fetch('/deletar', {
    method: "POST", 
    body: JSON.stringify({ 
        idEntrada: x}), 
    headers: {"Content-type": "application/json; charset=UTF-8"}})
    .then((data => {console.log(data);}))
    .catch(error => console.log(error))
}

//window.document.getElementById('salvarPost').addEventListener('click', () => {alert('i')})


function Editar(a, b, c) {
    alert(a)

fetch('/Alteracao_BD', {
    method: "POST", 
    body: JSON.stringify({ 
        idEntrada: a,
        nome: b,
        descricao: c}), 
    headers: {"Content-type": "application/json; charset=UTF-8"}})
.then((data => {console.log(data);}))
.catch(error => console.log(error))
    //função para salvar no banco de dados, a mesma do criar

    //preciso acessar id e dados dos inputs
}