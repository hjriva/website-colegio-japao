import { ReqDisciplinas } from '../../util.js';

const elementoPai = document.getElementById('lista-disciplinas');

//Função para editar o nome da disciplina
function editarDisciplina(li, disc) {
    const elLink = li.querySelector('.nome-disciplina');
    const valorAtual = elLink.textContent;

    // Cria o input no lugar do link
    const input = document.createElement('input');
    input.type = 'text';
    input.value = valorAtual;
    elLink.replaceWith(input);

    // Esconde os botões editar/excluir originais
    const btnEditar = li.querySelector(`#editar${disc.id}`);
    const btnExcluir = li.querySelector(`#excluir${disc.id}`);
    btnEditar.style.display = 'none';
    btnExcluir.style.display = 'none';

    // Cria botões salvar/cancelar
    const btnSalvar = document.createElement('button');
    btnSalvar.textContent = 'Salvar';

    const btnCancelar = document.createElement('button');
    btnCancelar.textContent = 'Cancelar';

    function restaurar(nomeFinal) {
        const novoLink = document.createElement('a');
        novoLink.href = `/atividades/disciplinas.html?id=${disc.id}`;
        novoLink.textContent = nomeFinal;
        novoLink.classList.add('nome-disciplina');

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
                disc.nome_disc = novoNome; // atualiza o objeto local
                restaurar(novoNome);
            })
            .catch(err => console.error(err));
    });

    btnCancelar.addEventListener('click', () => {
        restaurar(valorAtual);
    });

    li.append(btnSalvar, btnCancelar);
}

//Função para excluir disciplina (por enquanto só alerta, pra testar)
function excluirDisciplina(disc) {
    alert('teste excluir ' + disc.id);
}

//só deve estar disponível para diretores e vices
function acoesAdmin(li, disc) {
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

document.addEventListener('DOMContentLoaded', () => {
    ReqDisciplinas(elementoPai, acoesAdmin);
});