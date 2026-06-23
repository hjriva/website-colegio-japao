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
    ev.classList.add("editando");

    const tituloEl = ev.querySelector(".titulo-vento");
    const dataEl = ev.querySelector(".horario-data-evento");
    const descEl = ev.querySelector(".descr-evento");
    const imgEl = ev.querySelector("img");

    const titulo = tituloEl.textContent.trim();
    const desc = descEl.textContent.trim();
    const imgSrc = imgEl.getAttribute("src");

    const textoDataHora = dataEl.textContent.trim();
    const partes = textoDataHora.split(" ");

    const dia = partes[0];
    const mes = partes[2];
    const ano = partes[4];
    const horario = partes[5]?.replace("h", ":") || "";

    const dataFormatada = `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;

    // 🔥 pega o container correto
    const container = ev.querySelector(".evento-titulo-div");

    // salva HTML original para cancelar
    const originalHTML = container.innerHTML;

    // cria modo edição mantendo estrutura
    container.innerHTML = `
      <input class="titulo-vento input-edit" value="${titulo}">

      <div class="linha-data">
        <input type="date" class="input-data" value="${dataFormatada}">
        <input type="time" class="input-hora" value="${horario}">
      </div>

      <textarea class="input-desc">${desc}</textarea>
    `;

    const imgContainer = ev.querySelector(".evento-header-div");




  const imgWrapper = document.createElement("div");
  imgWrapper.classList.add("img-edit-wrapper");

  // input de imagem
  const inputImg = document.createElement("input");
  inputImg.type = "file";
  inputImg.accept = "image/*";

  // preview
  const preview = document.createElement("img");
  preview.src = imgSrc;

  // monta verticalmente
  imgWrapper.appendChild(preview);
  imgWrapper.appendChild(inputImg);

  // troca imagem pelo wrapper
  imgEl.replaceWith(imgWrapper);

    const btnEditar = ev.querySelector("button");
    btnEditar.style.display = "none";


  
    const iconsalvar = document.createElement('i');
    iconsalvar.classList.add("fa-solid");
    iconsalvar.classList.add('fa-check');
    


  
  
    const iconcancelar = document.createElement('i');
    iconcancelar.classList.add("fa-solid");
    iconcancelar.classList.add('fa-ban')
    

  const btnSalvar = document.createElement("button");
  btnSalvar.appendChild(iconsalvar)
  btnSalvar.classList.add("btn-editar-salvar");


  const btnCancelar = document.createElement("button");
  btnCancelar.appendChild(iconcancelar)
  btnCancelar.classList.add("btn-editar-cancelar");

    ev.append(btnSalvar, btnCancelar);

    function restaurar() {
      ev.classList.remove("editando");
      container.classList.remove('editando')
      container.innerHTML = originalHTML;

      preview.remove();
      inputImg.replaceWith(imgEl);

      btnEditar.style.display = "";
      btnSalvar.remove();
      btnCancelar.remove();
    }

    btnCancelar.onclick = restaurar;

    btnSalvar.onclick = async () => {
      const novoTitulo = container.querySelector(".titulo-vento").value;
      const novaData = container.querySelector(".input-data").value;
      const novaHora = container.querySelector(".input-hora").value;
      const novaDesc = container.querySelector(".input-desc").value;

      const formData = new FormData();
      formData.append("idEntrada", idElem);
      formData.append("titulo", novoTitulo);
      formData.append("descricao", novaDesc);
      formData.append("dataPost", novaData);
      formData.append("horario", novaHora);

      if (inputImg.files[0]) {
        formData.append("img", inputImg.files[0]);
      }

      const res = await fetch("/Alteracao_BD", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      restaurar();
    };
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
    const icon = document.createElement('i');
    icon.classList.add("fa-solid");
    icon.classList.add("fa-pen");
    btnEditar.appendChild(icon);
    btnEditar.classList.add('botoes-editar')
    btnEditar.addEventListener("click", () => editarEntrada(entrada.identrada));

    const btnExcluir = document.createElement("button");

    const icontrash = document.createElement('i');
    icontrash.classList.add("fa-solid");
    icontrash.classList.add('fa-trash-can')
    btnExcluir.appendChild(icontrash);
    btnExcluir.classList.add('botoes-excluir')
    btnExcluir.addEventListener("click", () => excluirEntrada(entrada.identrada));

    const wrapperBotoes = document.createElement('div')
    wrapperBotoes.id = 'wrapper-botoes'
    wrapperBotoes.appendChild(btnEditar);
    wrapperBotoes.appendChild(btnExcluir);
    ev.appendChild(wrapperBotoes)
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

   ReqDisciplinas(lista, acoesAdminDisciplina, { comFundo: true });
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

        // ✅ background da disciplina no li da atividade
        if (atv.imagem_disciplina) {
               li.style.backgroundImage = `
        linear-gradient(rgba(255,255,255,0.7), rgba(255,255,255,0.7)),
        url('/${atv.imagem_disciplina}')
    `;
            li.style.backgroundSize = 'cover';
            li.style.backgroundPosition = 'center';
        }

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

      const icon = document.createElement('i');
    icon.classList.add("fa-solid");
    icon.classList.add("fa-pen");
    

    const editarBotao = document.createElement("button");

    editarBotao.id = `editar${disc.id}`;
    editarBotao.appendChild(icon);
    editarBotao.addEventListener("click", () => editarDisciplina(li, disc));

    const excluirBotao = document.createElement("button");
    excluirBotao.id = `excluir${disc.id}`;
      const icontrash = document.createElement('i');
    icontrash.classList.add("fa-solid");
    icontrash.classList.add('fa-trash-can')
    excluirBotao.appendChild(icontrash);
    excluirBotao.addEventListener("click", () => excluirDisciplina(li, disc));

    const botaoWrapper = document.createElement('div')
    botaoWrapper.classList.add('button-wrapper-disciplinas')

    botaoWrapper.appendChild(editarBotao);
    botaoWrapper.appendChild(excluirBotao);
    li.appendChild(botaoWrapper);
  }

 function editarDisciplina(li, disc) {
    const elLink = li.querySelector(".nome-disciplina");
    const valorAtual = elLink.textContent;

    const input = document.createElement("input");
    input.type = "text";
    input.value = valorAtual;
    elLink.replaceWith(input);

    // ✅ input de imagem
    const inputImagem = document.createElement("input");
    inputImagem.type = "file";
    inputImagem.accept = "image/*";
    inputImagem.style.cssText = "display:block; margin-top:6px; font-size:0.8rem;";

    const labelImagem = document.createElement("label");
    labelImagem.textContent = "Nova foto:";
    labelImagem.style.cssText = "font-size:0.8rem; display:block; margin-top:6px;";

    li.insertBefore(labelImagem, li.querySelector('.button-wrapper-disciplinas'));
    li.insertBefore(inputImagem, li.querySelector('.button-wrapper-disciplinas'));

    const btnEditar = li.querySelector(`#editar${disc.id}`);
    const btnExcluir = li.querySelector(`#excluir${disc.id}`);
    btnEditar.style.display = "none";
    btnExcluir.style.display = "none";

    const btnSalvar = document.createElement("button");
    const iconsalvar = document.createElement('i');
    iconsalvar.classList.add("fa-solid", 'fa-check');
    btnSalvar.classList.add('salvar-agenda-admin');
    btnSalvar.appendChild(iconsalvar);

    const btnCancelar = document.createElement("button");
    const iconcancelar = document.createElement('i');
    iconcancelar.classList.add("fa-solid", 'fa-ban');
    btnCancelar.classList.add('cancelar-agenda-admin');
    btnCancelar.appendChild(iconcancelar);

    function restaurar(nomeFinal, novaImagem) {
        const novoLink = document.createElement("a");
        novoLink.href = `/atividades/disciplinas.html?id=${disc.id}`;
        novoLink.textContent = nomeFinal;
        novoLink.classList.add("nome-disciplina");
        novoLink.addEventListener("click", (e) => {
            e.preventDefault();
            mostrarAtividadesDisciplina(disc.id, disc.nome_disc);
        });

        input.replaceWith(novoLink);
        labelImagem.remove();
        inputImagem.remove();

        // ✅ atualiza background do li se veio nova imagem
        if (novaImagem) {
            li.style.backgroundImage = `
        linear-gradient(rgba(255,255,255,0.7), rgba(255,255,255,0.7)),
        url('/${atv.imagem_disciplina}')
    `;
            li.style.backgroundSize = 'cover';
            li.style.backgroundPosition = 'center';
        }

        btnEditar.style.display = "";
        btnExcluir.style.display = "";
        btnSalvar.remove();
        btnCancelar.remove();
    }

    btnSalvar.addEventListener("click", async () => {
        const novoNome = input.value.trim();
        if (!novoNome) return;

        // Salva o nome
        await fetch("/atualizarDisciplina", {
            method: "POST",
            headers: { "Content-type": "application/json; charset=UTF-8" },
            body: JSON.stringify({ id: disc.id, nome_disc: novoNome }),
        });
        disc.nome_disc = novoNome;

        // ✅ Salva a imagem se tiver uma nova
        let novaImagem = null;
        if (inputImagem.files[0]) {
            const formData = new FormData();
            formData.append("id", disc.id);
            formData.append("imagem", inputImagem.files[0]);

            const res = await fetch("/atualizarImagemDisciplina", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (data.imagem) novaImagem = data.imagem;
        }

        restaurar(novoNome, novaImagem);
    });

    btnCancelar.addEventListener("click", () => {
        labelImagem.remove();
        inputImagem.remove();
        restaurar(valorAtual, null);
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
        container.innerHTML = "";

        const perguntasEditadas = [];

        // ===== TÍTULO =====
        const tituloDiv = document.createElement("div");
        tituloDiv.classList.add("titulo-quiz-admin");

        const inputTitulo = document.createElement("input");
        inputTitulo.value = quiz.titulo;

        tituloDiv.appendChild(inputTitulo);
        container.appendChild(tituloDiv);

        // ===== PERGUNTAS =====
        const perguntasContainer = document.createElement("div");
        container.appendChild(perguntasContainer);

        questoes.forEach((q) => {
          perguntasEditadas.push(criaCardPerguntaAdmin(q, perguntasContainer, idQuiz));
        });

        // ===== BOTÕES GLOBAIS =====
        const botoesDiv = document.createElement("div");
        botoesDiv.classList.add("acoes-quiz-admin");

        const btnAdicionar = document.createElement("button");
        btnAdicionar.textContent = "+";
        btnAdicionar.id = "add-pergunta";
        btnAdicionar.addEventListener("click", () => {
          const nova = {
            id: null,
            pergunta: "",
            alternativa_a: "",
            alternativa_b: "",
            alternativa_c: "",
            alternativa_d: "",
            resposta_correta: "A",
            explicacao: "",
          };
          // Nova pergunta já nasce em modo edição
          const ref = criaCardPerguntaAdmin(nova, perguntasContainer, idQuiz);
          ref.card.classList.add("editando");
          perguntasEditadas.push(ref);
        });

        const btnSalvarTitulo = document.createElement("button");
        btnSalvarTitulo.textContent = "Salvar título";
        btnSalvarTitulo.id = "salvar_quiz_editado";
        btnSalvarTitulo.addEventListener("click", async () => {
          await fetch("/atualizarTituloQuiz", {
            method: "POST",
            headers: { "Content-type": "application/json" },
            body: JSON.stringify({
              idAtividade: quiz.atividade_id,
              titulo: inputTitulo.value,
            }),
          });
        });

        botoesDiv.append(btnAdicionar, btnSalvarTitulo);
        container.appendChild(botoesDiv);
      });
  }

  function criaCardPerguntaAdmin(questao, container, idQuiz) {
    console.log("NOVA VERSÃO criaCardPerguntaAdmin rodando");

    const card = document.createElement("div");
    card.classList.add("pergunta-admin");
    // Começa fora do modo edição (leitura)

    // ===== ENUNCIADO =====
    const inputPergunta = document.createElement("textarea");
    inputPergunta.value = questao.pergunta || "";
    inputPergunta.placeholder = "Enunciado da pergunta";

    // ===== BOTÃO EXCLUIR =====
    const btnExcluir = document.createElement("button");
    btnExcluir.classList.add("excluir-pergunta_admin");
    const iconTrash = document.createElement("i");
    iconTrash.classList.add("fa-solid", "fa-trash-can");
    btnExcluir.appendChild(iconTrash);
    btnExcluir.addEventListener("click", () => {
      if (!confirm("Deseja realmente excluir esta pergunta?")) return;
      if (!questao.id) { card.remove(); return; }
      fetch("/deletarPergunta", {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({ id: questao.id }),
      })
        .then(() => card.remove())
        .catch(console.error);
    });

    // ===== TOPO: enunciado + excluir =====
    const top = document.createElement("div");
    top.classList.add("BotaoExcluir_div");
    top.append(inputPergunta, btnExcluir);

    // ===== ALTERNATIVAS =====
    const nomeGrupo = `correta-${questao.id || Math.random()}`;

    function criarLinhaAlternativa(letra, valor) {
      const linha = document.createElement("div");
      linha.classList.add("alternativa-linha");

      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = nomeGrupo;
      radio.value = letra;
      if (questao.resposta_correta === letra) radio.checked = true;

      const input = document.createElement("input");
      input.type = "text";
      input.value = valor || "";

      const label = document.createElement("span");
      label.textContent = letra;

      linha.append(radio, label, input);
      return { linha, input, radio };
    }

    const altA = criarLinhaAlternativa("A", questao.alternativa_a);
    const altB = criarLinhaAlternativa("B", questao.alternativa_b);
    const altC = criarLinhaAlternativa("C", questao.alternativa_c);
    const altD = criarLinhaAlternativa("D", questao.alternativa_d);

    // ===== EXPLICAÇÃO =====
    const inputExplicacao = document.createElement("textarea");
    inputExplicacao.value = questao.explicacao || "";
    inputExplicacao.placeholder = "Explicação da resposta";

    // ===== BOTÃO EDITAR (visível em modo leitura) =====
    const btnEditar = document.createElement("button");
    btnEditar.classList.add("btn-editar-card");
    const iconEdit = document.createElement("i");
    iconEdit.classList.add("fa-solid", "fa-pen");
    btnEditar.appendChild(iconEdit);
    btnEditar.addEventListener("click", () => {
      card.classList.add("editando");
    });

    // ===== AÇÕES DO CARD: salvar e cancelar (visíveis só em .editando) =====
    const acoesCard = document.createElement("div");
    acoesCard.classList.add("acoes-card-pergunta");

    const btnSalvarCard = document.createElement("button");
    btnSalvarCard.classList.add("btn-editar-salvar");
    const iconCheck = document.createElement("i");
    iconCheck.classList.add("fa-solid", "fa-check");
    btnSalvarCard.appendChild(iconCheck);

    const btnCancelarCard = document.createElement("button");
    btnCancelarCard.classList.add("btn-editar-cancelar");
    const iconBan = document.createElement("i");
    iconBan.classList.add("fa-solid", "fa-ban");
    btnCancelarCard.appendChild(iconBan);

    // Salva os valores originais para cancelar
    const valoresOriginais = {
      pergunta: questao.pergunta || "",
      alt_a: questao.alternativa_a || "",
      alt_b: questao.alternativa_b || "",
      alt_c: questao.alternativa_c || "",
      alt_d: questao.alternativa_d || "",
      explicacao: questao.explicacao || "",
      correta: questao.resposta_correta || "A",
    };

    btnCancelarCard.addEventListener("click", () => {
      // Restaura valores originais
      inputPergunta.value = valoresOriginais.pergunta;
      altA.input.value = valoresOriginais.alt_a;
      altB.input.value = valoresOriginais.alt_b;
      altC.input.value = valoresOriginais.alt_c;
      altD.input.value = valoresOriginais.alt_d;
      inputExplicacao.value = valoresOriginais.explicacao;
      [altA, altB, altC, altD].forEach((alt) => {
        alt.radio.checked = alt.radio.value === valoresOriginais.correta;
      });
      card.classList.remove("editando");
    });

    btnSalvarCard.addEventListener("click", async () => {
      const correta = [altA, altB, altC, altD].find((a) => a.radio.checked)?.radio.value;

      const body = {
        id: questao.id,
        quiz_id: idQuiz,
        pergunta: inputPergunta.value,
        alt_a: altA.input.value,
        alt_b: altB.input.value,
        alt_c: altC.input.value,
        alt_d: altD.input.value,
        correto: correta,
        explicacao: inputExplicacao.value,
      };

      const endpoint = questao.id ? "/atualizarPergunta" : "/novaPerguntaQuiz";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      // Se era nova pergunta, guarda o id retornado para próximos saves
      if (!questao.id && data.id) questao.id = data.id;

      // Atualiza valores originais com o que foi salvo
      valoresOriginais.pergunta = inputPergunta.value;
      valoresOriginais.alt_a = altA.input.value;
      valoresOriginais.alt_b = altB.input.value;
      valoresOriginais.alt_c = altC.input.value;
      valoresOriginais.alt_d = altD.input.value;
      valoresOriginais.explicacao = inputExplicacao.value;
      valoresOriginais.correta = correta;

      card.classList.remove("editando");
    });

    acoesCard.append(btnCancelarCard, btnSalvarCard);

    // ===== MONTAGEM =====
    card.append(
      top,
      altA.linha,
      altB.linha,
      altC.linha,
      altD.linha,
      inputExplicacao,
      btnEditar,
      acoesCard,
    );

    container.appendChild(card);

    return { id: questao.id, card, inputPergunta, altA, altB, altC, altD, inputExplicacao };
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

  document.querySelectorAll('#abas .aba').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelector('.aba.ativa')?.classList.remove('ativa');
      btn.classList.add('ativa');
    });
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
