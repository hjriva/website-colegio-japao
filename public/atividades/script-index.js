import { ReqDisciplinas } from '/util.js';

const container = document.getElementById('container-atividades');

function mostrarListaDisciplinas() {
    container.innerHTML = '';

    const titulo = document.createElement('h2');
    titulo.textContent = 'Disciplinas';
    container.appendChild(titulo);

    const lista = document.createElement('ul');
    container.appendChild(lista);

    ReqDisciplinas(lista, (li, disc) => {
        const link = li.querySelector('.nome-disciplina');
        link.addEventListener('click', (e) => {
            e.preventDefault();
            mostrarAtividadesDisciplina(disc.id, disc.nome_disc);
        });
    });
}

function mostrarAtividadesDisciplina(idDisciplina, nomeDisciplina) {
    container.innerHTML = '';

    const btnVoltar = document.createElement('button');
    btnVoltar.textContent = '← Voltar';
    btnVoltar.addEventListener('click', mostrarListaDisciplinas);
    container.appendChild(btnVoltar);

    const titulo = document.createElement('h2');
    titulo.textContent = nomeDisciplina;
    container.appendChild(titulo);

    const lista = document.createElement('ul');
    container.appendChild(lista);

    fetch(`/disciplina/${idDisciplina}`)
        .then(res => res.json())
        .then(({ atividades }) => {
            atividades.forEach(atv => {
                const li = document.createElement('li');
                const link = document.createElement('a');
                link.textContent = atv.titulo;
                link.target = '_blank';

                if (atv.tipo === 'quiz') {
                    link.href = `/atividades/quiz.html?id=${atv.quiz_id}`;
                } else {
                    link.href = atv.caminho;
                }

                li.appendChild(link);
                lista.appendChild(li);
            });
        })
        .catch(err => console.error(err));
}

document.addEventListener('DOMContentLoaded', () => {
    mostrarListaDisciplinas();
});