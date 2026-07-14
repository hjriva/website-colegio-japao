import { ReqDisciplinas } from '/util.js';
import { ReqDisciplinasSelect } from '/util.js';

const container = document.getElementById('container-atividades');
const container_atvs = document.getElementById('atividades_display');
const titulo = document.getElementById('h1-atividades');

function renderizarDisciplinas() {
    const container = document.getElementById('container-atividades');
    container.innerHTML = '';

    const isMobile = window.innerWidth < 1020;
console.log('largura:', window.innerWidth, 'isMobile:', isMobile);
    if (isMobile) {
        const select = document.createElement('select');
        select.addEventListener('change', () => {
    const id = select.value;
    const nome = select.options[select.selectedIndex].text;
    if (id) mostrarAtividadesDisciplina(id, nome);
});
        container.appendChild(select);
        container.style.display = 'flex';
        ReqDisciplinasSelect(select);
    } else {
        container.style.display = '';
        mostrarListaDisciplinas();
    }
}

function mostrarListaDisciplinas() {
    const lista = document.createElement('ul');
    lista.id = 'listadisciplinas';
    container.appendChild(lista);

    ReqDisciplinas(lista, (li, disc) => {
        const link = li.querySelector('.nome-disciplina');
        link.addEventListener('click', (e) => {
            e.preventDefault();
            mostrarAtividadesDisciplina(disc.id, disc.nome_disc);
        });
    });
}

function criarGridComScroll(atividades) {
    const container = document.getElementById('atividades_display');
    container.innerHTML = '';

    // ✅ reinsere o botão voltar se existir
    if (container._btnVoltar) {
        container.appendChild(container._btnVoltar);
    }

    const grid = document.createElement('div');
    grid.classList.add('grid-atividades');
    container.appendChild(grid);

    let index = 0;
    const porVez = 9;

    function carregarMais() {
        const slice = atividades.slice(index, index + porVez);
        slice.forEach(atv => {
    const div = document.createElement('div');
    div.classList.add('atividade');

    // ✅ background com a imagem da disciplina
    if (atv.imagem_disciplina) {
      div.style.backgroundImage = `
    linear-gradient(
        to bottom,
        rgba(0,0,0,0.1) 0%,
        rgba(0,0,0,0.3) 70%,
        rgba(0,0,0,0.85) 100%
        
    ),
    url('/${atv.imagem_disciplina}')
`;
        div.style.backgroundSize = 'cover';
        div.style.backgroundPosition = 'center';
    }

    const href = atv.tipo === 'quiz'
        ? `/atividades/quiz.html?id=${atv.quiz_id}`
        : atv.caminho;

    div.innerHTML = `<a href="${href}" target="_blank"><h3>${atv.titulo}</h3></a>`;
    grid.appendChild(div);
});
        index += porVez;

        // ✅ se ainda tem mais, adiciona sentinela para o observer observar
        if (index < atividades.length) {
            const sentinela = document.createElement('div');
            sentinela.classList.add('sentinela');
            grid.appendChild(sentinela);
            observer.observe(sentinela);
        }
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                observer.unobserve(entry.target);
                entry.target.remove();
                carregarMais();
            }
        });
    }, { threshold: 0.1 });

    carregarMais(); // carrega os primeiros 9
}

function exibirAtividades(atividades) {
    document.getElementById('atividades_display')._btnVoltar = null;
    criarGridComScroll(atividades);
}

function mostrarAtividadesDisciplina(idDisciplina, nomeDisciplina) {
    container_atvs.innerHTML = '';
    titulo.textContent = `Atividades interativas > ${nomeDisciplina}`;

    const btnVoltar = document.createElement('a');
    btnVoltar.textContent = '← Voltar';
    btnVoltar.href = '#';
    btnVoltar.style.cssText = 'display:inline-block; margin-bottom:12px; color:gray; text-decoration:none; font-size:0.9rem;';
    btnVoltar.addEventListener('click', (e) => {
        e.preventDefault();
        titulo.textContent = 'Atividades interativas';
        fetch('/atividadesdisplay')
            .then(res => res.json())
            .then(data => {
                console.log('atividadesdisplay retornou:', data);
                exibirAtividades(data)}
             )
             .catch(err => console.error('erro no fetch inicial:', err));
            
    });
    container_atvs.appendChild(btnVoltar);
    container_atvs._btnVoltar = btnVoltar;

    fetch(`/disciplina/${idDisciplina}`)
        .then(res => res.json())
        .then(({ atividades }) => criarGridComScroll(atividades))
        .catch(err => console.error(err));
}

document.addEventListener('DOMContentLoaded', () => {
    renderizarDisciplinas();

    let larguraAnterior = window.innerWidth;
    window.addEventListener('resize', () => {
        const cruzouLimite = (larguraAnterior < 1020) !== (window.innerWidth < 1020);
        if (cruzouLimite) {
            renderizarDisciplinas();
        }
        larguraAnterior = window.innerWidth;
    });

    fetch('/atividadesdisplay')
        .then(res => res.json())
        .then(data => exibirAtividades(data));
});

window.document.querySelector('.btn-login').addEventListener('click', () => {
    window.location.href = '/admin';
});