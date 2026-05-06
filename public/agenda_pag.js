document.addEventListener("DOMContentLoaded", () => {
const PagAgenda = window.document.getElementById('AgendaPublica')

fetch('/agenda')
.then(response => response.json())
.then(data => {
    console.log(data);
    data.forEach(entrada => {
    const ev = document.createElement('div')
    ev.classList.add('eventos_agenda');
    PagAgenda.appendChild(ev);

    const title = document.createElement('div');
    title.textContent = `${entrada.titulo}: \n
    ${entrada.descricao}`  

    ev.appendChild(title);
    })
  
   
})
.catch(error => console.log(error))
})