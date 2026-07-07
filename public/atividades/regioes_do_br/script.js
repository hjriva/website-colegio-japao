//variáveis e funções do game
const container = document.getElementById("regioes-container"); //div onde ficarão os inputs
let dadosRegioes = [];
let resultado = window.document.getElementById("resultado"); //div para mostrar o resultado

let botaoJogar = window.document.getElementById("play-btn");
let botaoDesistir = window.document.getElementById("quit-btn");
let desistiuStatus = false;

//Essa função serve para validar o estado, não importa se o usuário digitar tudo maiusculo ou minusculo
function normalizarResposta(str) {
  return (
    str
      .toLowerCase() //deixa em minusculo para comparacao
      .normalize("NFD") //isola caracteres especiais como til e cedilha
      .replace(/[\u0300-\u036f]/g, "")
      //substitui esses caractere especiais por um nada - ou seja, os remove
      //o parametro é um regex, que usa como referência o catalogo unicode universal
      // https://en.wikipedia.org/wiki/List_of_Unicode_characters#Combining_marks
      //https://unicode.org/charts/ - Combining Diacritical Marks
      .trim()
  ); //retira espaços em branco ao redor da string
}

function colorirEstado(siglaEstado, siglaRegiao) {
  if (!svgMapa) return;
  const cor = CORES_REGIOES[siglaRegiao]?.acerto ?? "#27ae60";
  const path = svgMapa.select(`path[data-estado="${siglaEstado}"]`);
  if (path.empty()) return;

  path.transition().duration(600).attr("fill", cor);

  const srEl = document.getElementById("mapa-sr-status");
  if (srEl) srEl.textContent = `${siglaEstado} correto!`;
}

function verificarConclusao() {
  const totalEstados = dadosRegioes.reduce(
    (soma, r) => soma + r.estados.length,
    0,
  );
  const totalAcertos = document.querySelectorAll("li.advinhado").length;

  dadosRegioes.forEach((regiao) => {
    const acertos = document.querySelectorAll(
      `#lista-${regiao.id_sigla} li.advinhado`,
    ).length;
    if (acertos === regiao.estados.length) {
      colorirRegiao(regiao.id_sigla);
    }
  });

  if (totalAcertos === totalEstados) {
    resultado.style.display = "block";
    resultado.innerHTML = "Parabéns! Você acertou todas as UFs!";
    pausarCron();
  } else if (desistiuStatus === true) {
    resultado.style.display = "block";
    resultado.innerHTML = `Você acertou ${totalAcertos} de ${totalEstados}!`;
    pausarCron();
  }
}
function criarMsgErro(msg, sigla) {
  document.querySelectorAll(".msg-erro").forEach((msg) => {
    msg.remove();
  });
  const erro = document.createElement("p");
  erro.classList.add("msg-erro");
  erro.textContent = msg;
  document.getElementById(`div-${sigla}`).appendChild(erro);
  //setTimeout(() => erro.style.display = 'none', 1500)
}

function listarEstados(match, lista, classe) {
  const item = document.createElement("li"); //cria um item na lista
  item.classList.add(classe);
  item.textContent = match.nome_estado; //coloca o nome do estado, como está no db, no conteudo de texto
  item.dataset.sigla = match.id_sigla; //cria nesse li um atributo personalizado (sigla) que recebe o id da sigla
  lista.appendChild(item); //coloca esse li na lista
}

function tentarAdicionar(sigla) {
  const input = document.getElementById("input-" + sigla); //compara com o input correto
  const valor = input.value.trim();
  if (!valor) return; //não permite validação de uma entrada vazia (só com espaços)

  const regiao = dadosRegioes.find((r) => r.id_sigla === sigla);
  //procura as regiões retornadas do BD e pega aquela cuja sigla é a mesma do input selecionado

  const match = regiao.estados.find(
    (e) => normalizarResposta(e.nome_estado) === normalizarResposta(valor) ||
    normalizarResposta(e.id_sigla) === normalizarResposta(valor),
  ); //Aqui eu optei por validar somente se for digitado o nome completo do estado, mas é possível validar pela sigla também

  /*A const match compara o valor adicionado no input com cada estado daquela região, retornando o primeiro
  resultado encontrado. se não encontra resultado, fica undefined
  */

  if (!match) {
    //alert(`"${valor}" não é um estado desta região.`);
    //window.document.getElementById(`div-${sigla}`).innerHTML+= `"${valor}" não é um estado desta região.`

    criarMsgErro(`"${valor}" não é um estado desta região.`, sigla);
    input.value = "";
    return;
  }

  const lista = document.getElementById("lista-" + sigla);
  const jaExiste = lista.querySelector(`[data-sigla="${match.id_sigla}"]`);
  if (jaExiste) {
    criarMsgErro(`${match.nome_estado} já foi adicionado!`, sigla);
    input.value = "";
    return;
  } //caso em que o valor submetido já foi submetido

  //caso em que submete de forma válida:
  listarEstados(match, lista, "advinhado");
  colorirEstado(match.id_sigla, sigla);
  //retira as mensagens de erro, se houverem
  document.querySelectorAll(".msg-erro").forEach((msg) => {
    msg.remove();
  });
  input.value = ""; //esvazia o input
  verificarConclusao(); //verifica andamento do game
}

//variáveis e funções do cronometro

let hour = 0;
let minute = 0;
let second = 0;
let millisecond = 0;

let cron;

//altera os minutos, segundos, horas etc na tela
function timer() {
  if ((millisecond += 10) == 1000) {
    millisecond = 0;
    second++;
  }
  if (second == 60) {
    second = 0;
    minute++;
  }
  if (minute == 60) {
    minute = 0;
    hour++;
  }
  document.getElementById("hour").innerText = returnData(hour);
  document.getElementById("minute").innerText = returnData(minute);
  document.getElementById("second").innerText = returnData(second);
  document.getElementById("millisecond").innerText = returnData(millisecond);
}

function returnData(input) {
  return input >= 10 ? input : `0${input}`;
}

function comecarCron() {
  desistiuStatus = false;
  resultado.style.display = "none";
  resultado.innerHTML = " ";
  botaoJogar.style.display = "none";
  document
    .querySelector("#atividade_container")
    .querySelectorAll("li")
    .forEach((li) => {
      li.remove();
    });

  resetCron();

  // pra tirar depois do gabarito
  document.querySelectorAll(".botaoinput").forEach((div) => {
    div.style.display = "flex";
  });

  cron = setInterval(() => {
    timer();
  }, 10); //chama a função timer a cada 10ms
  let inputs = window.document.querySelectorAll(".inputEstado");
  inputs.forEach((inp) => (inp.readOnly = false));
  botaoDesistir.style.display = "block";
  resetarMapa();
}

function DesistirSessao() {
  desistiuStatus = true;
  botaoDesistir.style.display = "none";
  botaoJogar.value = "Tentar novamente";
  botaoJogar.style.display = "inline-flex";
  verificarConclusao();
  document.querySelectorAll(".inputEstado").forEach((input) => {
    input.readOnly = true;
    // pra tirar depois do gabarito
    document.querySelectorAll(".botaoinput").forEach((div) => {
      div.style.display = "none";
    });
  });
 // dadosRegioes.forEach((reg) => revelarGabaritoRegiao(reg.id_sigla));
}

function pausarCron() {
  clearInterval(cron);
}

function resetCron() {
  hour = 0;
  minute = 0;
  second = 0;
  millisecond = 0;
  document.getElementById("hour").innerText = "00";
  document.getElementById("minute").innerText = "00";
  document.getElementById("second").innerText = "00";
  document.getElementById("millisecond").innerText = "000";
}

//Código principal
const fetchRegioes = fetch("/regioes")
  .then((res) => res.json())
  .then((regioes) => {
    regioes.forEach((r) => (r.id_sigla = r.id_sigla.trim()));

    dadosRegioes = regioes;
    console.log(dadosRegioes);

    regioes.forEach((regiao) => {
      //Criando uma div para cada região, com elementos para o jogo]
      const sigla = regiao.id_sigla.trim();

      const div = document.createElement("div");
      div.id = `div-${sigla}`;
      div.classList.add("regioes-divs");

      const titulo = document.createElement("h2");
      titulo.textContent = regiao.nome_regiao;

      const lista = document.createElement("ul");
      lista.id = `lista-${sigla}`;

      const input = document.createElement("input");
      input.type = "text";
      input.readOnly = true;
      input.classList.add("inputEstado");
      input.id = `input-${sigla}`;
      input.placeholder = "Digite um estado...";

      const divWrapper = document.createElement("div");
      divWrapper.classList.add("botaoinput");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.innerHTML = `<i class="fa-solid fa-check"></i>`;
      btn.classList.add("btn-confirmar");
      btn.addEventListener("click", () => tentarAdicionar(sigla));

      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault(); // impede o comportamento padrão de pular para o próximo no mobile
          tentarAdicionar(sigla);
        }
      });

      div.appendChild(titulo);
      div.appendChild(lista);
      divWrapper.appendChild(input);
      divWrapper.appendChild(btn);
      div.appendChild(divWrapper);
      container.appendChild(div);
    });

    botaoDesistir.addEventListener("click", function () {
      DesistirSessao();
      regioes.forEach((reg) => {
        const lista = document.getElementById("lista-" + reg.id_sigla);
       reg.estados.forEach((estados) => {
  const jaExiste = lista.querySelector(`[data-sigla="${estados.id_sigla}"]`);
  if (!jaExiste) {
    listarEstados(estados, lista, "gabarito");     // restaura a listagem
    revelarGabaritoEstado(estados.id_sigla);        // usa o parâmetro certo
  }
});
      });
      let faltas = window.document.querySelectorAll("li.gabarito").length;
      resultado.innerHTML += ` Faltaram ${faltas}!`;
    });
  })
  //.then(() => botaoJogar.style.display = 'inline-flex')
  .catch(() => {
    container.textContent = "Erro ao conectar com o servidor.";
  });

Promise.all([fetchRegioes, initMapa()])
  .then(() => {
    botaoJogar.style.display = "inline-flex";
    document.getElementById("loading").style.display = "none";
    document.getElementById("mapa-container").style.visibility = "visible";
    document.getElementById("regioes-container").style.visibility = "visible";
  })
  .catch(() => {
    container.textContent = "Erro ao conectar com o servidor.";
  });

botaoJogar.addEventListener("click", () => comecarCron());
