// Função para criar elementos dentro de cada evento da agenda
export function criaElemento(tag, texto, atributo, valorAtributo, pai, className) {
    const elem = document.createElement(tag);
    if (texto !== null) elem.textContent = texto;
    if (atributo !== null) elem.setAttribute(atributo, valorAtributo);
    elem.classList.add(className);
    pai.appendChild(elem);
    return elem; // retornar permite encadear se precisar
}

// Função para puxar dados do BD e colocar nos elementos criados na função CriaElemento
export function criaCardEvento(entrada, container, acoes = null) {
    console.log(entrada)
    const ev = document.createElement('div');
    ev.classList.add('eventos-agenda');
    ev.setAttribute('id', `${entrada.identrada}`);
    container.appendChild(ev);

    const evHeader = document.createElement('div');
    evHeader.classList.add('evento-header-div');
    ev.appendChild(evHeader);

    const evTitulo = document.createElement('div');
    evTitulo.setAttribute('class', 'evento-titulo-div');
    evHeader.appendChild(evTitulo);

    criaElemento('img', null, 'src', `${entrada.img}`, evHeader, 'img-evento');
    criaElemento('h3', `${entrada.titulo}`, null, null, evTitulo, 'titulo-vento');
    criaElemento('p', `${entrada.dia} / ${entrada.mes} / ${entrada.ano} ${entrada.horario.slice(0, 5).replace(':', 'h')}`, null, null, evTitulo, 'horario-data-evento');
    criaElemento('p', entrada.descricao, null, null, evTitulo, 'descr-evento');

    // se acoes for passado, renderiza os botões - para usar somente no painel interno
    if (acoes) acoes(ev, entrada);
}


//adaptado do Claude


export function ReqDisciplinas(div, acoes = null) {
    fetch('/disciplinas')
        .then(res => res.json())
        .then(data => {
            data.forEach(disc => {
                const li = document.createElement('li');
                li.id = `disciplina${disc.id}`;

                const link = document.createElement('a');
                link.href = `/atividades/disciplinas.html?id=${disc.id}`;
                link.textContent = disc.nome_disc;
                link.classList.add('nome-disciplina');
                li.appendChild(link);

                div.appendChild(li);

                // se acoes for passado, renderiza os botões - só pro painel admin
                if (acoes) acoes(li, disc);
            });
        })
        .catch(err => console.error(err));
}