
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

// Claude
const inputBusca = document.getElementById('input-busca');
const inputFiltroData = document.getElementById('filtro-data');
const container = document.getElementById('controle-agenda');

//Declarações de funções:
/*Função para criar o efeito de sumir e desaparecer de alguns elementos conforme botão, 
será aplciado no formulario de novo evento*/
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

    // Captura os elementos e seus valores ANTES de qualquer alteração
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

    // Cria os inputs
    const inputTitulo = Object.assign(document.createElement('input'), { value: valTitulo });

    const inputData = Object.assign(document.createElement('input'), {
        type: 'date',
        value: valData.split(' / ').reverse().join('-') // "18 / 06 / 2026" → "2026-06-18"
    });

    const inputHorario = Object.assign(document.createElement('input'), {
        type: 'time',
        value: valHorario.replace('h', ':') // "10h00" → "10:00"
    });

    const inputDescricao = Object.assign(document.createElement('textarea'));
    inputDescricao.value = valDescricao;

    const inputImg = Object.assign(document.createElement('input'), { type: 'file', accept: 'image/*' });

    const preview = Object.assign(document.createElement('img'), { src: valImg, style: 'max-width:100px' });

    inputImg.addEventListener('change', (e) => {
        preview.src = URL.createObjectURL(e.target.files[0]);
    });

    // Substitui elementos pelos inputs
    elTitulo.replaceWith(inputTitulo);
    elData.replaceWith(inputData);
    elHorario.replaceWith(inputHorario);
    elDescricao.replaceWith(inputDescricao);
    elImg.replaceWith(inputImg);
    inputImg.after(preview);

    // Troca botão Alterar por Salvar
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

        // Restaura data formatada "2026-06-18" → "18 / 06 / 2026"
        const [ano, mes, dia] = data.split('-');
        inputData.replaceWith(Object.assign(document.createElement('p'), { className: 'data-evento', textContent: `${dia} / ${mes} / ${ano}` }));

        // Restaura horário formatado "10:00" → "10h00"
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
            // Se era o único item da página (e não é a primeira), volta uma página
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
            buscar(paginaAtual); // recarrega a página atual com a lista atualizada
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

// Claude
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
    buscar(paginaAtual); // recarrega a lista quando volta pro painel
}

function mostrarPainelAtvs() {
    painelAgendaConteudo.style.display = 'none';
    painelAtividadesConteudo.style.display = '';

    // só popula a lista de disciplinas na primeira vez
    if (!painelAtividadesConteudo.dataset.carregado) {
        const lista = document.createElement('ul');
        painelAtividadesConteudo.appendChild(lista);
        ReqDisciplinas(lista);
        painelAtividadesConteudo.dataset.carregado = 'true';
    }
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

//Chama ambas as funções acoesAdmin e criaCardEvento, no carregamento da página


//Chamando função InserirNovo() no botão de salvar
window.document.getElementById('salvar-post').addEventListener('click', () => {InserirNovo()})

//Adiciona o toggle de display do formulário
adicionarPost.addEventListener('click', () => toggleElement(novoEventoForm, 'block'))

mostrarAgenda.addEventListener('click', () => {
    mostrarPainelAgenda()
})

mostrarAtvs.addEventListener('click', () => {
    mostrarPainelAtvs()
})