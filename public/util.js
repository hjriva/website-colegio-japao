export function criaElemento(tag, texto, atributo, valorAtributo, pai) {
    const elem = document.createElement(tag);
    if (texto !== null) elem.textContent = texto;
    if (atributo !== null) elem.setAttribute(atributo, valorAtributo);
    pai.appendChild(elem);
    return elem; // retornar permite encadear se precisar
}

export function criaCardEvento(entrada, container, acoes = null) {
    const ev = document.createElement('div');
    ev.classList.add('eventos_agenda');
    ev.setAttribute('id', `${entrada.identrada}`);
    container.appendChild(ev);

    const evHeader = document.createElement('div');
    evHeader.classList.add('ev_Header');
    ev.appendChild(evHeader);

    const evTitulo = document.createElement('div');
    evTitulo.setAttribute('class', 'ev_Titulo');
    evHeader.appendChild(evTitulo);

    criaElemento('img', null, 'src', '/imgs/foto.png', evHeader);
    criaElemento('h2', `${entrada.titulo}:`, null, null, evTitulo);
    criaElemento('p', `${entrada.dia} / ${entrada.mes} / ${entrada.ano}`, null, null, evTitulo);
    criaElemento('p', entrada.descricao, null, null, ev);

    // se acoes for passado, renderiza os botões
    if (acoes) acoes(ev, entrada);
}