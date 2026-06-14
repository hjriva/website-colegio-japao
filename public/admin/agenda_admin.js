//Puxa a função do arquivo util.js, para que todos os arquivos apareçam na tela
import { criaCardEvento } from '/util.js';
import { ReqDisciplinas } from '/util.js'

let painelDefault = 0;
//vai ser definido posteriormente conforme definiões de acesso do firebase

let painelAdmin = document.getElementById('painel-admin')
let painelAgendaConteudo = document.getElementById('painel-agenda-conteudo');
let painelAtividadesConteudo = document.getElementById('painel-atividades-conteudo');

let mostrarAtvs = document.getElementById('mostrar-painel-atv')
let mostrarAgenda = document.getElementById('mostrar-painel-agenda')

let adicionarPost = document.getElementById('adicionar-post')
let novoEventoForm = document.getElementById('novo-evento-form')

let paginaAtual = 1;
let totalEventos = 0;
const LIMITE = 10;

const inputBusca = document.getElementById('input-busca');
const inputFiltroData = document.getElementById('filtro-data');
const container = document.getElementById('controle-agenda');

//Declarações de funções:

function toggleElement(element, displayDesejado) {
    if (element.style.display == 'none') {
        element.style.display = displayDesejado
    } else {
        element.style.display = 'none'
    }
}

//Função para editar itens
function editarEntrada(idElem) {
    const ev = document.getElementById(idElem);

    const elTitulo = ev.querySelector('h2');
    const elData = ev.querySelector('.data-evento');
    const elHorario = ev.querySelector('.horario-evento');
    const elDescricao = ev.querySelector('.descr-evento');
    const elImg = ev.querySelector('img');

    const valTitulo = elTitulo.textContent.replace(':', '').trim();
    const valData = elData.textContent.trim();
    const valHorario = elHorario.textContent.trim();
    const valDescricao = elDescricao.textContent.trim();
    const valImg = elImg.getAttribute('src');

    const inputTitulo = Object.assign(document.createElement('input'), { value: valTitulo });

    const inputData = Object.assign(document.createElement('input'), {
        type: 'date',
        value: valData.split(' / ').reverse().join('-')
    });

    const inputHorario = Object.assign(document.createElement('input'), {
        type: 'time',
        value: valHorario.replace('h', ':')
    });

    const inputDescricao = Object.assign(document.createElement('textarea'));
    inputDescricao.value = valDescricao;

    const inputImg = Object.assign(document.createElement('input'), { type: 'file', accept: 'image/*' });

    const preview = Object.assign(document.createElement('img'), { src: valImg, style: 'max-width:100px' });

    inputImg.addEventListener('change', (e) => {
        preview.src = URL.createObjectURL(e.target.files[0]);
    });

    elTitulo.replaceWith(inputTitulo);
    elData.replaceWith(inputData);
    elHorario.replaceWith(inputHorario);
    elDescricao.replaceWith(inputDescricao);
    elImg.replaceWith(inputImg);
    inputImg.after(preview);

    const btnAlterar = ev.querySelector('button');
    btnAlterar.style.display = 'none';

    const btnSalvar = Object.assign(document.createElement('button'), { textContent: 'Salvar' });
    const btnCancelar = Object.assign(document.createElement('button'), { textContent: 'Cancelar' });

    function restaurar(titulo, descricao, imgSrc, data, horario) {
        if (preview.src.startsWith('blob:')) URL.revokeObjectURL(preview.src);

        inputTitulo.replaceWith(Object.assign(document.createElement('h2'), { textContent: titulo + ':' }));
        inputDescricao.replaceWith(Object.assign(document.createElement('p'), { className: 'descr-evento', textContent: descricao }));
        inputImg.replaceWith(Object.assign(document.createElement('img'), { src: imgSrc, className: 'img-evento' }));
        preview.remove();

        const [ano, mes, dia] = data.split('-');
        inputData.replaceWith(Object.assign(document.createElement('p'), { className: 'data-evento', textContent: `${dia} / ${mes} / ${ano}` }));

        inputHorario.replaceWith(Object.assign(document.createElement('p'), { className: 'horario-evento', textContent: horario.replace(':', 'h') }));

        btnAlterar.style.display = '';
        btnSalvar.remove();
        btnCancelar.remove();
    }

    btnSalvar.addEventListener('click', () => {
        const formData = new FormData();
        formData.append('idEntrada', idElem);
        formData.append('titulo', inputTitulo.value);
        formData.append('descricao', inputDescricao.value);
        formData.append('dataPost', inputData.value);
        formData.append('horario', inputHorario.value);
        if (inputImg.files[0]) formData.append('img', inputImg.files[0]);

        fetch('/Alteracao_BD', { method: 'POST', body: formData })
            .then(res => res.json())
            .then(result => {
                restaurar(
                    inputTitulo.value,
                    inputDescricao.value,
                    result.img || valImg,
                    inputData.value,
                    inputHorario.value
                );
            })
            .catch(err => console.error(err));
    });

    btnCancelar.addEventListener('click', () => {
        restaurar(valTitulo, valDescricao, valImg, inputData.value, valHorario.replace('h', ':'));
    });

    ev.append(btnSalvar, btnCancelar);
}

//Função para excluir itens
function excluirEntrada(idElem) {
    fetch('/deletar', {
        method: "POST",
        body: JSON.stringify({ idEntrada: idElem }),
        headers: { "Content-type": "application/json; charset=UTF-8" }
    })
        .then(res => res.json())
        .then(() => {
            const totalPaginas = Math.ceil((totalEventos - 1) / LIMITE);
            const pagina = (paginaAtual > totalPaginas && paginaAtual > 1) ? paginaAtual - 1 : paginaAtual;
            buscar(pagina);
        })
        .catch(error => console.log(error));
}

//Função para inserir novos itens
function InserirNovo() {
    let tituloevento = window.document.getElementById('nome-novo-evento').value
    let ilustraimg = window.document.getElementById('imagem-novo-evento').files[0]
    let descr = window.document.getElementById('desc-novo-evento').value;
    let datapost = window.document.getElementById('data-novo-evento').value;
    let horario = window.document.getElementById('hora-novo-evento').value

    const formData = new FormData();
    formData.append('titulo', tituloevento);
    formData.append('descricao', descr);
    formData.append('data', datapost);
    formData.append('horario', horario);
    if (ilustraimg) {
        formData.append('imagem', ilustraimg);
    }

    fetch('/updateBD', {
        method: "POST",
        body: formData,
    })
        .then(res => res.json())
        .then(data => {
            console.log(data);
            buscar(paginaAtual);
        })
        .catch(error => console.log(error));

    window.document.getElementById('FormularioNovo').reset()
}

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

function buscar(pagina = 1) {
    const termo = inputBusca.value.trim();
    const data = inputFiltroData.value;

    const params = new URLSearchParams();
    if (termo) params.append('termo', termo);
    if (data) params.append('data', data);
    params.append('pagina', pagina);

    container.innerHTML = '';

    fetch(`/agenda/busca?${params}`)
        .then(res => res.json())
        .then(({ eventos, total }) => {
            totalEventos = total;
            paginaAtual = pagina;
            eventos.forEach(entrada => criaCardEvento(entrada, container, acoesAdmin));
            atualizaPaginacaoInterna();
        })
        .catch(err => console.error(err));
}

function atualizaPaginacaoInterna() {
    const totalPaginas = Math.ceil(totalEventos / LIMITE);
    const btnAnterior = document.getElementById('btn-anterior-interno');
    const btnProximo = document.getElementById('btn-proximo-interno');
    const infoPagina = document.getElementById('info-pagina-interna');

    if (totalEventos > LIMITE) {
        btnAnterior.style.display = '';
        btnProximo.style.display = '';
        infoPagina.style.display = '';

        infoPagina.textContent = `Página ${paginaAtual} de ${totalPaginas}`;
        btnAnterior.disabled = paginaAtual === 1;
        btnProximo.disabled = paginaAtual >= totalPaginas;
    } else {
        btnAnterior.style.display = 'none';
        btnProximo.style.display = 'none';
        infoPagina.style.display = 'none';
    }
}

function mostrarPainelAgenda() {
    painelAgendaConteudo.style.display = '';
    painelAtividadesConteudo.style.display = 'none';

    novoEventoForm.style.display = 'none';
    buscar(paginaAtual);
}

// ===== Navegação dentro do painel de atividades =====

function mostrarListaDisciplinas() {
    painelAtividadesConteudo.innerHTML = '';

    const titulo = document.createElement('h2');
    titulo.textContent = 'Disciplinas';
    painelAtividadesConteudo.appendChild(titulo);

    const lista = document.createElement('ul');
    painelAtividadesConteudo.appendChild(lista);

    ReqDisciplinas(lista, acoesAdminDisciplina);
}

function mostrarAtividadesDisciplina(idDisciplina, nomeDisciplina) {
    painelAtividadesConteudo.innerHTML = '';

    const btnVoltar = document.createElement('button');
    btnVoltar.textContent = '← Voltar';
    btnVoltar.addEventListener('click', mostrarListaDisciplinas);
    painelAtividadesConteudo.appendChild(btnVoltar);

    const titulo = document.createElement('h2');
    titulo.textContent = nomeDisciplina;
    painelAtividadesConteudo.appendChild(titulo);

    const lista = document.createElement('ul');
    painelAtividadesConteudo.appendChild(lista);

    fetch(`/disciplina/${idDisciplina}`)
        .then(res => res.json())
        .then(({ atividades }) => {
            atividades.forEach(atv => {
                const li = document.createElement('li');
                const link = document.createElement('a');
                link.href = '#';
                link.textContent = atv.titulo;
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    mostrarAtividade(atv, idDisciplina, nomeDisciplina);
                });
                li.appendChild(link);
                lista.appendChild(li);
            });
        })
        .catch(err => console.error(err));
}

function mostrarAtividade(atv, idDisciplina, nomeDisciplina) {
    painelAtividadesConteudo.innerHTML = '';

    const btnVoltar = document.createElement('button');
    btnVoltar.textContent = '← Voltar';
    btnVoltar.addEventListener('click', () => mostrarAtividadesDisciplina(idDisciplina, nomeDisciplina));
    painelAtividadesConteudo.appendChild(btnVoltar);

    if (atv.tipo === 'quiz') {
        renderizarQuizAdmin(atv.quiz_id, painelAtividadesConteudo);
    } else {
        mostrarAtividadeEstatica(atv.caminho, painelAtividadesConteudo);
    }
}

function mostrarAtividadeEstatica(caminho, container) {
    const iframe = document.createElement('iframe');
    iframe.src = caminho;
    iframe.style.width = '100%';
    iframe.style.height = '70vh';
    iframe.style.border = 'none';
    container.appendChild(iframe);
}

// ===== Edição/exclusão de disciplinas (lista inicial) =====

function acoesAdminDisciplina(li, disc) {
    const link = li.querySelector('.nome-disciplina');
    link.addEventListener('click', (e) => {
        e.preventDefault();
        mostrarAtividadesDisciplina(disc.id, disc.nome_disc);
    });

    const editarBotao = document.createElement('button');
    editarBotao.id = `editar${disc.id}`;
    editarBotao.textContent = 'Editar';
    editarBotao.addEventListener('click', () => editarDisciplina(li, disc));

    const excluirBotao = document.createElement('button');
    excluirBotao.id = `excluir${disc.id}`;
    excluirBotao.textContent = 'Excluir';
    excluirBotao.addEventListener('click', () => excluirDisciplina(disc));

    li.appendChild(editarBotao);
    li.appendChild(excluirBotao);
}

function editarDisciplina(li, disc) {
    const elLink = li.querySelector('.nome-disciplina');
    const valorAtual = elLink.textContent;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = valorAtual;
    elLink.replaceWith(input);

    const btnEditar = li.querySelector(`#editar${disc.id}`);
    const btnExcluir = li.querySelector(`#excluir${disc.id}`);
    btnEditar.style.display = 'none';
    btnExcluir.style.display = 'none';

    const btnSalvar = document.createElement('button');
    btnSalvar.textContent = 'Salvar';

    const btnCancelar = document.createElement('button');
    btnCancelar.textContent = 'Cancelar';

    function restaurar(nomeFinal) {
        const novoLink = document.createElement('a');
        novoLink.href = `/atividades/disciplinas.html?id=${disc.id}`;
        novoLink.textContent = nomeFinal;
        novoLink.classList.add('nome-disciplina');
        novoLink.addEventListener('click', (e) => {
            e.preventDefault();
            mostrarAtividadesDisciplina(disc.id, disc.nome_disc);
        });

        input.replaceWith(novoLink);

        btnEditar.style.display = '';
        btnExcluir.style.display = '';
        btnSalvar.remove();
        btnCancelar.remove();
    }

    btnSalvar.addEventListener('click', () => {
        const novoNome = input.value.trim();
        if (!novoNome) return;

        fetch('/atualizarDisciplina', {
            method: 'POST',
            headers: { 'Content-type': 'application/json; charset=UTF-8' },
            body: JSON.stringify({ id: disc.id, nome_disc: novoNome })
        })
            .then(res => res.json())
            .then(() => {
                disc.nome_disc = novoNome;
                restaurar(novoNome);
            })
            .catch(err => console.error(err));
    });

    btnCancelar.addEventListener('click', () => {
        restaurar(valorAtual);
    });

    li.append(btnSalvar, btnCancelar);
}

function excluirDisciplina(disc) {
    alert('teste excluir ' + disc.id);
}

// ===== Renderização do quiz (admin) =====

function renderizarQuizAdmin(idQuiz, container) {
    fetch(`/quiz/${idQuiz}`)
        .then(res => res.json())
        .then(({ quiz, questoes }) => {

            const tituloDiv = document.createElement('div');
            tituloDiv.classList.add('titulo-quiz-admin');

            const inputTitulo = document.createElement('input');
            inputTitulo.type = 'text';
            inputTitulo.value = quiz.titulo;

            const btnSalvarTitulo = document.createElement('button');
            btnSalvarTitulo.textContent = 'Salvar título';
            btnSalvarTitulo.addEventListener('click', () => {
                fetch('/atualizarTituloQuiz', {
                    method: 'POST',
                    headers: { 'Content-type': 'application/json' },
                    body: JSON.stringify({ idAtividade: quiz.atividade_id, titulo: inputTitulo.value })
                })
                    .then(res => res.json())
                    .then(() => btnSalvarTitulo.textContent = 'Salvo ✓')
                    .catch(err => console.error(err));
            });

            tituloDiv.append(inputTitulo, btnSalvarTitulo);
            container.appendChild(tituloDiv);

            questoes.forEach(q => criaCardPerguntaAdmin(q, container));
        })
        .catch(err => console.error(err));
}

function criaCardPerguntaAdmin(questao, container) {
    const card = document.createElement('div');
    card.classList.add('pergunta-admin');

    const inputPergunta = document.createElement('textarea');
    inputPergunta.value = questao.pergunta;
    inputPergunta.placeholder = 'Enunciado da pergunta';

    function criarLinhaAlternativa(letra, valor) {
        const linha = document.createElement('div');

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = `correta-${questao.id}`;
        radio.value = letra;
        if (questao.resposta_correta === letra) radio.checked = true;

        const input = document.createElement('input');
        input.type = 'text';
        input.value = valor;

        linha.append(radio, input);
        return { linha, input, radio };
    }

    const altA = criarLinhaAlternativa('A', questao.alternativa_a);
    const altB = criarLinhaAlternativa('B', questao.alternativa_b);
    const altC = criarLinhaAlternativa('C', questao.alternativa_c);
    const altD = criarLinhaAlternativa('D', questao.alternativa_d);

    const inputExplicacao = document.createElement('textarea');
    inputExplicacao.value = questao.explicacao || '';
    inputExplicacao.placeholder = 'Explicação';

    const btnSalvar = document.createElement('button');
    btnSalvar.textContent = 'Salvar pergunta';
    btnSalvar.addEventListener('click', () => {
        const correta = [altA, altB, altC, altD].find(a => a.radio.checked)?.radio.value;

        fetch('/atualizarPergunta', {
            method: 'POST',
            headers: { 'Content-type': 'application/json' },
            body: JSON.stringify({
                id: questao.id,
                pergunta: inputPergunta.value,
                alt_a: altA.input.value,
                alt_b: altB.input.value,
                alt_c: altC.input.value,
                alt_d: altD.input.value,
                correto: correta,
                explicacao: inputExplicacao.value
            })
        })
            .then(res => res.json())
            .then(() => btnSalvar.textContent = 'Salvo ✓')
            .catch(err => console.error(err));
    });

    const btnExcluir = document.createElement('button');
    btnExcluir.textContent = 'Excluir pergunta';
    btnExcluir.addEventListener('click', () => {
        if (!confirm('Tem certeza que deseja excluir essa pergunta?')) return;

        fetch('/deletarPergunta', {
            method: 'POST',
            headers: { 'Content-type': 'application/json' },
            body: JSON.stringify({ id: questao.id })
        })
            .then(res => res.json())
            .then(() => card.remove())
            .catch(err => console.error(err));
    });

    card.append(
        inputPergunta,
        altA.linha, altB.linha, altC.linha, altD.linha,
        inputExplicacao,
        btnSalvar,
        btnExcluir
    );
    container.appendChild(card);
}

function mostrarPainelAtvs() {
    painelAgendaConteudo.style.display = 'none';
    painelAtividadesConteudo.style.display = '';

    mostrarListaDisciplinas();
}

document.addEventListener('DOMContentLoaded', () => {
    inputBusca.addEventListener('input', () => buscar(1));
    inputFiltroData.addEventListener('change', () => buscar(1));
    document.getElementById('btn-anterior-interno').addEventListener('click', () => buscar(paginaAtual - 1));
    document.getElementById('btn-proximo-interno').addEventListener('click', () => buscar(paginaAtual + 1));

    if (painelDefault == 0) {
        mostrarPainelAgenda();
    } else if (painelDefault == 1) {
        mostrarPainelAtvs();
    } else {
        painelAdmin.textContent = 'Permissões não definidas.';
    }
});

//Chamando função InserirNovo() no botão de salvar
window.document.getElementById('salvar-post').addEventListener('click', () => { InserirNovo() })

//Adiciona o toggle de display do formulário
adicionarPost.addEventListener('click', () => toggleElement(novoEventoForm, 'block'))

mostrarAgenda.addEventListener('click', () => {
    mostrarPainelAgenda()
})

mostrarAtvs.addEventListener('click', () => {
    mostrarPainelAtvs()
})