
//Puxa a função do arquivo util.js, para que todos os arquivos apareçam na tela
import { criaCardEvento } from '/util.js';

//Declarações de funções:
//Função para editar itens
function editarEntrada(idElem) {
    const ev = document.getElementById(idElem);

    const campos = [
        {
            el: ev.querySelector('h2'),
            get: el => el.textContent.replace(':', '').trim(),
            set: (input, val) => Object.assign(document.createElement('h2'), { textContent: val + ':' })
        },
        {
            el: ev.querySelector(':scope > p'),
            get: el => el.textContent,
            set: (input, val) => Object.assign(document.createElement('p'), { textContent: val }),
            criar: (val) => Object.assign(document.createElement('textarea'), { value: val })
        },
        {
            el: ev.querySelector('img'),
            get: el => el.getAttribute('src'),
            set: (input, val) => Object.assign(document.createElement('img'), { src: val })
        },
        {
            el: ev.querySelector('.ev_Titulo p'),
            get: el => el.textContent.trim(),
            set: (input, val) => Object.assign(document.createElement('p'), { textContent: val })
        }
    ];

 const inputs = campos.map(({ el, get, criar }, i) => {
        const input = i === 2
            ? document.createElement('input')
            : criar ? criar(get(el)) : Object.assign(document.createElement('input'), { value: get(el) });

        if (i === 2) {
            input.type = 'file';
            input.accept = 'image/*';
            input.addEventListener('change', (e) => {
                preview.src = URL.createObjectURL(e.target.files[0]);
            });
        }

        el.replaceWith(input);
        return input;
    });

    // Preview da imagem fica visível ao lado do file input
    const preview = Object.assign(document.createElement('img'), {
        src: campos[2].get(campos[2].el) // src original
    });
    inputs[2].after(preview);

    const [inputTitulo, inputDescricao, inputImg, inputData] = inputs;

    function restaurar(valoresNovos) {
        URL.revokeObjectURL(preview.src); // libera memória do blob se houver
        preview.remove();
        campos.forEach(({ set }, i) => {
            inputs[i].replaceWith(set(inputs[i], valoresNovos[i]));
        });
        btnAlterar.style.display = '';
        btnSalvar.remove();
        btnCancelar.remove();
    }

    const btnAlterar = ev.querySelector('button');
    btnAlterar.style.display = 'none';

    const btnSalvar = Object.assign(document.createElement('button'), { textContent: 'Salvar' });
    btnSalvar.addEventListener('click', () => {
    const formData = new FormData();
    formData.append('idEntrada', idElem);
    formData.append('nome', inputTitulo.value);
    formData.append('descricao', inputDescricao.value);
    formData.append('dataPost', inputData.value);
    if (inputImg.files[0]) formData.append('img', inputImg.files[0]);

    fetch('/Alteracao_BD', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(result => {
        // usa o caminho retornado pelo backend, ou mantém o src original
        const novoSrc = result.img ? result.img : campos[2].get(campos[2].el);

        restaurar([
            inputTitulo.value,
            inputDescricao.value,
            novoSrc,
            inputData.value
        ]);
    })
    .catch(err => console.error(err));
});

    const btnCancelar = Object.assign(document.createElement('button'), { textContent: 'Cancelar' });
    btnCancelar.addEventListener('click', () => restaurar(campos.map(({ el, get }) => get(el))));

    ev.append(btnSalvar, btnCancelar);
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

    window.document.getElementById('FormularioNovo').reset()
    //Para limpar o formulário
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

//Chama ambas as funções acoesAdmin e criaCardEvento, no carregamento da página
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('controleAgenda');

    fetch('/agenda')
        .then(res => res.json())
        .then(data => data.forEach(entrada => criaCardEvento(entrada, container, acoesAdmin)))
        .catch(err => console.error(err));
});



//Chamando função InserirNovo() no botão de salvar
window.document.getElementById('InsertValue').addEventListener('click', () => {InserirNovo()})