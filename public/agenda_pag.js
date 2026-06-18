import { criaCardEvento } from '/util.js';

const containerHoje = document.getElementById('eventos-conteudo');
const containerProximos = document.getElementById('proximos-eventos');
const containerDia = document.getElementById('eventos-dia');
const inputData = document.getElementById('input-data');
const btnAnterior = document.getElementById('btn-anterior');
const btnProximo = document.getElementById('btn-proximo');
const infoPagina = document.getElementById('info-pagina');

let paginaAtual = 1;
let totalProximos = 0;
const LIMITE = 10;


let destaque = window.document.getElementById('evento-destaque')

const MESES = [
    'janeiro','fevereiro','março','abril','maio','junho',
    'julho','agosto','setembro','outubro','novembro','dezembro'
];

const DIAS_SEMANA = [
    'dom','seg','ter','qua','qui','sex','sáb'
];

let anoAtual;
let mesAtual;

const hoje = new Date();
const hojeStr = hoje.toISOString().split('T')[0];

function carregaHoje() {
    fetch('/agenda/hoje')
        .then(res => res.json())
        .then(eventos => {  
            containerHoje.innerHTML = '';
            if (eventos.length === 0) {
                containerHoje.innerHTML = '<p>Nenhum evento hoje.</p>';
                return;
            }
            eventos.forEach(entrada => criaCardEvento(entrada, containerHoje));
        })
        .catch(err => console.error(err));
}

function carregaProximos(pagina = 1) {
    fetch(`/agenda/proximos?pagina=${pagina}`)
        .then(res => res.json())
        .then(({ eventos, total }) => {
            containerProximos.innerHTML = '';
            totalProximos = total;
            paginaAtual = pagina;

            if (eventos.length === 0) {
                containerProximos.innerHTML = '<p>Nenhum próximo evento.</p>';
            } else {
                eventos.forEach(entrada => criaCardEvento(entrada, containerProximos));
            }

            atualizaPaginacao();
        })
        .catch(err => console.error(err));
}

function atualizaPaginacao() {
    const totalPaginas = Math.ceil(totalProximos / LIMITE);
    infoPagina.textContent = `Página ${paginaAtual} de ${totalPaginas}`;
    btnAnterior.disabled = paginaAtual === 1;
    btnProximo.disabled = paginaAtual >= totalPaginas;
}

function carregaEventosDia(data) {
    containerDia.innerHTML = '';
    fetch(`/agenda/dia?data=${data}`)
        .then(res => res.json())
        .then(eventos => {
            if (eventos.length === 0) {
                containerDia.innerHTML = '<p>Nenhum evento neste dia.</p>';
                return;
            }
            eventos.forEach(entrada => criaCardEvento(entrada, containerDia));
        })
        .catch(err => console.error(err));
}

function diasNoMes(ano, mes) {
  return new Date(ano, mes + 1, 0).getDate();
}

function primeiroDiaSemana(ano, mes) {
  return new Date(ano, mes, 1).getDay();
}

function renderCalendario(ano, mes) {
  anoAtual = ano;
  mesAtual = mes;
  document.getElementById('cal-titulo').textContent = `${MESES[mes]} de ${ano}`;

  const grid = document.getElementById('cal-grid');
  grid.innerHTML = '';

  DIAS_SEMANA.forEach(d => {
    const el = document.createElement('div');
    el.className = 'cal-weekday';
    el.textContent = d;
    grid.appendChild(el);
  });

  const primeiro = primeiroDiaSemana(ano, mes);
  const total = diasNoMes(ano, mes);

  for (let i = 0; i < primeiro; i++) {
    const vazio = document.createElement('div');
    vazio.className = 'cal-day vazio';
    grid.appendChild(vazio);
  }

  for (let d = 1; d <= total; d++) {
    const el = document.createElement('div');
    el.className = 'cal-day';
    const dataStr = `${ano}-${String(mes+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

    if (dataStr === hojeStr) el.classList.add('hoje');

    const num = document.createElement('span');
    num.textContent = d;
    el.appendChild(num);

    el.addEventListener('click', () => selecionaDia(el, dataStr, d, mes, ano));
    grid.appendChild(el);
  }
}

function selecionaDia(el, dataStr, dia, mes, ano) {
  document.querySelectorAll('.cal-day.selecionado').forEach(e => e.classList.remove('selecionado'));
  el.classList.add('selecionado');

  const titulo = document.getElementById('eventos-titulo');
  const conteudo = document.getElementById('eventos-conteudo');
  titulo.textContent = `Eventos em ${String(dia).padStart(2,'0')}/${String(mes+1).padStart(2,'0')}/${ano}`;
  conteudo.innerHTML = '<span class="loading">Carregando...</span>';

  const btnVoltar = document.createElement('button');
  btnVoltar.className = 'btn-voltar';
  btnVoltar.innerHTML = '← voltar';
  btnVoltar.addEventListener('click', restaurarPadrao);

  fetch(`/agenda/dia?data=${dataStr}`)
    .then(r => r.json())
    .then(eventos => {
      conteudo.innerHTML = '';
      conteudo.appendChild(btnVoltar);
      if (eventos.length === 0) {
        const p = document.createElement('p');
        p.className = 'sem-eventos';
        p.textContent = 'Sem eventos nessa data.';
        conteudo.appendChild(p);
      } else {
      eventos.forEach(ev => {
    criaCardEvento(ev, conteudo);
});
      }
    })
    .catch(() => {
      conteudo.innerHTML = '';
      conteudo.appendChild(btnVoltar);
      const p = document.createElement('p');
      p.className = 'sem-eventos';
      p.textContent = 'Erro ao buscar eventos.';
      conteudo.appendChild(p);
    });
}

function restaurarPadrao() {
  document.querySelectorAll('.cal-day.selecionado').forEach(e => e.classList.remove('selecionado'));
  document.getElementById('eventos-titulo').textContent = 'Eventos de hoje';
  carregaHojeCalendario();
}

function carregaHojeCalendario() {
    const conteudo = document.getElementById('eventos-conteudo');

    conteudo.innerHTML = '<span class="loading">Carregando...</span>';

    fetch('/agenda/hoje')
        .then(r => r.json())
        .then(eventos => {

            conteudo.innerHTML = '';

            if (eventos.length === 0) {
                conteudo.innerHTML =
                    '<p class="sem-eventos">Nenhum evento hoje.</p>';
                return;
            }

            eventos.forEach(ev => {
                criaCardEvento(ev, conteudo);
            });
        })
        .catch(() => {
            conteudo.innerHTML =
                '<p class="sem-eventos">Erro ao carregar eventos.</p>';
        });
}



document.addEventListener('DOMContentLoaded', () => {
    
    carregaHoje();
    carregaProximos();
    renderCalendario(hoje.getFullYear(), hoje.getMonth());
    carregaHojeCalendario();

    inputData.addEventListener('change', () => carregaEventosDia(inputData.value));
    btnAnterior.addEventListener('click', () => carregaProximos(paginaAtual - 1));
    btnProximo.addEventListener('click', () => carregaProximos(paginaAtual + 1));

    document.getElementById('btn-prev').addEventListener('click', () => {
        let m = mesAtual - 1, a = anoAtual;
        if (m < 0) { m = 11; a--; }
        renderCalendario(a, m);
    });

    document.getElementById('btn-next').addEventListener('click', () => {
        let m = mesAtual + 1, a = anoAtual;
        if (m > 11) { m = 0; a++; }
        renderCalendario(a, m);
    });

    fetch('/agenda/destaque')
        .then(res => res.json())
        .then(data => {
            if (data.destaque !== null) {
                destaque.textContent = data.destaque.titulo;
            } else {
                destaque.style.display = 'none';
            }
        })
        .catch(err => console.error(err));

        console.log('cheguei aqui');
        const btnTabCalendario =
    document.getElementById('btn-tab-calendario');

const btnTabLista =
    document.getElementById('btn-tab-lista');

const calendario =
    document.getElementById('calendario-coluna');

const lista =
    document.getElementById('lista-coluna');

calendario.classList.remove('oculto');
lista.classList.add('oculto');

btnTabCalendario.addEventListener('click', () => {

    calendario.classList.remove('oculto');
    lista.classList.add('oculto');

    btnTabCalendario.classList.add('tab-ativa');
    btnTabLista.classList.remove('tab-ativa');
});

btnTabLista.addEventListener('click', () => {

    lista.classList.remove('oculto');
    calendario.classList.add('oculto');

    btnTabLista.classList.add('tab-ativa');
    btnTabCalendario.classList.remove('tab-ativa');
});

});