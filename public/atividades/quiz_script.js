const params = new URLSearchParams(window.location.search);
const id = params.get("id");
const pagina = params.get("pagina") || 1;
let res = window.document.getElementById("resultado");

const STORAGE_KEY = `quiz_${id}`;

// Detecta se veio de navegação interna (paginação) ou reload/acesso direto
const veioDeNavegacao = sessionStorage.getItem("navegando_quiz") === id;
sessionStorage.removeItem("navegando_quiz"); // Sempre limpa após ler

if (!veioDeNavegacao) {
  sessionStorage.removeItem(STORAGE_KEY);
}

let dadosSalvos = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}");
if (!dadosSalvos.respostas) dadosSalvos.respostas = {};
if (!dadosSalvos.feedback) dadosSalvos.feedback = {};

function salvarDados() {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(dadosSalvos));
}

function SalvarRadio(radio) {
  const questaoId = radio.closest(".questao").id;
  dadosSalvos.respostas[questaoId] = radio.value;

  // Remove borda vermelha ao responder
  document.getElementById(questaoId).classList.remove("nao-respondida");

  if (dadosSalvos.feedback[questaoId]) {
    delete dadosSalvos.feedback[questaoId];
    const divQuestao = document.getElementById(questaoId);
    const divFeedback = divQuestao.querySelector(".feedback");
    const divExplicacao = divQuestao.querySelector(".explicacao");
    if (divFeedback) divFeedback.remove();
    if (divExplicacao) divExplicacao.remove();
    divQuestao.classList.remove("questao-correta", "questao-errada"); 
  }

  salvarDados();
}

let botaoResultado = window.document.getElementById("submeter-resultado");

fetch(`/quiz/${id}?pagina=${pagina}`)
  .then((res) => res.json())
  .then((data) => {
    console.log(data);
    document.getElementById("loading-quiz").remove();

    document.getElementById("titulo").innerText = data.quiz.titulo;
    console.log(data);

    if (!dadosSalvos.totalQuestoesQuiz) {
      dadosSalvos.totalQuestoesQuiz =
        data.totalQuestoes ?? data.totalPaginas * data.questoes.length;
      salvarDados();
    }

    data.questoes.forEach((questao) => {
      console.log(questao);
      const div = document.createElement("div");
      div.id = questao.id;
      div.classList.add("questao");

      let feedbackSalvo = dadosSalvos.feedback[questao.id];

      const respostaSalva = dadosSalvos.respostas[questao.id];

      const letras = ["a", "b", "c", "d"];
      const alternativasHTML = letras
        .map((letra) => {
          const inputId = `${questao.id}-${letra}`;
          const checked = respostaSalva === letra ? "checked" : "";
          return `
        <label class="alternativa-quiz" for="${inputId}">
            <input type="radio" id="${inputId}" name="q${questao.id}" value="${letra}" ${checked}>
            <span>${letra}) ${questao[`alternativa_${letra}`]}</span>
        </label>
    `;
        })
        .join("");

      div.innerHTML = `
    <p>${questao.pergunta}</p>
    ${alternativasHTML}
`;
      document.getElementById("questoes").appendChild(div);

      div.querySelectorAll("input[type=radio]").forEach((radio) => {
        radio.disabled = !!feedbackSalvo; // trava se a pergunta já foi corrigida
        radio.addEventListener("change", () => SalvarRadio(radio));
      });
      if (!feedbackSalvo && dadosSalvos.submetido && respostaSalva) {
        const altCorreta = questao.resposta_correta;
        const correta = respostaSalva == altCorreta;
        feedbackSalvo = {
          texto: correta
            ? `Você acertou a questão!`
            : `A resposta correta é ${altCorreta}!`,
          classe: correta ? "resposta-correta" : "resposta-inccorreta",
          explicacao: questao.explicacao,
        };
        dadosSalvos.feedback[questao.id] = feedbackSalvo;
        salvarDados();
      }

      if (feedbackSalvo) {
        const divFeedback = document.createElement("div");
        divFeedback.classList.add("feedback", feedbackSalvo.classe);
        divFeedback.textContent = feedbackSalvo.texto;
        div.appendChild(divFeedback);

        pergunta
          .querySelectorAll("input[type=radio]")
          .forEach((r) => (r.disabled = true));

        // Aplica classe de background
        div.classList.add(
          feedbackSalvo.classe === "resposta-correta"
            ? "questao-correta"
            : "questao-errada",
        );

        if (
          feedbackSalvo.explicacao !== null &&
          feedbackSalvo.explicacao.trim() !== ""
        ) {
          const divExplicacao = document.createElement("div");
          divExplicacao.classList.add("explicacao");
          divExplicacao.textContent = feedbackSalvo.explicacao;
          div.appendChild(divExplicacao);
        }
      }
    });

    const nav = document.getElementById("navegacao");

    if (data.paginaAtual > 1) {
      const linkAnterior = document.createElement("a");
      linkAnterior.href = `/atividades/quiz.html?id=${id}&pagina=${data.paginaAtual - 1}`;
      linkAnterior.className = "paginacao";
      linkAnterior.textContent = "← Anterior";
      linkAnterior.addEventListener("click", () =>
        sessionStorage.setItem("navegando_quiz", id),
      );
      nav.appendChild(linkAnterior);
    }
    if (data.paginaAtual < data.totalPaginas) {
      const linkProximo = document.createElement("a");
      linkProximo.href = `/atividades/quiz.html?id=${id}&pagina=${Number(data.paginaAtual) + 1}`;
      linkProximo.className = "paginacao";
      linkProximo.id = "prox-link";
      linkProximo.textContent = "Próxima →";
      linkProximo.addEventListener("click", () =>
        sessionStorage.setItem("navegando_quiz", id),
      );
      nav.appendChild(linkProximo);
    }

    if (dadosSalvos.submetido) {
      mostrarResultadoTotal();
    }

    botaoResultado.addEventListener("click", () => {
      let perguntas = document.querySelectorAll(".questao");
      const avisoEl = document.getElementById("aviso-submeter");

      // Verifica se todas foram respondidas
      let todasRespondidas = true;
      perguntas.forEach((pergunta) => {
        const respondida = pergunta.querySelector("input[type=radio]:checked");
        if (!respondida) {
          pergunta.classList.add("nao-respondida");
          todasRespondidas = false;
        }
      });

      if (!todasRespondidas) {
        avisoEl.textContent = "Responda todas as questões antes de submeter.";
        return;
      }

      avisoEl.textContent = "";

      perguntas.forEach((pergunta, index) => {
        const questaoId = pergunta.id;

        if (dadosSalvos.feedback[questaoId]) return;

        const questao = data.questoes.find((q) => q.id == questaoId) ?? null;
        const altCorreta = questao.resposta_correta;

        const radioMarcado = pergunta.querySelector(
          "input[type=radio]:checked",
        );
        if (!radioMarcado) return;

        let altMarcada = radioMarcado.value;

        const divFeedback = document.createElement("div");
        divFeedback.classList.add("feedback");

        let classe, texto;
        pergunta.classList.add(
          altMarcada == altCorreta ? "questao-correta" : "questao-errada",
        );
        if (altMarcada == altCorreta) {
          texto = `Você acertou a questão ${index + 1}!`;
          classe = "resposta-correta";
        } else {
          texto = `A resposta correta é ${altCorreta}!`;
          classe = "resposta-inccorreta";
        }
        divFeedback.textContent = texto;
        divFeedback.classList.add(classe);
        pergunta.appendChild(divFeedback);

        const explicacaoPergunta = questao.explicacao;
        if (explicacaoPergunta !== null && explicacaoPergunta.trim() !== "") {
          const divExplicacao = document.createElement("div");
          divExplicacao.classList.add("explicacao");
          divExplicacao.textContent = explicacaoPergunta;
          pergunta.appendChild(divExplicacao);
        }

        dadosSalvos.feedback[questaoId] = {
          texto,
          classe,
          explicacao: explicacaoPergunta,
        };
      });

      dadosSalvos.submetido = true;
      salvarDados();
      mostrarResultadoTotal();
    });

    function mostrarResultadoTotal() {
      res.style.display = "block";
      const totalCorretas = Object.values(dadosSalvos.feedback).filter(
        (f) => f.classe === "resposta-correta",
      ).length;
      const totalQuestoes = dadosSalvos.totalQuestoesQuiz;

      let texto = `Você acertou ${totalCorretas} de ${totalQuestoes}!`;
      if (totalCorretas >= Math.ceil(totalQuestoes / 2)) {
        texto += ` Parabéns!!`;
      }
      res.innerHTML = texto;
    }
  });
