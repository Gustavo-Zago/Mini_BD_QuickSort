const API = "";

const inputBusca = document.getElementById("input-busca");
const selCampo = document.getElementById("sel-campo");
const selTipo = document.getElementById("sel-tipo");
const btnBuscar = document.getElementById("btn-buscar");
const metaDiv = document.getElementById("meta");
const tabelaWrap = document.getElementById("tabela-wrap");
const dot = document.getElementById("dot");
const statusTxt = document.getElementById("status-txt");

let servidorPronto = false;
let debounceTimer = null;

async function verificarStatus() {
  try {
    const r = await fetch(API + "/status");
    const d = await r.json();
    if (d.pronto) {
      dot.className = "dot ok";
      statusTxt.textContent = `Pronto · ${d.registros.toLocaleString("pt-BR")} registros carregados`;
      servidorPronto = true;
      btnBuscar.disabled = false;
    } else if (d.erro) {
      dot.className = "dot err";
      statusTxt.textContent = "Erro: " + d.erro;
    } else {
      setTimeout(verificarStatus, 1500);
    }
  } catch {
    dot.className = "dot err";
    statusTxt.textContent = "Servidor inacessível — verifique se está rodando.";
    setTimeout(verificarStatus, 3000);
  }
}

async function buscar() {
  const q = inputBusca.value.trim();
  const campo = selCampo.value;
  const tipo = selTipo.value;

  if (!q) {
    tabelaWrap.innerHTML = "";
    metaDiv.innerHTML = "";
    return;
  }
  if (!servidorPronto) return;

  metaDiv.innerHTML = '<span class="spinner"></span>';
  tabelaWrap.innerHTML = "";

  try {
    const params = new URLSearchParams({ q, campo, tipo });
    const r = await fetch(`${API}/busca?${params}`);
    const d = await r.json();

    if (!r.ok) {
      metaDiv.innerHTML = `<span style="color:var(--red)">Erro: ${d.erro}</span>`;
      return;
    }

    metaDiv.innerHTML = `
      Encontrados <span>${d.total.toLocaleString("pt-BR")}</span> resultado(s)
      em <span>${d.tempoMs} ms</span>
      ${d.truncado ? '· <span style="color:var(--yellow)">exibindo primeiros 200</span>' : ""}
    `;

    if (d.resultados.length === 0) {
      tabelaWrap.innerHTML = `
        <div class="state-box">
          <div class="icon">🔍</div>
          <div class="msg">Nenhum resultado para "<strong>${esc(q)}</strong>"</div>
        </div>`;
      return;
    }

    const ql = q.toLowerCase();
    const rows = d.resultados
      .map((item) => {
        const nomeHl =
          campo === "nome" ? realcar(item.nome, ql) : esc(item.nome);
        const endHl =
          campo === "endereco"
            ? realcar(item.endereco, ql)
            : esc(item.endereco);
        return `
        <tr>
          <td class="td-nome">${nomeHl}</td>
          <td class="td-endereco">${endHl}</td>
          <td class="td-offset">${item.offset}</td>
        </tr>`;
      })
      .join("");

    tabelaWrap.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Endereço</th>
            <th>Offset</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      ${d.truncado ? '<div class="aviso-truncado">⚠ Lista truncada em 200 registros. Use um termo mais específico.</div>' : ""}
    `;
  } catch (e) {
    metaDiv.innerHTML = `<span style="color:var(--red)">Falha na requisição: ${e.message}</span>`;
  }
}

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function realcar(texto, prefixo) {
  const t = esc(texto);
  const idx = t.toLowerCase().indexOf(prefixo.toLowerCase());
  if (idx < 0) return t;
  return (
    t.slice(0, idx) +
    `<mark class="highlight">${t.slice(idx, idx + prefixo.length)}</mark>` +
    t.slice(idx + prefixo.length)
  );
}

inputBusca.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(buscar, 280);
});

inputBusca.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    clearTimeout(debounceTimer);
    buscar();
  }
});

btnBuscar.addEventListener("click", () => {
  clearTimeout(debounceTimer);
  buscar();
});
selCampo.addEventListener("change", () => {
  if (inputBusca.value.trim()) buscar();
});
selTipo.addEventListener("change", () => {
  if (inputBusca.value.trim()) buscar();
});

btnBuscar.disabled = true;
verificarStatus();
