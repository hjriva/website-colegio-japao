//Puxar cada disciplina como opção
let datalistDisciplinas = window.document.getElementById('disciplinas-dl');
let checkRandom = window.document.getElementById('randomizar')
let randomizar = false;


checkRandom.addEventListener('click', function () {
    randomizar = checkRandom.checked ? true : false;
    let numeros = window.document.querySelectorAll('.numero-pergunta')
    if (randomizar) {
        numeros.forEach(span => span.style.display = 'none')
    } else {
        numeros.forEach(span => span.style.display = 'initial')
    }
})


document.addEventListener('DOMContentLoaded', () => { 
    fetch("/disciplinas")
        .then(res => res.json())
        .then(data => {
            data.forEach(disciplina => { //itera sobre array de objetos puxado no fatch
                let opcaoDisciplina = document.createElement('option'); //cria opção
                opcaoDisciplina.value = disciplina.nome_disc;  //coloca o value dela como nome da disciplina
                datalistDisciplinas.appendChild(opcaoDisciplina); //coloca a opçao no datalist
            })
            
        })
        .catch(err => console.error(err));
})      

//Opção de adicionar pergunta no quiz
let formModelo = window.document.getElementById('form-pergunta-1');
let numPerguntas = 1; 

/*Função que gera novo formulario toda vez que o usuario quiser adicioanr uma nova pergunta*/

function NovaQuestao() { 
    numPerguntas++ //controle de quantas perguntas temos
    const novoForm = formModelo.cloneNode(true); //duplica modelo de formulario
    novoForm.id = `form-pergunta-${numPerguntas}` //coloca id personalizado conforme numero da pergunta
    novoForm.querySelectorAll('label')[0].setAttribute('for', `enunciado-${numPerguntas}`)
    //coloca for correto no label de pergunta

    novoForm.querySelector('.numero-pergunta').textContent = numPerguntas + ')';


    //esvazia input de pergunta e coloca id personalizado
    const inputPergunta = novoForm.querySelectorAll('input')[0];
    inputPergunta.id = `enunciado-${numPerguntas}`
    inputPergunta.value = ""

    //esvaziando e colocando ids personalizados em cada radio e input de alternativas
    let inputAlternativas = novoForm.querySelectorAll('input[type=text]')
    let inputRadios = novoForm.querySelectorAll('input[type=radio]')
    
    for (let inicioInput = 1, inicioRadio = 0; inicioInput < inputAlternativas.length; inicioInput++, inicioRadio++) {
            inputAlternativas[inicioInput].id = `alt-${String.fromCharCode(65 + inicioInput)}-${numPerguntas}`
            inputAlternativas[inicioInput].value = ""
            novoForm.querySelectorAll('label')[inicioInput].setAttribute('for', `alt-${String.fromCharCode(65 + inicioInput)}-${numPerguntas}`)
            inputRadios[inicioRadio].id = `radio-${String.fromCharCode(65 + inicioInput)}-${numPerguntas}`
            inputRadios[inicioRadio].checked = false
    }   

    novoForm.querySelector('.explicacao-text').id = `explicacao-${numPerguntas}`


    //coloca novo form no documento
    document.getElementById('formulario_perguntas').appendChild(novoForm);
}


//evento de click no botão de +
window.document.getElementById('add-pergunta').addEventListener('click', () => NovaQuestao())

//Salvar quiz no banco de dados
window.document.getElementById('salvar_quiz').addEventListener('click', () => {
 let todosFormularios = document.querySelectorAll('.form_pergunta');
let semResposta = [];

todosFormularios.forEach((form, index) => {
    const marcado = form.querySelector('[name="radio-alternativa"]:checked');
    if (!marcado) {
        semResposta.push(index + 1); // +1 para o número ser 1, 2, 3... ao invés de 0, 1, 2...
    }
});

if (semResposta.length > 0) {
    alert(`As seguintes perguntas não têm resposta marcada: ${semResposta.join(', ')}`);
    return;
}
    

    let nomeAtividade = document.getElementById('nome-atividade').value
    let nomeDisciplina = document.getElementById('input-disciplina').value

    /*Obrigatoriamente, primeiro precisa salvar a disciplina e a atividade, para
    então salvar as perguntas*/

    fetch('/novoquiz', {
    method: "POST", 
    body: JSON.stringify({
    disciplina: nomeDisciplina,
    tituloQuiz: nomeAtividade,
    randomizar: randomizar
}), 
    headers: {"Content-type": "application/json; charset=UTF-8"}})
    .then(response => response.json())
        .then(data => {
    /*Aqui, do primeiro fetch, pegamos o id do quiz recém gerado,
    pois precisamos deles para vincular as perguntas no bd*/
        const idQuiz = data.idQuiz; 
        const perguntas = document.querySelectorAll('.perguntas_teste');
        const requests = Array.from(perguntas).map(pergunta => {
            const enunciado = pergunta.querySelector('.input_enunciado').value;
            const alt_a = pergunta.querySelector('.alt-a').value;
            const alt_b = pergunta.querySelector('.alt-b').value;
            const alt_c = pergunta.querySelector('.alt-c').value;
            const alt_d = pergunta.querySelector('.alt-d').value;
            let resposta_correta = pergunta.querySelector('[name="radio-alternativa"]:checked')?.value;
            let explicacao = pergunta.querySelector('.explicacao-text').value

            if (!resposta_correta) {
            alert('Marque a alternativa correta de todas as perguntas!');
            return;
            }   
        
        return  fetch('/novasperguntas', {
                    method: "POST", 
                    body: JSON.stringify({
                    idQuiz: idQuiz,
                    enunciado: enunciado,
                    alt_a: alt_a,
                    alt_b: alt_b,
                    alt_c: alt_c,
                    alt_d: alt_d,
                    correto: resposta_correta,
                    explicacao: explicacao 
                    }), 
                    headers: {"Content-type": "application/json; charset=UTF-8"}})
        })

        return Promise.all(requests);

})
.then(resultados => console.log(resultados))
.catch(error => console.error(error));
})

