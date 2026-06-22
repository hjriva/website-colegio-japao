//Puxa a função do arquivo util.js, para que todos os arquivos apareçam na tela
import { criaCardEvento } from "/util.js";
import { ReqDisciplinas } from "/util.js";

let painelDefault = 0;
//vai ser definido posteriormente conforme definiões de acesso do firebase

let painelAdmin = document.getElementById("painel-admin");
let painelAgendaConteudo = document.getElementById("painel-agenda-conteudo");
let painelAtividadesConteudo = document.getElementById(
  "painel-atividades-conteudo",
);
let painelUsuarios = document.getElementById("painel-usuarios-conteudo");

let mostrarAtvs = document.getElementById("mostrar-painel-atv");
let mostrarAgenda = document.getElementById("mostrar-painel-agenda");
let mostrarUsuarios = document.getElementById("mostrar-painel-usuarios");

let adicionarPost = document.getElementById("adicionar-post");
let novoEventoForm = document.getElementById("novo-evento-form");

let formModelo = window.document.getElementById("form-pergunta-1");
let numPerguntas = 1;

let botaoNovoQuizToggle = document.getElementById("novo-quiz-toggle");

let formsNovaAtividade = window.document.getElementById("nova-atividade");

let datalistDisciplinas = window.document.getElementById("disciplinas-dl");
let checkRandom = window.document.getElementById("randomizar");

let isDestaque = window.document.getElementById("destaque");

let randomizar = false;

let paginaAtual = 1;
let totalEventos = 0;
const LIMITE = 10;

const inputBusca = document.getElementById("input-busca");
const inputFiltroData = document.getElementById("filtro-data");
const container = document.getElementById("controle-agenda");

//Declarações de funções:

function toggleElement(element, displayDesejado) {
  const displayAtual = getComputedStyle(element).display;

  if (displayAtual === "none") {
    element.style.display = displayDesejado;
  } else {
    element.style.display = "none";
  }
}

//Função para editar itens
function editarEntrada(idElem) {
  const ev = document.getElementById(idElem);

  const elTitulo = ev.querySelector(".titulo-vento"); // ← era h2
  const elDataHora = ev.querySelector(".horario-data-evento"); // ← era .data-evento
  const elDescricao = ev.querySelector(".descr-evento");
  const elImg = ev.querySelector("img");

  const valTitulo = elTitulo.textContent.trim();
  const valDescricao = elDescricao.textContent.trim();
  const valImg = elImg.getAttribute("src");

  // ← separa data e hora do texto "DD / MM / YYYY HHhMM"
  const textoDataHora = elDataHora.textContent.trim();

  // separa a hora pelo 'h' antes de qualquer coisa
  const partes = textoDataHora.split(" ").filter((s) => s !== "/");
  // partes = ["DD", "MM", "YYYY", "HHhMM"]

  const dia = partes[0];
  const mes = partes[1];
  const ano = partes[2];
  const valHorario = partes[3] ? partes[3].replace("h", ":") : "";
  const valData = `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;

  const inputTitulo = Object.assign(document.createElement("input"), {
    value: valTitulo,
  });

  const inputData = Object.assign(document.createElement("input"), {
    type: "date",
    value: valData,
  });

  const inputHorario = Object.assign(document.createElement("input"), {
    type: "time",
    value: valHorario,
  });

  const inputDescricao = document.createElement("textarea");
  inputDescricao.value = valDescricao;

  const inputImg = Object.assign(document.createElement("input"), {
    type: "file",
    accept: "image/*",
  });
  const preview = Object.assign(document.createElement("img"), {
    src: valImg,
    style: "max-width:100px",
  });

  inputImg.addEventListener("change", (e) => {
    preview.src = URL.createObjectURL(e.target.files[0]);
  });

  elTitulo.replaceWith(inputTitulo);
  elDataHora.replaceWith(inputData); // ← substitui o elemento unificado
  inputData.after(inputHorario); // ← horário logo depois
  elDescricao.replaceWith(inputDescricao);
  elImg.replaceWith(inputImg);
  inputImg.after(preview);

  const btnAlterar = ev.querySelector("button");
  btnAlterar.style.display = "none";

  const btnSalvar = document.createElement("button"); // ← adicione isso
  btnSalvar.textContent = "Salvar";

  const btnCancelar = document.createElement("button"); // ← e isso
  btnCancelar.textContent = "Cancelar";

  // função restaurar também precisa recriar o elemento unificado
  function restaurar(titulo, descricao, imgSrc, data, horario) {
    if (preview.src.startsWith("blob:")) URL.revokeObjectURL(preview.src);

    inputTitulo.replaceWith(
      Object.assign(document.createElement("h3"), {
        textContent: titulo,
        className: "titulo-vento",
      }),
    );

    inputDescricao.replaceWith(
      Object.assign(document.createElement("p"), {
        className: "descr-evento",
        textContent: descricao,
      }),
    );

    inputImg.replaceWith(
      Object.assign(document.createElement("img"), {
        src: imgSrc,
        className: "img-evento",
      }),
    );
    preview.remove();

    const [a, m, d] = data.split("-");
    const textoReconstruido = `${d} / ${m} / ${a} ${horario.replace(":", "h")}`;
    const pDataHora = Object.assign(document.createElement("p"), {
      className: "horario-data-evento",
      textContent: textoReconstruido,
    });
    inputData.replaceWith(pDataHora);
    inputHorario.remove();

    btnAlterar.style.display = "";
    btnSalvar.remove();
    btnCancelar.remove();
  }

  // resto permanece igual...

  btnSalvar.addEventListener("click", () => {
    const formData = new FormData();
    formData.append("idEntrada", idElem);
    formData.append("titulo", inputTitulo.value);
    formData.append("descricao", inputDescricao.value);
    formData.append("dataPost", inputData.value);
    formData.append("horario", inputHorario.value);
    if (inputImg.files[0]) formData.append("img", inputImg.files[0]);

    fetch("/Alteracao_BD", { method: "POST", body: formData })
      .then((res) => res.json())
      .then((result) => {
        restaurar(
          inputTitulo.value,
          inputDescricao.value,
          result.img || valImg,
          inputData.value,
          inputHorario.value,
        );
      })
      .catch((err) => console.error(err));
  });

  btnCancelar.addEventListener("click", () => {
    restaurar(
      valTitulo,
      valDescricao,
      valImg,
      inputData.value,
      valHorario.replace("h", ":"),
    );
  });

  ev.append(btnSalvar, btnCancelar);
}

//Função para excluir itens
function excluirEntrada(idElem) {
  fetch("/deletar", {
    method: "POST",
    body: JSON.stringify({ idEntrada: idElem }),
    headers: { "Content-type": "application/json; charset=UTF-8" },
  })
    .then((res) => res.json())
    .then(() => {
      const totalPaginas = Math.ceil((totalEventos - 1) / LIMITE);
      const pagina =
        paginaAtual > totalPaginas && paginaAtual > 1
          ? paginaAtual - 1
          : paginaAtual;
      buscar(pagina);
    })
    .catch((error) => console.log(error));
}

//Função para inserir novos itens
function InserirNovo() {
  let tituloevento = window.document.getElementById("nome-novo-evento").value;
  let ilustraimg =
    window.document.getElementById("imagem-novo-evento").files[0];
  let descr = window.document.getElementById("desc-novo-evento").value;
  let datapost = window.document.getElementById("data-novo-evento").value;
  let horario = window.document.getElementById("hora-novo-evento").value;
  let destaqueStatus = isDestaque.checked ? true : false;

  const formData = new FormData();
  formData.append("titulo", tituloevento);
  formData.append("descricao", descr);
  formData.append("data", datapost);
  formData.append("horario", horario);
  formData.append("destaque", destaqueStatus);
  if (ilustraimg) {
    formData.append("imagem", ilustraimg);
  }

  fetch("/updateBD", {
    method: "POST",
    body: formData,
  })
    .then((res) => res.json())
    .then((data) => {
      console.log(data);
      buscar(paginaAtual);
    })
    .catch((error) => console.log(error));

  window.document.getElementById("FormularioNovo").reset();
}

//Aqui cria a função para que cada item tenha os botões de editar e excluir
function acoesAdmin(ev, entrada) {
  const btnEditar = document.createElement("button");
  btnEditar.textContent = "Alterar";
  btnEditar.addEventListener("click", () => editarEntrada(entrada.identrada));

  const btnExcluir = document.createElement("button");
  btnExcluir.textContent = "Excluir";
  btnExcluir.addEventListener("click", () => excluirEntrada(entrada.identrada));

  ev.appendChild(btnEditar);
  ev.appendChild(btnExcluir);
}

function buscar(pagina = 1) {
  const termo = inputBusca.value.trim();
  const data = inputFiltroData.value;

  const params = new URLSearchParams();
  if (termo) params.append("termo", termo);
  if (data) params.append("data", data);
  params.append("pagina", pagina);

  container.innerHTML = "";

  fetch(`/agenda/busca?${params}`)
    .then((res) => res.json())
    .then(({ eventos, total }) => {
      totalEventos = total;
      paginaAtual = pagina;
      eventos.forEach((entrada) =>
        criaCardEvento(entrada, container, acoesAdmin),
      );
      atualizaPaginacaoInterna();
    })
    .catch((err) => console.error(err));
}

function atualizaPaginacaoInterna() {
  const totalPaginas = Math.ceil(totalEventos / LIMITE);
  const btnAnterior = document.getElementById("btn-anterior-interno");
  const btnProximo = document.getElementById("btn-proximo-interno");
  const infoPagina = document.getElementById("info-pagina-interna");

  if (totalEventos > LIMITE) {
    btnAnterior.style.display = "";
    btnProximo.style.display = "";
    infoPagina.style.display = "";

    infoPagina.textContent = `Página ${paginaAtual} de ${totalPaginas}`;
    btnAnterior.disabled = paginaAtual === 1;
    btnProximo.disabled = paginaAtual >= totalPaginas;
  } else {
    btnAnterior.style.display = "none";
    btnProximo.style.display = "none";
    infoPagina.style.display = "none";
  }
}

function mostrarPainelAgenda() {
  painelAgendaConteudo.style.display = "";
  painelAtividadesConteudo.style.display = "none";

  novoEventoForm.style.display = "none";
  buscar(paginaAtual);
}

// ===== Navegação dentro do painel de atividades =====

function mostrarListaDisciplinas() {
  const controle = document.getElementById("controle-atividades");
  controle.innerHTML = "";

  const titulo = document.createElement("h2");
  titulo.textContent = "Disciplinas";
  controle.appendChild(titulo);

  const lista = document.createElement("ul");
  controle.appendChild(lista);

  ReqDisciplinas(lista, acoesAdminDisciplina);
}

function mostrarAtividadesDisciplina(idDisciplina, nomeDisciplina) {
  const controle = document.getElementById("controle-atividades");
  controle.innerHTML = "";

  const btnVoltar = document.createElement("button");
  btnVoltar.textContent = "← Voltar";
  btnVoltar.addEventListener("click", mostrarListaDisciplinas);
  controle.appendChild(btnVoltar);

  const titulo = document.createElement("h2");
  titulo.textContent = nomeDisciplina;
  controle.appendChild(titulo);

  const lista = document.createElement("ul");
  controle.appendChild(lista);

  fetch(`/disciplina/${idDisciplina}`)
    .then((res) => res.json())
    .then(({ atividades }) => {
      atividades.forEach((atv) => {
        const li = document.createElement("li");
        const link = document.createElement("a");
        link.href = "#";
        link.textContent = atv.titulo;
        link.addEventListener("click", (e) => {
          e.preventDefault();
          mostrarAtividade(atv, idDisciplina, nomeDisciplina);
        });
        li.appendChild(link);
        lista.appendChild(li);
      });
    })
    .catch((err) => console.error(err));
}

function mostrarAtividade(atv, idDisciplina, nomeDisciplina) {
  const controle = document.getElementById("controle-atividades");
  controle.innerHTML = "";

  const btnVoltar = document.createElement("button");
  btnVoltar.textContent = "← Voltar";
  btnVoltar.addEventListener("click", () =>
    mostrarAtividadesDisciplina(idDisciplina, nomeDisciplina),
  );
  controle.appendChild(btnVoltar);

  if (atv.tipo === "quiz") {
    renderizarQuizAdmin(atv.quiz_id, controle);
  } else {
    mostrarAtividadeEstatica(atv.caminho, controle);
  }
}

function mostrarAtividadeEstatica(caminho, container) {
  const iframe = document.createElement("iframe");
  iframe.src = caminho;
  iframe.style.width = "100%";
  iframe.style.height = "70vh";
  iframe.style.border = "none";
  container.appendChild(iframe);
}

// ===== Edição/exclusão de disciplinas (lista inicial) =====

function acoesAdminDisciplina(li, disc) {
  const link = li.querySelector(".nome-disciplina");
  link.addEventListener("click", (e) => {
    e.preventDefault();
    mostrarAtividadesDisciplina(disc.id, disc.nome_disc);
  });

  const editarBotao = document.createElement("button");
  editarBotao.id = `editar${disc.id}`;
  editarBotao.textContent = "Editar";
  editarBotao.addEventListener("click", () => editarDisciplina(li, disc));

  const excluirBotao = document.createElement("button");
  excluirBotao.id = `excluir${disc.id}`;
  excluirBotao.textContent = "Excluir";
  excluirBotao.addEventListener("click", () => excluirDisciplina(li, disc));

  li.appendChild(editarBotao);
  li.appendChild(excluirBotao);
}

function editarDisciplina(li, disc) {
  const elLink = li.querySelector(".nome-disciplina");
  const valorAtual = elLink.textContent;

  const input = document.createElement("input");
  input.type = "text";
  input.value = valorAtual;
  elLink.replaceWith(input);

  const btnEditar = li.querySelector(`#editar${disc.id}`);
  const btnExcluir = li.querySelector(`#excluir${disc.id}`);
  btnEditar.style.display = "none";
  btnExcluir.style.display = "none";

  const btnSalvar = document.createElement("button");
  btnSalvar.textContent = "Salvar";

  const btnCancelar = document.createElement("button");
  btnCancelar.textContent = "Cancelar";

  function restaurar(nomeFinal) {
    const novoLink = document.createElement("a");
    novoLink.href = `/atividades/disciplinas.html?id=${disc.id}`;
    novoLink.textContent = nomeFinal;
    novoLink.classList.add("nome-disciplina");
    novoLink.addEventListener("click", (e) => {
      e.preventDefault();
      mostrarAtividadesDisciplina(disc.id, disc.nome_disc);
    });

    input.replaceWith(novoLink);

    btnEditar.style.display = "";
    btnExcluir.style.display = "";
    btnSalvar.remove();
    btnCancelar.remove();
  }

  btnSalvar.addEventListener("click", () => {
    const novoNome = input.value.trim();
    if (!novoNome) return;

    fetch("/atualizarDisciplina", {
      method: "POST",
      headers: { "Content-type": "application/json; charset=UTF-8" },
      body: JSON.stringify({ id: disc.id, nome_disc: novoNome }),
    })
      .then((res) => res.json())
      .then(() => {
        disc.nome_disc = novoNome;
        restaurar(novoNome);
      })
      .catch((err) => console.error(err));
  });

  btnCancelar.addEventListener("click", () => {
    restaurar(valorAtual);
  });

  li.append(btnSalvar, btnCancelar);
}

function excluirDisciplina(li, disc) {
  if (li.querySelector(".form-excluir-disciplina")) return;

  const form = document.createElement("div");
  form.classList.add("form-excluir-disciplina");

  const pergunta = document.createElement("p");
  pergunta.textContent = `O que fazer com as atividades de "${disc.nome_disc}"?`;
  form.appendChild(pergunta);

  const btnExcluirTudo = document.createElement("button");
  btnExcluirTudo.textContent = "Excluir tudo";

  const btnMigrar = document.createElement("button");
  btnMigrar.textContent = "Mover para outra disciplina";

  const btnCancelar = document.createElement("button");
  btnCancelar.textContent = "Cancelar";

  form.append(btnExcluirTudo, btnMigrar, btnCancelar);
  li.appendChild(form);

  btnCancelar.addEventListener("click", () => form.remove());

  btnExcluirTudo.addEventListener("click", () => {
    if (
      !confirm(
        `Tem certeza? Isso vai excluir "${disc.nome_disc}" e todas as suas atividades permanentemente.`,
      )
    )
      return;

    fetch("/excluirDisciplina", {
      method: "POST",
      headers: { "Content-type": "application/json" },
      body: JSON.stringify({ id: disc.id, acao: "excluir" }),
    })
      .then((res) => res.json())
      .then(() => li.remove())
      .catch((err) => console.error(err));
  });

  btnMigrar.addEventListener("click", () => {
    btnExcluirTudo.remove();
    btnMigrar.remove();

    fetch(`/disciplinas/exceto/${disc.id}`)
      .then((res) => res.json())
      .then((disciplinas) => {
        if (disciplinas.length === 0) {
          const aviso = document.createElement("p");
          aviso.textContent =
            "Não há outras disciplinas disponíveis. Você precisa criar uma primeiro.";
          form.insertBefore(aviso, btnCancelar);
          return;
        }

        const label = document.createElement("p");
        label.textContent = "Mover atividades para:";

        const select = document.createElement("select");
        disciplinas.forEach((d) => {
          const option = document.createElement("option");
          option.value = d.id;
          option.textContent = d.nome_disc;
          select.appendChild(option);
        });

        const btnConfirmar = document.createElement("button");
        btnConfirmar.textContent = "Confirmar migração";

        btnConfirmar.addEventListener("click", () => {
          const idDestino = select.value;
          const nomeDestino = select.options[select.selectedIndex].text;

          if (
            !confirm(
              `Mover todas as atividades de "${disc.nome_disc}" para "${nomeDestino}" e excluir a disciplina?`,
            )
          )
            return;

          fetch("/excluirDisciplina", {
            method: "POST",
            headers: { "Content-type": "application/json" },
            body: JSON.stringify({ id: disc.id, acao: "migrar", idDestino }),
          })
            .then((res) => res.json())
            .then(() => li.remove())
            .catch((err) => console.error(err));
        });

        form.insertBefore(label, btnCancelar);
        form.insertBefore(select, btnCancelar);
        form.insertBefore(btnConfirmar, btnCancelar);
      })
      .catch((err) => console.error(err));
  });
}

// ===== Renderização do quiz (admin) =====

function renderizarQuizAdmin(idQuiz, container) {
  fetch(`/quiz/${idQuiz}`)
    .then((res) => res.json())
    .then(({ quiz, questoes }) => {
      const tituloDiv = document.createElement("div");
      tituloDiv.classList.add("titulo-quiz-admin");

      const inputTitulo = document.createElement("input");
      inputTitulo.type = "text";
      inputTitulo.value = quiz.titulo;

      const btnSalvarTitulo = document.createElement("button");
      btnSalvarTitulo.textContent = "Salvar título";
      btnSalvarTitulo.addEventListener("click", () => {
        fetch("/atualizarTituloQuiz", {
          method: "POST",
          headers: { "Content-type": "application/json" },
          body: JSON.stringify({
            idAtividade: quiz.atividade_id,
            titulo: inputTitulo.value,
          }),
        })
          .then((res) => res.json())
          .then(() => (btnSalvarTitulo.textContent = "Salvo ✓"))
          .catch((err) => console.error(err));
      });

      tituloDiv.append(inputTitulo, btnSalvarTitulo);
      container.appendChild(tituloDiv);

      questoes.forEach((q) => criaCardPerguntaAdmin(q, container));
    })
    .catch((err) => console.error(err));
}

function criaCardPerguntaAdmin(questao, container) {
  const card = document.createElement("div");
  card.classList.add("pergunta-admin");

  const inputPergunta = document.createElement("textarea");
  inputPergunta.value = questao.pergunta;
  inputPergunta.placeholder = "Enunciado da pergunta";

  function criarLinhaAlternativa(letra, valor) {
    const linha = document.createElement("div");

    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = `correta-${questao.id}`;
    radio.value = letra;
    if (questao.resposta_correta === letra) radio.checked = true;

    const input = document.createElement("input");
    input.type = "text";
    input.value = valor;

    linha.append(radio, input);
    return { linha, input, radio };
  }

  const altA = criarLinhaAlternativa("A", questao.alternativa_a);
  const altB = criarLinhaAlternativa("B", questao.alternativa_b);
  const altC = criarLinhaAlternativa("C", questao.alternativa_c);
  const altD = criarLinhaAlternativa("D", questao.alternativa_d);

  const inputExplicacao = document.createElement("textarea");
  inputExplicacao.value = questao.explicacao || "";
  inputExplicacao.placeholder = "Explicação";

  const btnSalvar = document.createElement("button");
  btnSalvar.textContent = "Salvar pergunta";
  btnSalvar.addEventListener("click", () => {
    const correta = [altA, altB, altC, altD].find((a) => a.radio.checked)?.radio
      .value;

    fetch("/atualizarPergunta", {
      method: "POST",
      headers: { "Content-type": "application/json" },
      body: JSON.stringify({
        id: questao.id,
        pergunta: inputPergunta.value,
        alt_a: altA.input.value,
        alt_b: altB.input.value,
        alt_c: altC.input.value,
        alt_d: altD.input.value,
        correto: correta,
        explicacao: inputExplicacao.value,
      }),
    })
      .then((res) => res.json())
      .then(() => (btnSalvar.textContent = "Salvo ✓"))
      .catch((err) => console.error(err));
  });

  const btnExcluir = document.createElement("button");
  btnExcluir.textContent = "Excluir pergunta";
  btnExcluir.addEventListener("click", () => {
    if (!confirm("Tem certeza que deseja excluir essa pergunta?")) return;

    fetch("/deletarPergunta", {
      method: "POST",
      headers: { "Content-type": "application/json" },
      body: JSON.stringify({ id: questao.id }),
    })
      .then((res) => res.json())
      .then(() => card.remove())
      .catch((err) => console.error(err));
  });

  card.append(
    inputPergunta,
    altA.linha,
    altB.linha,
    altC.linha,
    altD.linha,
    inputExplicacao,
    btnSalvar,
    btnExcluir,
  );
  container.appendChild(card);
}

// ===== Criação de novo quiz =====

function NovaQuestao() {
  numPerguntas++;
  const novoForm = formModelo.cloneNode(true);
  novoForm.id = `form-pergunta-${numPerguntas}`;
  novoForm
    .querySelectorAll("label")[0]
    .setAttribute("for", `enunciado-${numPerguntas}`);
  novoForm.querySelector(".numero-pergunta").textContent = numPerguntas + ")";

  const inputPergunta = novoForm.querySelectorAll("input")[0];
  inputPergunta.id = `enunciado-${numPerguntas}`;
  inputPergunta.value = "";

  let inputAlternativas = novoForm.querySelectorAll("input[type=text]");
  let inputRadios = novoForm.querySelectorAll("input[type=radio]");

  for (
    let inicioInput = 1, inicioRadio = 0;
    inicioInput < inputAlternativas.length;
    inicioInput++, inicioRadio++
  ) {
    inputAlternativas[inicioInput].id =
      `alt-${String.fromCharCode(65 + inicioInput)}-${numPerguntas}`;
    inputAlternativas[inicioInput].value = "";
    novoForm
      .querySelectorAll("label")
      [
        inicioInput
      ].setAttribute("for", `alt-${String.fromCharCode(65 + inicioInput)}-${numPerguntas}`);
    inputRadios[inicioRadio].id =
      `radio-${String.fromCharCode(65 + inicioInput)}-${numPerguntas}`;
    inputRadios[inicioRadio].checked = false;
  }

  novoForm.querySelector(".explicacao-text").value = "";
  novoForm.querySelector(".explicacao-text").id = `explicacao-${numPerguntas}`;

  document.getElementById("formulario_perguntas").appendChild(novoForm);
}

function mostrarPainelAtvs() {
  painelAgendaConteudo.style.display = "none";
  painelAtividadesConteudo.style.display = "";
  painelUsuarios.style.display = "none";

  fetch("/disciplinas")
    .then((res) => res.json())
    .then((data) => {
      datalistDisciplinas.innerHTML = "";

      data.forEach((disciplina) => {
        let opcaoDisciplina = document.createElement("option");
        opcaoDisciplina.value = disciplina.nome_disc;
        datalistDisciplinas.appendChild(opcaoDisciplina);
      });
    })
    .catch((err) => console.error(err));

  mostrarListaDisciplinas();
}

function mostrarPainelUsuarios() {
  painelAgendaConteudo.style.display = "none";
  painelAtividadesConteudo.style.display = "none";
  painelUsuarios.style.display = "";

  //logica para puxar usuarios do fb
}

document.addEventListener("DOMContentLoaded", () => {
  inputBusca.addEventListener("input", () => buscar(1));
  inputFiltroData.addEventListener("change", () => buscar(1));
  document
    .getElementById("btn-anterior-interno")
    .addEventListener("click", () => buscar(paginaAtual - 1));
  document
    .getElementById("btn-proximo-interno")
    .addEventListener("click", () => buscar(paginaAtual + 1));

  if (painelDefault == 0) {
    mostrarPainelAgenda();
  } else if (painelDefault == 1) {
    mostrarPainelAtvs();
  } else {
    painelAdmin.textContent = "Permissões não definidas.";
  }

let dataInputs = document.querySelectorAll('#FormularioNovo input[type=date]')
dataInputs.forEach(input => {
    input.value = new Date().toISOString().split('T')[0]; 
})
});

// ===== Listeners =====

window.document.getElementById("salvar-post").addEventListener("click", () => {
  InserirNovo();
});

adicionarPost.addEventListener("click", () =>
  toggleElement(novoEventoForm, "block"),
);

mostrarAgenda.addEventListener("click", () => mostrarPainelAgenda());

mostrarAtvs.addEventListener("click", () => mostrarPainelAtvs());

mostrarUsuarios.addEventListener("click", () => mostrarPainelUsuarios());

botaoNovoQuizToggle.addEventListener("click", () => {
  toggleElement(formsNovaAtividade, "block");
});

checkRandom.addEventListener("click", function () {
  randomizar = checkRandom.checked ? true : false;
  let numeros = window.document.querySelectorAll(".numero-pergunta");
  if (randomizar) {
    numeros.forEach((span) => (span.style.display = "none"));
  } else {
    numeros.forEach((span) => (span.style.display = "initial"));
  }
});

window.document
  .getElementById("add-pergunta")
  .addEventListener("click", () => NovaQuestao());

window.document.getElementById("salvar_quiz").addEventListener("click", () => {
  let todosFormularios = document.querySelectorAll(".form_pergunta");
  let semResposta = [];

  todosFormularios.forEach((form, index) => {
    const marcado = form.querySelector('[name="radio-alternativa"]:checked');
    if (!marcado) {
      semResposta.push(index + 1);
    }
  });

  if (semResposta.length > 0) {
    alert(
      `As seguintes perguntas não têm resposta marcada: ${semResposta.join(", ")}`,
    );
    return;
  }

  let nomeAtividade = document.getElementById("nome-atividade").value;
  let nomeDisciplina = document.getElementById("input-disciplina").value;

  fetch("/novoquiz", {
    method: "POST",
    body: JSON.stringify({
      disciplina: nomeDisciplina,
      tituloQuiz: nomeAtividade,
      randomizar: randomizar,
    }),
    headers: { "Content-type": "application/json; charset=UTF-8" },
  })
    .then((response) => response.json())
    .then((data) => {
      const idQuiz = data.idQuiz;
      const perguntas = document.querySelectorAll(".perguntas_teste");
      const requests = Array.from(perguntas).map((pergunta) => {
        const enunciado = pergunta.querySelector(".input_enunciado").value;
        const alt_a = pergunta.querySelector(".alt-a").value;
        const alt_b = pergunta.querySelector(".alt-b").value;
        const alt_c = pergunta.querySelector(".alt-c").value;
        const alt_d = pergunta.querySelector(".alt-d").value;
        let resposta_correta = pergunta.querySelector(
          '[name="radio-alternativa"]:checked',
        )?.value;
        let explicacao = pergunta.querySelector(".explicacao-text").value;

        if (!resposta_correta) {
          alert("Marque a alternativa correta de todas as perguntas!");
          return;
        }

        return fetch("/novasperguntas", {
          method: "POST",
          body: JSON.stringify({
            idQuiz: idQuiz,
            enunciado: enunciado,
            alt_a: alt_a,
            alt_b: alt_b,
            alt_c: alt_c,
            alt_d: alt_d,
            correto: resposta_correta,
            explicacao: explicacao,
          }),
          headers: { "Content-type": "application/json; charset=UTF-8" },
        });
      });

      return Promise.all(requests);
    })
    .then((resultados) => {
      console.log(resultados);
      document.querySelectorAll("form").forEach((form) => form.reset());
      let feedbackQuizSalvo = document.createElement("div");
      feedbackQuizSalvo.id = "quiz-salvo";
      feedbackQuizSalvo.classList.add("feedback-quiz");
      feedbackQuizSalvo.textContent = "Quiz salvo com sucesso!";
    })
    .catch((error) => console.error(error));
});
