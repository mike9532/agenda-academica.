const API_URL = "http://localhost:3000";

let token = localStorage.getItem("token");
let usuarioTipo = localStorage.getItem("usuarioTipo");

let subjects = [];
let laboratorios = [];
let turmasList = [];
let professoresList = [];
let salaslist = [];
let eventos = [];
let semestresList = [];

// A interface trabalha visualmente apenas com o 1º ao 5º semestre.
// (Não altera nada no banco: só filtra o que é exibido.)
const MAX_SEMESTRE_VISIVEL = 5;

// Status possíveis de um laboratório (mesmos valores do banco)
const STATUS_LAB = {
    disponivel: { rotulo: "Disponível", classe: "disponivel" },
    em_uso: { rotulo: "Em uso", classe: "em-uso" },
    manutencao: { rotulo: "Em manutenção", classe: "manutencao" }
};

function nomeLabComStatus(lab) {
    if (!lab.status || lab.status === "disponivel") return lab.nome;
    const info = STATUS_LAB[lab.status];
    return info ? `${lab.nome} (${info.rotulo})` : lab.nome;
}

// Monta a mensagem de erro vinda do backend.
// Quando há vários conflitos, mostra todos (um por linha).
function mensagemDeErro(resultado, padrao) {
    if (resultado && Array.isArray(resultado.conflitos) && resultado.conflitos.length) {
        return resultado.conflitos.join("\n");
    }
    return (resultado && resultado.erro) || padrao;
}

// Datas de laboratório da aula que estão sendo montadas no formulário
let datasFormulario = [];


// =========================
// LOGIN
// =========================

async function login() {
    const email = document.getElementById("login-email").value.trim();
    const senha = document.getElementById("login-senha").value.trim();
    const message = document.getElementById("login-message");

    if (!email || !senha) {
        message.textContent = "Preencha o e-mail e a senha.";
        return;
    }

    message.textContent = "Entrando...";

    try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, senha })
        });

        const data = await response.json();

        if (!response.ok) {
            message.textContent = data.erro || "E-mail ou senha inválidos.";
            return;
        }

        token = data.token;
        localStorage.setItem("token", data.token);

        if (data.usuario && data.usuario.tipo) {
            usuarioTipo = data.usuario.tipo;
            localStorage.setItem("usuarioTipo", data.usuario.tipo);
        }

        window.location.href = "agenda.html";
    } catch (error) {
        console.error("Erro no login:", error);
        message.textContent = "Não foi possível conectar ao servidor.";
    }
}


// =========================
// LOGOUT
// =========================

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuarioTipo");
    token = null;
    usuarioTipo = null;
    window.location.href = "index.html";
}


// =========================
// CARREGAR DADOS AUXILIARES (COORDENADOR)
// =========================

async function carregarDadosAuxiliares() {
    if (usuarioTipo !== "coordenador") return;

    try {
        const resTurmas = await fetch(`${API_URL}/api/turmas`, { headers: { "Authorization": `Bearer ${token}` } });
        if (resTurmas.ok) turmasList = await resTurmas.json();

        const resProf = await fetch(`${API_URL}/api/professores`, { headers: { "Authorization": `Bearer ${token}` } });
        if (resProf.ok) professoresList = await resProf.json();

        const resSalas = await fetch(`${API_URL}/api/salas`, { headers: { "Authorization": `Bearer ${token}` } });
        if (resSalas.ok) salaslist = await resSalas.json();

        const resSemestres = await fetch(`${API_URL}/api/semestres`, { headers: { "Authorization": `Bearer ${token}` } });
        if (resSemestres.ok) semestresList = await resSemestres.json();

        preencherSelectsFormulario();
        preencherSelectsEvento();
    } catch (error) {
        console.error("Erro ao carregar dados auxiliares:", error);
    }
}

// Repovoa um <select> sem perder o valor que já estava selecionado
// (o formulário pode estar em edição quando a grade recarrega)
function repovoarSelect(id, placeholder, itens, rotuloFn) {
    const sel = document.getElementById(id);
    if (!sel) return;

    const atual = sel.value;
    sel.innerHTML = "";
    sel.appendChild(new Option(placeholder, ""));
    itens.forEach(item => sel.appendChild(new Option(rotuloFn(item), item.id)));

    if (atual && Array.from(sel.options).some(o => o.value === atual)) {
        sel.value = atual;
    }
}

function preencherSelectsFormulario() {
    repovoarSelect("nova-aula-turma", "Selecione uma turma", turmasVisiveis(),
        t => `Turma: ${t.codigo} (${t.curso_nome || 'ADS'} - ${t.semestre_descricao || ''})`);

    repovoarSelect("nova-aula-professor", "Selecione um professor", professoresList, p => p.nome);

    repovoarSelect("nova-aula-sala", "Selecione a sala", salaslist,
        s => s.bloco ? `${s.nome} (${s.bloco})` : s.nome);

    repovoarSelect("nova-aula-laboratorio", "Selecione o laboratório", laboratorios, nomeLabComStatus);
}


// =========================
// TURMAS E SEMESTRES VISÍVEIS (1º ao 5º)
// =========================

function turmasVisiveis() {
    return turmasList.filter(t => t.semestre_numero == null || Number(t.semestre_numero) <= MAX_SEMESTRE_VISIVEL);
}

function semestresVisiveis() {
    return semestresList.filter(sem => Number(sem.numero) <= MAX_SEMESTRE_VISIVEL);
}

function preencherSelectsEvento() {
    repovoarSelect("evento-professor", "Selecione o professor", professoresList, p => p.nome);

    const selSala = document.getElementById("evento-sala");
    if (selSala) {
        selSala.innerHTML = "";
        selSala.appendChild(new Option("Selecione a sala", ""));
        salaslist.forEach(sala => {
            selSala.appendChild(new Option(sala.bloco ? `${sala.nome} (${sala.bloco})` : sala.nome, sala.id));
        });
    }

    const selLab = document.getElementById("evento-laboratorio");
    if (selLab) {
        selLab.innerHTML = "";
        selLab.appendChild(new Option("Selecione o laboratório", ""));
        laboratorios.forEach(lab => {
            selLab.appendChild(new Option(nomeLabComStatus(lab), lab.id));
        });
    }

    const selSem = document.getElementById("evento-semestre");
    if (selSem) {
        selSem.innerHTML = "";
        selSem.appendChild(new Option("Selecione o semestre", ""));
        semestresVisiveis().forEach(sem => {
            selSem.appendChild(new Option(sem.descricao || `${sem.numero}º Semestre`, sem.id));
        });
    }

    atualizarTurmasEvento();
}

// Lista apenas as turmas que já existem no banco para o semestre escolhido.
// Se o semestre não tem turma cadastrada, nada é inventado.
function atualizarTurmasEvento(turmaSelecionada) {
    const selSem = document.getElementById("evento-semestre");
    const selTurma = document.getElementById("evento-turma");
    if (!selSem || !selTurma) return;

    selTurma.innerHTML = "";

    if (!selSem.value) {
        selTurma.appendChild(new Option("Selecione o semestre primeiro", ""));
        return;
    }

    const turmas = turmasVisiveis().filter(t => String(t.semestre_id) === String(selSem.value));

    if (turmas.length === 0) {
        selTurma.appendChild(new Option("Nenhuma turma cadastrada", ""));
        return;
    }

    selTurma.appendChild(new Option("Selecione a turma", ""));
    turmas.forEach(t => {
        selTurma.appendChild(new Option(`Turma: ${t.codigo} (${t.curso_nome || "ADS"})`, t.id));
    });

    if (turmaSelecionada) selTurma.value = String(turmaSelecionada);
}


// =========================
// CARREGAR AULAS
// =========================

async function carregarAulas() {
    if (!token) {
        window.location.href = "index.html";
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/aulas`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                logout();
                return;
            }
            console.error(data);
            return;
        }

        subjects = data;

        await carregarLaboratorios();
        await carregarEventos();

        if (usuarioTipo === "coordenador") {
            await carregarDadosAuxiliares();
            renderEventosCadastrados();
            document.querySelectorAll(".col-acoes").forEach(el => el.style.display = "table-cell");
        }

        renderADS();

    } catch (error) {
        console.error("Erro ao buscar aulas:", error);
    }
}


// =========================
// FORMATAR DATA
// =========================

function formatarDataLaboratorio(data) {
    if (!data) return "-";
    const partes = data.split("-");
    if (partes.length !== 3) return data;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}


// =========================
// FORMATAR DATA DA AULA
// =========================

function normalizarData(d) {
    return d ? String(d).substring(0, 10) : "";
}

const NOMES_DIAS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

function diaSemanaDe(dataStr) {
    const [a, m, d] = normalizarData(dataStr).split("-").map(Number);
    return NOMES_DIAS[new Date(a, m - 1, d).getDay()];
}

function hojeISO() {
    const h = new Date();
    return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, "0")}-${String(h.getDate()).padStart(2, "0")}`;
}

// Datas de laboratório da aula, cadastradas manualmente (ordenadas).
// Não existe cálculo automático de data a partir do dia da semana.
function datasDaAula(aula) {
    return (aula.datas_laboratorio || [])
        .map(d => normalizarData(d.data_laboratorio))
        .filter(Boolean)
        .sort();
}

// Chip de uma data. Com onRemover mostra o botão × (usado só no formulário da aula).
function criarChipData(dataISO, onRemover) {
    const chip = document.createElement("span");
    chip.className = "data-chip";
    chip.title = diaSemanaDe(dataISO);
    if (dataISO < hojeISO()) chip.classList.add("passada");

    chip.appendChild(document.createTextNode(formatarDataLaboratorio(dataISO)));

    if (onRemover) {
        const remover = document.createElement("button");
        remover.type = "button";
        remover.className = "data-chip-remove";
        remover.title = "Remover data";
        remover.setAttribute("aria-label", `Remover ${formatarDataLaboratorio(dataISO)}`);
        remover.textContent = "×";
        remover.addEventListener("click", onRemover);
        chip.appendChild(remover);
    } else {
        chip.classList.add("somente-leitura");
    }

    return chip;
}

function preencherCelulaDatas(td, datas) {
    if (!datas.length) {
        const vazio = document.createElement("span");
        vazio.className = "sem-datas";
        vazio.textContent = "Sem datas";
        td.appendChild(vazio);
        return;
    }
    datas.forEach(d => td.appendChild(criarChipData(d)));
}


// =========================
// RENDER DA GRADE
// =========================

function criarBotaoAcao(texto, classe, aoClicar) {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.textContent = texto;
    botao.className = `btn-acao ${classe}`;
    botao.addEventListener("click", aoClicar);
    return botao;
}

// Uma aula = uma linha, cada informação em sua coluna:
// Dia | Horário | Turma | Disciplina | Professor | Sala | Laboratório | Datas | Ações
function criarLinhaAula(aula) {
    const tr = document.createElement("tr");

    const horarioFormatado = (aula.horario_inicio && aula.horario_termino)
        ? `${aula.horario_inicio.substring(0, 5)} - ${aula.horario_termino.substring(0, 5)}`
        : (aula.horario_inicio ? aula.horario_inicio.substring(0, 5) : (aula.horario || "-"));

    const turmaSemestre = (aula.turma && aula.semestre && Number(aula.semestre) <= MAX_SEMESTRE_VISIVEL)
        ? `${aula.turma} (${aula.semestre}º Sem.)`
        : (aula.turma || "-");

    tr.innerHTML = `
        <td>${escaparHtml(aula.dia_semana || "-")}</td>
        <td>${escaparHtml(horarioFormatado)}</td>
        <td>${escaparHtml(turmaSemestre)}</td>
        <td class="col-texto">${escaparHtml(aula.disciplina || "-")}</td>
        <td class="col-texto">${escaparHtml(aula.professor || "-")}</td>
        <td>${escaparHtml(nomeSalaDaAula(aula) || "-")}</td>
        <td class="lab-cell"></td>
        <td class="datas-chips"></td>
    `;

    tr.querySelector(".lab-cell").appendChild(criarCelulaLaboratorio(aula));
    preencherCelulaDatas(tr.querySelector(".datas-chips"), datasDaAula(aula));

    if (usuarioTipo === "coordenador") {
        const tdAcoes = document.createElement("td");
        tdAcoes.className = "col-acoes-cell";
        tdAcoes.appendChild(criarBotaoAcao("Editar", "btn-editar", () => prepararEdicaoAula(aula.id)));
        tdAcoes.appendChild(criarBotaoAcao("Excluir", "btn-excluir", () => excluirAula(aula.id)));
        tr.appendChild(tdAcoes);
    }

    return tr;
}

function renderADS() {
    const tbody = document.getElementById("schedule-body");
    if (!tbody) return;

    tbody.innerHTML = "";

    subjects.forEach(aula => tbody.appendChild(criarLinhaAula(aula)));

    // Eventos / provas cadastrados também aparecem na grade
    eventosDaGrade().forEach(ev => tbody.appendChild(criarLinhaEvento(ev)));

    if (!tbody.children.length) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = usuarioTipo === "coordenador" ? 9 : 8;
        td.textContent = "Nenhuma aula cadastrada.";
        tr.appendChild(td);
        tbody.appendChild(tr);
    }
}


// =========================
// CÉLULA DE LABORATÓRIO
// =========================

function criarCelulaLaboratorio(aula) {
    const wrapper = document.createElement("div");
    wrapper.className = "lab-cell-content";

    if (usuarioTipo === "coordenador") {
        wrapper.appendChild(criarSelectLaboratorio(aula));
        if (aula.laboratorio) wrapper.appendChild(criarSeloStatusLaboratorio(aula.laboratorio));
    } else if (aula.laboratorio) {
        const nome = document.createElement("span");
        nome.textContent = aula.laboratorio;
        wrapper.appendChild(nome);
        wrapper.appendChild(criarSeloStatusLaboratorio(aula.laboratorio));
    } else {
        wrapper.textContent = "-";
    }

    return wrapper;
}


function criarSeloStatusLaboratorio(nomeLaboratorio) {
    const selo = document.createElement("span");
    const laboratorio = laboratorios.find(item => item.nome === nomeLaboratorio);
    const info = laboratorio ? STATUS_LAB[laboratorio.status] : null;

    if (!info) {
        selo.className = "lab-status-pill indefinido";
        selo.textContent = "Sem status";
        return selo;
    }

    selo.className = `lab-status-pill ${info.classe}`;
    selo.textContent = info.rotulo;
    return selo;
}


// Troca de laboratório direto na tabela (somente coordenador).
// O valor de cada opção é o ID do laboratório.
function criarSelectLaboratorio(aula) {
    const select = document.createElement("select");
    select.className = "lab-select";
    const valorAtual = aula.laboratorio_id ? String(aula.laboratorio_id) : "";
    select.dataset.valorAtual = valorAtual;

    select.appendChild(new Option("Sem laboratório", ""));

    laboratorios.forEach(lab => {
        select.appendChild(new Option(nomeLabComStatus(lab), lab.id));
    });

    if (valorAtual && !Array.from(select.options).some(o => o.value === valorAtual)) {
        select.appendChild(new Option(aula.laboratorio || `Lab ${valorAtual}`, valorAtual));
    }

    select.value = valorAtual;

    select.addEventListener("change", () => {
        atualizarLaboratorioAula(aula.id, select.value, select);
    });

    return select;
}


async function atualizarLaboratorioAula(aulaId, novoLaboratorioId, selectElement) {
    const valorAnterior = selectElement.dataset.valorAtual || "";
    selectElement.disabled = true;

    try {
        const response = await fetch(`${API_URL}/api/aulas/${aulaId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ laboratorio_id: novoLaboratorioId ? Number(novoLaboratorioId) : null })
        });

        const resultado = await response.json();

        if (!response.ok) {
            alert(mensagemDeErro(resultado, "Não foi possível atualizar o laboratório."));
            selectElement.value = valorAnterior;
            selectElement.disabled = false;
            return;
        }

        await carregarAulas();
    } catch (error) {
        console.error("Erro ao atualizar laboratório:", error);
        alert("Erro ao conectar com o servidor.");
        selectElement.value = valorAnterior;
        selectElement.disabled = false;
    }
}


// =========================
// CADASTRAR / SALVAR AULA (COORDENADOR)
// =========================

async function salvarAula() {
    const idEdicao = document.getElementById("aula-id-editar").value;
    const turma_id = document.getElementById("nova-aula-turma").value;
    const disciplinaNome = document.getElementById("nova-aula-disciplina").value.trim(); // Texto livre digitado
    const professor_id = document.getElementById("nova-aula-professor").value;
    const sala_id = document.getElementById("nova-aula-sala").value;
    const laboratorio_id = document.getElementById("nova-aula-laboratorio").value;
    const dia_semana = document.getElementById("nova-aula-dia").value;
    const horario_inicio = document.getElementById("nova-aula-inicio").value;
    const horario_termino = document.getElementById("nova-aula-fim").value;
    const message = document.getElementById("nova-aula-message");

    if (!turma_id || !disciplinaNome || !professor_id || !dia_semana || !horario_inicio || !horario_termino) {
        message.style.color = "red";
        message.textContent = "Preencha todos os campos obrigatórios (Turma, Disciplina, Professor, Dia, Início e Término).";
        return;
    }

    if (horario_termino <= horario_inicio) {
        message.style.color = "red";
        message.textContent = "O horário de término deve ser depois do início.";
        return;
    }

    message.style.color = "#333";
    message.textContent = "Salvando aula...";

    const dadosAula = {
        turma_id: parseInt(turma_id),
        disciplina_nome: disciplinaNome, // Envia o nome da disciplina digitado livremente
        professor_id: parseInt(professor_id),
        sala_id: sala_id ? parseInt(sala_id) : null,
        laboratorio_id: laboratorio_id ? parseInt(laboratorio_id) : null,
        dia_semana,
        horario_inicio: horario_inicio.length === 5 ? horario_inicio + ":00" : horario_inicio,
        horario_termino: horario_termino.length === 5 ? horario_termino + ":00" : horario_termino,
        // Lista completa das datas reais de laboratório desta aula
        datas: [...datasFormulario]
    };

    try {
        const url = idEdicao ? `${API_URL}/api/aulas/${idEdicao}` : `${API_URL}/api/aulas`;
        const method = idEdicao ? "PUT" : "POST";

        const response = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(dadosAula)
        });

        const resultado = await response.json();

        if (!response.ok) {
            message.style.color = "red";
            message.textContent = mensagemDeErro(resultado, "Erro ao salvar aula.");
            return;
        }

        const textoSucesso = resultado.mensagem || "Operação realizada com sucesso!";

        cancelarEdicaoAula();

        message.style.color = "green";
        message.textContent = textoSucesso;

        await carregarAulas();
    } catch (error) {
        console.error("Erro ao salvar aula:", error);
        message.style.color = "red";
        message.textContent = "Erro de conexão com o servidor.";
    }
}


function prepararEdicaoAula(id) {
    const aula = subjects.find(a => Number(a.id) === Number(id));
    if (!aula) return;

    document.getElementById("aula-id-editar").value = aula.id;
    const selTurmaAula = document.getElementById("nova-aula-turma");
    if (aula.turma_id && !Array.from(selTurmaAula.options).some(o => o.value === String(aula.turma_id))) {
        selTurmaAula.appendChild(new Option(`Turma: ${aula.turma || aula.turma_id}`, aula.turma_id));
    }
    selTurmaAula.value = aula.turma_id || "";
    document.getElementById("nova-aula-disciplina").value = aula.disciplina || aula.disciplina_nome || "";
    document.getElementById("nova-aula-professor").value = aula.professor_id || "";
    document.getElementById("nova-aula-sala").value = aula.sala_id || "";
    document.getElementById("nova-aula-laboratorio").value = aula.laboratorio_id || "";
    document.getElementById("nova-aula-dia").value = aula.dia_semana || "Segunda-feira";
    document.getElementById("nova-aula-inicio").value = aula.horario_inicio ? aula.horario_inicio.substring(0, 5) : "";
    document.getElementById("nova-aula-fim").value = aula.horario_termino ? aula.horario_termino.substring(0, 5) : "";

    // Datas de laboratório já cadastradas para esta aula
    datasFormulario = datasDaAula(aula);
    document.getElementById("nova-aula-data-lab").value = "";
    document.getElementById("nova-aula-datas-message").textContent = "";
    renderDatasFormulario();

    document.getElementById("nova-aula-message").textContent = "";
    document.getElementById("form-aula-title").textContent = `Editar Aula: ${aula.disciplina || ""}`;
    document.getElementById("btn-salvar-aula").textContent = "Salvar Alterações";
    document.getElementById("btn-cancelar-aula").style.display = "inline-block";

    document.getElementById("form-aula-title").scrollIntoView({ behavior: "smooth", block: "start" });
}


function cancelarEdicaoAula() {
    document.getElementById("aula-id-editar").value = "";
    document.getElementById("form-aula-title").textContent = "Cadastrar Nova Aula";
    document.getElementById("btn-salvar-aula").textContent = "Cadastrar Aula";
    document.getElementById("btn-cancelar-aula").style.display = "none";

    document.getElementById("nova-aula-turma").value = "";
    document.getElementById("nova-aula-disciplina").value = "";
    document.getElementById("nova-aula-professor").value = "";
    document.getElementById("nova-aula-sala").value = "";
    document.getElementById("nova-aula-laboratorio").value = "";
    document.getElementById("nova-aula-inicio").value = "";
    document.getElementById("nova-aula-fim").value = "";
    document.getElementById("nova-aula-message").textContent = "";

    datasFormulario = [];
    document.getElementById("nova-aula-data-lab").value = "";
    document.getElementById("nova-aula-datas-message").textContent = "";
    renderDatasFormulario();
}


async function excluirAula(id) {
    if (!confirm("Tem certeza que deseja excluir esta aula?")) return;

    try {
        const response = await fetch(`${API_URL}/api/aulas/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });

        const resultado = await response.json();

        if (!response.ok) {
            alert(mensagemDeErro(resultado, "Não foi possível excluir a aula."));
            return;
        }

        alert("Aula excluída com sucesso!");
        await carregarAulas();
    } catch (error) {
        console.error("Erro ao excluir aula:", error);
        alert("Erro ao conectar com o servidor.");
    }
}


// =========================
// EVENTOS / PROVAS PERSONALIZADAS
// =========================

function escaparHtml(texto) {
    const mapa = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return String(texto ?? "").replace(/[&<>"']/g, c => mapa[c]);
}

async function carregarEventos() {
    try {
        const response = await fetch(`${API_URL}/api/datas-laboratorio`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        const data = await response.json();
        eventos = (response.ok && Array.isArray(data)) ? data : [];
    } catch (error) {
        console.error("Erro ao buscar eventos:", error);
        eventos = [];
    }
}


function nomeSalaDaAula(aula) {
    if (aula.sala) return aula.sala;
    if (aula.sala_nome) return aula.sala_nome;
    const sala = salaslist.find(s => String(s.id) === String(aula.sala_id));
    return sala ? sala.nome : "";
}


function criarRotuloSala(nome) {
    const span = document.createElement("span");
    span.className = "lab-sala";
    span.textContent = `Sala: ${nome}`;
    return span;
}


function semestreVisivel(ev) {
    const numero = Number(ev.semestre);
    return numero && numero <= MAX_SEMESTRE_VISIVEL ? numero : null;
}


function formatarHorarioEvento(ev) {
    if (!ev.horario_inicio) return "-";
    return ev.horario_termino ? `${ev.horario_inicio} - ${ev.horario_termino}` : ev.horario_inicio;
}


// Dia da semana do evento: usa o que vier da API ou calcula pela data
function diaSemanaDoEvento(ev) {
    if (ev.dia_semana) return ev.dia_semana;
    return ev.data_laboratorio ? diaSemanaDe(ev.data_laboratorio) : "-";
}


function formatarTurmaSemestreEvento(ev) {
    const sem = semestreVisivel(ev);
    if (ev.turma && sem) return `${ev.turma} (${sem}º Sem.)`;
    if (ev.turma) return ev.turma;
    if (sem) return `${sem}º Semestre`;
    return "-";
}


// Somente eventos que têm data e horário entram na Grade Horária
function eventosDaGrade() {
    return eventos.filter(ev => ev.data_laboratorio && ev.horario_inicio);
}


function criarBotoesEvento(ev) {
    const fragmento = document.createDocumentFragment();

    const botaoEditar = document.createElement("button");
    botaoEditar.type = "button";
    botaoEditar.textContent = "Editar";
    botaoEditar.className = "btn-acao btn-editar";
    botaoEditar.addEventListener("click", () => prepararEdicaoEvento(ev.id));
    fragmento.appendChild(botaoEditar);

    const botaoExcluir = document.createElement("button");
    botaoExcluir.type = "button";
    botaoExcluir.textContent = "Excluir";
    botaoExcluir.className = "btn-acao btn-excluir";
    botaoExcluir.addEventListener("click", () => excluirEvento(ev.id));
    fragmento.appendChild(botaoExcluir);

    return fragmento;
}


// Linha do evento na Grade Horária - Noturno (mesmas colunas da aula)
function criarLinhaEvento(ev) {
    const tr = document.createElement("tr");
    tr.className = "evento-row";

    tr.innerHTML = `
        <td>${escaparHtml(diaSemanaDoEvento(ev))}</td>
        <td>${escaparHtml(formatarHorarioEvento(ev))}</td>
        <td>${escaparHtml(formatarTurmaSemestreEvento(ev))}</td>
        <td class="col-texto">${escaparHtml(ev.titulo)} <span class="evento-tag">Evento</span></td>
        <td>${escaparHtml(ev.professor || "-")}</td>
        <td>${escaparHtml(ev.sala || "-")}</td>
        <td class="lab-cell"></td>
        <td class="datas-chips"></td>
    `;

    const tdLab = tr.querySelector(".lab-cell");
    const wrapper = document.createElement("div");
    wrapper.className = "lab-cell-content";

    if (ev.laboratorio) {
        const nome = document.createElement("span");
        nome.textContent = ev.laboratorio;
        wrapper.appendChild(nome);
        wrapper.appendChild(criarSeloStatusLaboratorio(ev.laboratorio));
    } else {
        wrapper.textContent = "-";
    }
    tdLab.appendChild(wrapper);

    preencherCelulaDatas(tr.querySelector(".datas-chips"), [normalizarData(ev.data_laboratorio)]);

    if (usuarioTipo === "coordenador") {
        const tdAcoes = document.createElement("td");
        tdAcoes.className = "col-acoes-cell";
        tdAcoes.appendChild(criarBotoesEvento(ev));
        tr.appendChild(tdAcoes);
    }

    return tr;
}


// Tabela "Eventos Cadastrados" (coordenador)
function renderEventosCadastrados() {
    const tbody = document.getElementById("eventos-body");
    if (!tbody) return;

    tbody.innerHTML = "";

    // A API já devolve só eventos/provas; datas de aula ficam no cadastro da aula
    const soEventos = eventos.filter(ev => !ev.aula_id);

    if (soEventos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9">Nenhum evento ou prova cadastrada.</td></tr>';
        return;
    }

    soEventos.forEach(ev => {
        const tr = document.createElement("tr");
        const sem = semestreVisivel(ev);

        tr.innerHTML = `
            <td>${formatarDataLaboratorio(ev.data_laboratorio)}</td>
            <td>${escaparHtml(diaSemanaDoEvento(ev))}</td>
            <td>${formatarHorarioEvento(ev)}</td>
            <td>${escaparHtml(ev.titulo)}</td>
            <td>${escaparHtml(ev.professor || "-")}</td>
            <td>${escaparHtml(ev.sala || "-")}</td>
            <td>${escaparHtml(ev.laboratorio || "-")}</td>
            <td>${sem ? `${sem}º Semestre` : "-"}</td>
            <td></td>
        `;

        tr.lastElementChild.appendChild(criarBotoesEvento(ev));
        tbody.appendChild(tr);
    });
}


// Cadastra um evento novo ou atualiza o existente (sem duplicar)
async function salvarEvento() {
    const idEdicao = document.getElementById("evento-id-editar").value;
    const titulo = document.getElementById("evento-titulo").value.trim();
    const data = document.getElementById("data-laboratorio").value;
    const inicio = document.getElementById("evento-inicio").value;
    const fim = document.getElementById("evento-fim").value;
    const salaId = document.getElementById("evento-sala").value;
    const laboratorioId = document.getElementById("evento-laboratorio").value;
    const semestreId = document.getElementById("evento-semestre").value;
    const turmaId = document.getElementById("evento-turma").value;
    const professorId = document.getElementById("evento-professor").value;
    const message = document.getElementById("data-message");

    if (!titulo || !data || !inicio) {
        message.style.color = "red";
        message.textContent = "Preencha o evento/disciplina, a data e o horário de início.";
        return;
    }

    if (fim && fim <= inicio) {
        message.style.color = "red";
        message.textContent = "O horário de término deve ser depois do início.";
        return;
    }

    message.style.color = "#333";
    message.textContent = "Salvando evento...";

    const dados = {
        titulo,
        data_laboratorio: data,
        horario_inicio: inicio,
        horario_termino: fim || null,
        sala_id: salaId ? parseInt(salaId) : null,
        laboratorio_id: laboratorioId ? parseInt(laboratorioId) : null,
        professor_id: professorId ? parseInt(professorId) : null,
        turma_id: turmaId ? parseInt(turmaId) : null,
        semestre_id: semestreId ? parseInt(semestreId) : null
    };

    try {
        const url = idEdicao ? `${API_URL}/api/datas-laboratorio/${idEdicao}` : `${API_URL}/api/datas-laboratorio`;
        const method = idEdicao ? "PUT" : "POST";

        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(dados)
        });

        const resultado = await response.json();

        if (!response.ok) {
            message.style.color = "red";
            message.textContent = mensagemDeErro(resultado, "Não foi possível salvar o evento.");
            return;
        }

        limparFormularioEvento();
        message.style.color = "green";
        message.textContent = resultado.mensagem || "Evento salvo com sucesso!";

        await carregarAulas();
    } catch (error) {
        console.error("Erro ao salvar evento:", error);
        message.style.color = "red";
        message.textContent = "Erro ao conectar com o servidor.";
    }
}


function prepararEdicaoEvento(id) {
    const ev = eventos.find(e => Number(e.id) === Number(id));
    if (!ev) return;

    document.getElementById("evento-id-editar").value = ev.id;
    document.getElementById("evento-titulo").value = ev.titulo || "";
    document.getElementById("data-laboratorio").value = ev.data_laboratorio || "";
    document.getElementById("evento-inicio").value = ev.horario_inicio || "";
    document.getElementById("evento-fim").value = ev.horario_termino || "";
    document.getElementById("evento-sala").value = ev.sala_id || "";
    document.getElementById("evento-laboratorio").value = ev.laboratorio_id || "";
    document.getElementById("evento-professor").value = ev.professor_id || "";
    document.getElementById("evento-semestre").value = ev.semestre_id || "";
    atualizarTurmasEvento(ev.turma_id);

    document.getElementById("form-evento-title").textContent = "Editar Evento (ID: " + ev.id + ")";
    document.getElementById("btn-salvar-evento").textContent = "Salvar Alterações";
    document.getElementById("btn-cancelar-evento").style.display = "inline-block";
    document.getElementById("data-message").textContent = "";

    document.getElementById("form-evento-title").scrollIntoView({ behavior: "smooth", block: "start" });
}


function limparFormularioEvento() {
    document.getElementById("evento-id-editar").value = "";
    document.getElementById("evento-titulo").value = "";
    document.getElementById("data-laboratorio").value = "";
    document.getElementById("evento-inicio").value = "";
    document.getElementById("evento-fim").value = "";
    document.getElementById("evento-sala").value = "";
    document.getElementById("evento-laboratorio").value = "";
    document.getElementById("evento-professor").value = "";
    document.getElementById("evento-semestre").value = "";
    atualizarTurmasEvento();

    document.getElementById("form-evento-title").textContent = "Agendar Evento ou Prova Personalizada";
    document.getElementById("btn-salvar-evento").textContent = "+ Adicionar Evento";
    document.getElementById("btn-cancelar-evento").style.display = "none";
}


function cancelarEdicaoEvento() {
    limparFormularioEvento();
    document.getElementById("data-message").textContent = "";
}


async function excluirEvento(id) {
    if (!confirm("Tem certeza que deseja excluir este evento?")) return;

    try {
        const response = await fetch(`${API_URL}/api/datas-laboratorio/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) {
            const resultado = await response.json().catch(() => ({}));
            alert(resultado.erro || "Não foi possível excluir o evento.");
            return;
        }

        if (String(document.getElementById("evento-id-editar").value) === String(id)) {
            limparFormularioEvento();
        }

        alert("Evento excluído com sucesso!");
        await carregarAulas();
    } catch (error) {
        console.error("Erro ao excluir evento:", error);
        alert("Erro ao conectar com o servidor.");
    }
}


// ==================================================
// LABORATÓRIOS
// ==================================================

async function carregarLaboratorios() {
    try {
        const response = await fetch(`${API_URL}/api/laboratorios`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        const data = await response.json();
        if (!response.ok) return;

        laboratorios = data;
        preencherSelectLaboratorioAdmin();
        atualizarStatusSelecionado();
    } catch (error) {
        console.error("Erro ao buscar laboratórios:", error);
    }
}


// Select "Alterar status de um laboratório" (mostra o status atual de cada um)
function preencherSelectLaboratorioAdmin() {
    const sel = document.getElementById("laboratorio-select");
    if (!sel) return;

    const atual = sel.value;
    sel.innerHTML = "";
    sel.appendChild(new Option("Selecione um laboratório", ""));
    laboratorios.forEach(lab => sel.appendChild(new Option(nomeLabComStatus(lab), lab.id)));

    if (atual && Array.from(sel.options).some(o => o.value === atual)) {
        sel.value = atual;
    }
}


function atualizarStatusSelecionado() {
    const laboratorioSelect = document.getElementById("laboratorio-select");
    const statusSelect = document.getElementById("status-laboratorio-select");

    if (!laboratorioSelect || !statusSelect) return;
    const laboratorioId = laboratorioSelect.value;
    if (!laboratorioId) return;

    const laboratorio = laboratorios.find(item => String(item.id) === String(laboratorioId));
    if (laboratorio) {
        statusSelect.value = laboratorio.status;
    }
}


async function alterarStatusLaboratorio() {
    const laboratorioSelect = document.getElementById("laboratorio-select");
    const statusSelect = document.getElementById("status-laboratorio-select");
    const message = document.getElementById("laboratorio-message");

    const laboratorioId = laboratorioSelect.value;
    const status = statusSelect.value;

    if (!laboratorioId) {
        message.textContent = "Selecione um laboratório.";
        return;
    }

    message.textContent = "Salvando...";

    try {
        const response = await fetch(`${API_URL}/api/laboratorios/${laboratorioId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });

        const resultado = await response.json();
        if (!response.ok) {
            message.textContent = resultado.erro || "Não foi possível alterar o status.";
            return;
        }

        message.textContent = "Status atualizado com sucesso!";
        await carregarAulas(); // recarrega a grade para atualizar os selos de status
    } catch (error) {
        console.error("Erro ao alterar status:", error);
        message.textContent = "Erro ao conectar com o servidor.";
    }
}


// ==================================================
// DATAS DE LABORATÓRIO NO FORMULÁRIO DA AULA
// (única forma de cadastrar datas: Administração da Grade → aula)
// As datas ficam na lista abaixo e só são gravadas no banco
// quando o coordenador clica em "Cadastrar Aula" / "Salvar Alterações".
// ==================================================

function renderDatasFormulario() {
    const lista = document.getElementById("nova-aula-datas-lista");
    if (!lista) return;

    lista.innerHTML = "";

    if (!datasFormulario.length) {
        const vazio = document.createElement("span");
        vazio.className = "sem-datas";
        vazio.textContent = "Nenhuma data adicionada ainda.";
        lista.appendChild(vazio);
        return;
    }

    [...datasFormulario].sort().forEach(data => {
        lista.appendChild(criarChipData(data, () => removerDataFormulario(data)));
    });
}

function adicionarDataFormulario() {
    const input = document.getElementById("nova-aula-data-lab");
    const message = document.getElementById("nova-aula-datas-message");
    const data = input.value;

    message.style.color = "red";

    if (!data) {
        message.textContent = "Selecione a data da aula.";
        return;
    }

    if (datasFormulario.includes(data)) {
        message.textContent = `Esta aula já possui uma data cadastrada para ${formatarDataLaboratorio(data)}.`;
        return;
    }

    datasFormulario.push(data);
    datasFormulario.sort();
    input.value = "";
    renderDatasFormulario();

    // Aviso (não bloqueia): a data é independente do dia da semana da aula
    const diaAula = document.getElementById("nova-aula-dia").value;
    const diaData = diaSemanaDe(data);

    if (diaData !== diaAula) {
        message.style.color = "#b26a00";
        message.textContent = `Data adicionada. Atenção: ${formatarDataLaboratorio(data)} é ${diaData.toLowerCase()} e a aula está configurada para ${diaAula.toLowerCase()}.`;
    } else {
        message.textContent = "";
    }
}

function removerDataFormulario(data) {
    datasFormulario = datasFormulario.filter(d => d !== data);
    renderDatasFormulario();
    document.getElementById("nova-aula-datas-message").textContent = "";
}


// =========================
// NAVEGAÇÃO DO COORDENADOR
// (painel inicial = consulta da grade / editar grade / gerenciar eventos)
// Não altera nenhuma função de carregamento, cadastro ou API.
// =========================

function mostrarPainelInicial() {
    const editarGrade = document.getElementById("painel-editar-grade");
    const eventos = document.getElementById("painel-eventos");
    if (editarGrade) editarGrade.style.display = "none";
    if (eventos) eventos.style.display = "none";
}

function mostrarEditarGrade() {
    const editarGrade = document.getElementById("painel-editar-grade");
    const eventos = document.getElementById("painel-eventos");
    if (eventos) eventos.style.display = "none";
    if (editarGrade) {
        editarGrade.style.display = "block";
        editarGrade.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

function mostrarGerenciarEventos() {
    const editarGrade = document.getElementById("painel-editar-grade");
    const eventos = document.getElementById("painel-eventos");
    if (editarGrade) editarGrade.style.display = "none";
    if (eventos) {
        eventos.style.display = "block";
        eventos.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}


// =========================
// PESQUISAR CURSO E ABAS
// =========================

function searchCourse() {
    const input = document.getElementById("search-input");
    const message = document.getElementById("search-message");
    const grade = document.getElementById("ads-grade");

    if (!input || !message || !grade) return;
    const texto = input.value.trim().toLowerCase();

    if (texto === "ads" || texto.includes("análise") || texto.includes("analise") || texto.includes("desenvolvimento")) {
        if (!token) {
            grade.style.display = "none";
            message.textContent = "Faça login para visualizar a grade.";
            return;
        }
        message.textContent = "";
        grade.style.display = "block";
        renderADS();
    } else if (texto) {
        grade.style.display = "none";
        message.textContent = "Ainda não possui a grade horária no site. Aguarde atualizações.";
    } else {
        grade.style.display = "none";
        message.textContent = "";
    }
}


function showTab(tabId) {
    document.querySelectorAll(".tab-button").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));

    const aba = document.getElementById(tabId);
    if (aba) aba.classList.add("active");
}


// =========================
// INICIALIZAÇÃO
// =========================

document.addEventListener("DOMContentLoaded", function () {
    if (window.location.pathname.includes("agenda.html")) {
        if (!token) {
            window.location.href = "index.html";
            return;
        }

        const painelCoordenador = document.getElementById("coordenador-panel");
        if (painelCoordenador && usuarioTipo === "coordenador") {
            painelCoordenador.style.display = "block";
        }

        const navCoordenador = document.getElementById("coordenador-nav");
        if (navCoordenador && usuarioTipo === "coordenador") {
            navCoordenador.style.display = "flex";
        }

        // Painel inicial do coordenador = tela de consulta (grade),
        // as sub-telas de administração começam ocultas.
        mostrarPainelInicial();

        const dicaLaboratorio = document.getElementById("lab-edit-hint");
        if (dicaLaboratorio && usuarioTipo === "coordenador") {
            dicaLaboratorio.style.display = "block";
        }

        const laboratorioSelect = document.getElementById("laboratorio-select");
        if (laboratorioSelect) {
            laboratorioSelect.addEventListener("change", atualizarStatusSelecionado);
        }

        renderDatasFormulario();

        carregarAulas();
    }
});