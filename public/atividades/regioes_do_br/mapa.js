/**
 * mapa.js — Mapa interativo do Brasil por regiões
 * Dependência: D3.js v7  (adicione no HTML antes deste script)
 * <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js"></script>
 *
 * Uso: importe este arquivo e chame initMapa() após o DOM carregar.
 * Para colorir uma região ao acertar, chame colorirRegiao("NE") etc.
 * Para resetar, chame resetarMapa().
 */

// Cores por região (estado inicial = cinza, acerto = cor da região)
const CORES_REGIOES = {
  N:  { acerto: "#378ADD", nome: "Norte" },
  NE: { acerto: "#D85A30", nome: "Nordeste" },
  CO: { acerto: "#639922", nome: "Centro-Oeste" },
  SE: { acerto: "#7F77DD", nome: "Sudeste" },
  S:  { acerto: "#BA7517", nome: "Sul" },
};

const COR_PADRAO   = "#ffffff00"; // regiões ainda não acertadas
const COR_BORDA    = "#000000";
const COR_GABARITO = "#acacac"; // revelada ao desistir

let svgMapa = null;

/**
 * Inicializa o mapa dentro do elemento #mapa-container.
 * Cria o elemento <svg> acessível e faz fetch do GeoJSON do IBGE.
 *
 * GeoJSON público das regiões brasileiras (IBGE via GitHub):
 * https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson
 * — agrupamos os estados por região via propriedade "name" ou "sigla".
 *
 * Se preferir servir o arquivo localmente, baixe e aponte GEOJSON_URL
 * para "/static/regioes.geojson" (ou similar).
 */
const GEOJSON_URL =
  "https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson";

// Mapeamento estado → sigla de região
const ESTADO_PARA_REGIAO = {
  "Acre": "N", "Amapá": "N", "Amazonas": "N", "Pará": "N",
  "Rondônia": "N", "Roraima": "N", "Tocantins": "N",
  "Alagoas": "NE", "Bahia": "NE", "Ceará": "NE", "Maranhão": "NE",
  "Paraíba": "NE", "Pernambuco": "NE", "Piauí": "NE",
  "Rio Grande do Norte": "NE", "Sergipe": "NE",
  "Distrito Federal": "CO", "Goiás": "CO",
  "Mato Grosso": "CO", "Mato Grosso do Sul": "CO",
  "Espírito Santo": "SE", "Minas Gerais": "SE",
  "Rio de Janeiro": "SE", "São Paulo": "SE",
  "Paraná": "S", "Rio Grande do Sul": "S", "Santa Catarina": "S",
};

function initMapa() {
  const container = document.getElementById("mapa-container");
  if (!container) {
    console.warn("mapa.js: elemento #mapa-container não encontrado.");
    return;
  }

  // --- SVG acessível ---
  svgMapa = d3.select(container)
    .append("svg")
    .attr("width", "100%")
    .attr("viewBox", "0 0 500 520")
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("role", "img")
    .attr("aria-labelledby", "mapa-titulo mapa-desc");

  svgMapa.append("title").attr("id", "mapa-titulo").text("Mapa do Brasil por regiões");
  svgMapa.append("desc").attr("id", "mapa-desc")
    .text("Mapa interativo do Brasil. As regiões ficam coloridas conforme os estados são acertados no jogo.");

  // Grupo principal para os paths
  const g = svgMapa.append("g").attr("id", "g-regioes");

  // Legenda de acessibilidade (visível para leitores de tela, oculta visualmente)
  const srDiv = document.createElement("div");
  srDiv.setAttribute("aria-live", "polite");
  srDiv.setAttribute("aria-atomic", "true");
  srDiv.id = "mapa-sr-status";
  srDiv.style.cssText = "position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);";
  container.appendChild(srDiv);

  // --- Fetch GeoJSON ---
  fetch(GEOJSON_URL)
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then(geojson => renderizarMapa(geojson, g))
    .catch(err => {
      console.error("mapa.js: falha ao carregar GeoJSON.", err);
      container.insertAdjacentHTML(
        "beforeend",
        '<p style="color:#888;font-size:13px;text-align:center">Mapa indisponível.</p>'
      );
    });
}

function renderizarMapa(geojson, g) {
  const projection = d3.geoMercator().fitSize([500, 520], geojson);
  const pathGen    = d3.geoPath().projection(projection);

  // Cria versão normalizada do mapeamento uma vez só
  const mapeamentoNormalizado = {};
  Object.entries(ESTADO_PARA_REGIAO).forEach(([nome, sigla]) => {
    const nomeNorm = nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    mapeamentoNormalizado[nomeNorm] = sigla;
  });

  const regioes = {};
  geojson.features.forEach(f => {
    const nomeEstado = (f.properties.name || f.properties.Name || f.properties.nome || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    const siglaReg = mapeamentoNormalizado[nomeEstado];
    if (!siglaReg) {
      console.warn("Estado não mapeado:", nomeEstado);
      return;
    }
    if (!regioes[siglaReg]) regioes[siglaReg] = [];
    regioes[siglaReg].push(f);
  });

  console.log("Regiões finais:", regioes);
console.log("N tem:", regioes["N"]?.map(f => f.properties.name));
console.log("S tem:", regioes["S"]?.map(f => f.properties.name));

  // Desenha um <g> por região contendo os estados dela
  Object.entries(regioes).forEach(([sigla, features]) => {
    const infoRegiao = CORES_REGIOES[sigla] || { nome: sigla, acerto: "#999" };

    const gRegiao = g.append("g")
      .attr("id", `regiao-${sigla}`)
      .attr("role", "group")
      .attr("aria-label", `Região ${infoRegiao.nome} — ainda não concluída`);

    features.forEach(f => {
      gRegiao.append("path")
        .datum(f)
        .attr("d", pathGen)
        .attr("fill", COR_PADRAO)
        .attr("stroke", COR_BORDA)
        .attr("stroke-width", "0.8")
        .attr("data-regiao", sigla)
        .style("transition", "fill 0.6s ease");
    });
  });
}

/**
 * Colore todos os paths de uma região ao ser concluída.
 * Chame isso de dentro de verificarConclusao() quando a região estiver completa.
 *
 * @param {string} sigla - "N" | "NE" | "CO" | "SE" | "S"
 */
function colorirRegiao(sigla) {
  if (!svgMapa) return;

  const cor       = CORES_REGIOES[sigla]?.acerto ?? "#27ae60";
  const nomeReg   = CORES_REGIOES[sigla]?.nome   ?? sigla;
  const gRegiao   = svgMapa.select(`#regiao-${sigla}`);

  if (gRegiao.empty()) return;

  // Colore os paths com transição CSS
  gRegiao.selectAll("path")
    .transition()
    .duration(600)
    .attr("fill", cor);

  // Atualiza aria-label para leitores de tela
  gRegiao.attr("aria-label", `Região ${nomeReg} — concluída`);

  // Anuncia para leitores de tela via live region
  const srEl = document.getElementById("mapa-sr-status");
  if (srEl) srEl.textContent = `Região ${nomeReg} completa!`;
}

/**
 * Revela estados não acertados com cor de gabarito (ao desistir).
 * Não sobrescreve regiões já coloridas.
 *
 * @param {string} sigla - sigla da região a revelar
 */
function revelarGabaritoRegiao(sigla) {
  if (!svgMapa) return;
  const gRegiao = svgMapa.select(`#regiao-${sigla}`);
  if (gRegiao.empty()) return;

  // Só aplica gabarito se a região ainda não foi acertada
  const jaAcertada = gRegiao.select("path").attr("fill") !== COR_PADRAO;
  if (!jaAcertada) {
    gRegiao.selectAll("path")
      .transition()
      .duration(400)
      .attr("fill", COR_GABARITO);

    const nomeReg = CORES_REGIOES[sigla]?.nome ?? sigla;
    gRegiao.attr("aria-label", `Região ${nomeReg} — não concluída`);
  }
}

/**
 * Reseta o mapa para o estado inicial (cinza).
 * Chame isso no início de cada nova partida (comecarCron).
 */
function resetarMapa() {
  if (!svgMapa) return;
  svgMapa.selectAll("path[data-regiao]")
    .transition()
    .duration(300)
    .attr("fill", COR_PADRAO);

  Object.keys(CORES_REGIOES).forEach(sigla => {
    const nomeReg = CORES_REGIOES[sigla].nome;
    svgMapa.select(`#regiao-${sigla}`)
      .attr("aria-label", `Região ${nomeReg} — ainda não concluída`);
  });

  const srEl = document.getElementById("mapa-sr-status");
  if (srEl) srEl.textContent = "";
}
