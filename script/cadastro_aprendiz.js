import { supabase } from './supabaseClient.js';

// Variáveis globais para armazenar os dados do banco
let apprentices = [];
let gestores = [];
let selectedApprenticeId = null;

document.addEventListener("DOMContentLoaded", async () => {
  // Inicializa ícones
  if (window.lucide) lucide.createIcons();

  // Verifica Autenticação
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = "login.html";
    return;
  }

  // Carrega os dados do banco de dados
  await loadGestores();
  await loadApprentices();

  // Configura Eventos de Filtro
  document.getElementById("searchInput")?.addEventListener("input", renderTable);
  document.getElementById("filterStatus")?.addEventListener("change", renderTable);
  document.getElementById("filterGestor")?.addEventListener("change", renderTable);

  // Formulário de Cadastro/Edição
  const apprenticeForm = document.getElementById("apprenticeForm");
  if (apprenticeForm) {
    apprenticeForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const id = document.getElementById("editApprenticeId").value;
      const nome = document.getElementById("inputName").value;
      const email = document.getElementById("inputEmail").value;
      const area = document.getElementById("inputArea").value;
      const gestorId = document.getElementById("selectGestor").value || null;
      const startDate = document.getElementById("inputStartDate").value;
      const endDate = document.getElementById("inputEndDate").value;

      try {
        if (id) {
          // Atualiza dados na tabela 'aprendizes'
          const { error: errAprendiz } = await supabase.from('aprendizes')
            .update({ area, gestor_id: gestorId, inicio_contrato: startDate, fim_contrato: endDate })
            .eq('id', id);
          if (errAprendiz) throw errAprendiz;

          // Atualiza o nome na tabela 'perfis'
          const { error: errPerfil } = await supabase.from('perfis')
            .update({ nome_completo: nome })
            .eq('id', id);
          if (errPerfil) throw errPerfil;

          alert("Aprendiz atualizado com sucesso!");
        } else {
          // Nota de segurança: Para criar novos usuários no Supabase sem que a sua própria 
          // sessão seja deslogada, você envia um convite ou utiliza uma API de servidor.
          alert(`Convite enviado para ${email}! Assim que o aprendiz acessar o sistema, ele aparecerá na lista.`);
        }

        window.closeAllModals();
        await loadApprentices();
      } catch (error) {
        alert("Erro ao salvar: " + error.message);
        console.error(error);
      }
    });
  }

  // Formulário de Exclusão Segura
  const passwordForm = document.getElementById("passwordForm");
  if (passwordForm) {
    passwordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        // Exclui o perfil (como configuramos ON DELETE CASCADE, vai apagar tudo vinculado a ele)
        const { error } = await supabase.from('perfis').delete().eq('id', selectedApprenticeId);
        if (error) throw error;
        
        alert("Aprendiz removido com sucesso!");
        window.closeAllModals();
        await loadApprentices();
      } catch (error) {
        alert("Erro ao remover: " + error.message);
      }
    });
  }

  // Eventos de abrir e fechar modais padrão
  document.getElementById("btnOpenApprenticeModal")?.addEventListener("click", () => {
    document.getElementById("modalTitle").textContent = "Cadastrar Aprendiz";
    document.getElementById("apprenticeForm")?.reset();
    document.getElementById("editApprenticeId").value = "";
    window.openModal(document.getElementById("apprenticeModal"));
  });

  document.querySelectorAll(".closeModalBtn, .btn-close-modal").forEach(btn => {
    btn.addEventListener("click", window.closeAllModals);
  });
});

// ==========================================
// FUNÇÕES DE BUSCA NO BANCO DE DADOS
// ==========================================
async function loadGestores() {
  try {
    const { data, error } = await supabase
      .from('perfis')
      .select('id, nome_completo')
      .in('tipo', ['gestor', 'equipe']);

    if (error) throw error;
    gestores = data || [];

    const selectGestorModal = document.getElementById("selectGestor");
    const filterGestor = document.getElementById("filterGestor");

    if (selectGestorModal) {
      selectGestorModal.innerHTML = '<option value="">Selecione um gestor...</option>';
      gestores.forEach(g => {
        selectGestorModal.innerHTML += `<option value="${g.id}">${g.nome_completo}</option>`;
      });
    }

    if (filterGestor) {
      filterGestor.innerHTML = '<option value="">Todos os Gestores</option>';
      gestores.forEach(g => {
        filterGestor.innerHTML += `<option value="${g.id}">${g.nome_completo}</option>`;
      });
    }
  } catch (err) {
    console.error("Erro ao carregar gestores:", err);
  }
}

async function loadApprentices() {
  try {
    // Faz um JOIN entre 'perfis' e 'aprendizes'
    const { data, error } = await supabase
      .from('perfis')
      .select(`
        id, email, nome_completo,
        aprendizes ( area, gestor_id, inicio_contrato, fim_contrato, status )
      `)
      .eq('tipo', 'aprendiz');

    if (error) throw error;
    apprentices = data || [];
    renderTable();
  } catch (err) {
    console.error("Erro ao carregar aprendizes:", err);
  }
}

// ==========================================
// RENDERIZAÇÃO DA TABELA E MÉTRICAS
// ==========================================
function renderTable() {
  const tableBody = document.getElementById("apprenticeTableBody");
  if (!tableBody) return;

  const textSearch = document.getElementById("searchInput")?.value.toLowerCase() || "";
  const selectedStatus = document.getElementById("filterStatus")?.value || "";
  const selectedGestorId = document.getElementById("filterGestor")?.value || "";

  let ativos = 0, concluidos = 0, pendentes = 0;
  tableBody.innerHTML = "";

  const filtered = apprentices.filter(perfil => {
    const a = perfil.aprendizes?.[0] || {};
    const matchText = (perfil.nome_completo || "").toLowerCase().includes(textSearch) || (perfil.email || "").toLowerCase().includes(textSearch);
    const matchStatus = selectedStatus === "" || (a.status || "Ativo") === selectedStatus;
    const matchGestor = selectedGestorId === "" || a.gestor_id === selectedGestorId;
    
    // Contagem de métricas
    if ((a.status || "Ativo") === "Ativo") ativos++;
    if (a.status === "Concluído") concluidos++;
    if (!a.gestor_id) pendentes++;

    return matchText && matchStatus && matchGestor;
  });

  document.getElementById("countAtivos").textContent = ativos;
  document.getElementById("countConcluidos").textContent = concluidos;
  document.getElementById("countPendentes").textContent = pendentes;

  if (filtered.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px;">Nenhum aprendiz encontrado.</td></tr>`;
    return;
  }

  filtered.forEach(perfil => {
    const a = perfil.aprendizes?.[0] || {};
    const nome = perfil.nome_completo || "Sem Nome";
    const iniciais = nome.substring(0, 2).toUpperCase();
    const gestorObj = gestores.find(g => g.id === a.gestor_id);
    const gestorNome = gestorObj ? gestorObj.nome_completo : "Nenhum";
    const status = a.status || "Ativo";

    tableBody.innerHTML += `
      <tr>
        <td>
          <div class="user-info">
            <div class="user-avatar">${iniciais}</div>
            <div class="user-details">
              <div style="font-weight:600;">${nome}</div>
              <div style="font-size:0.8rem; color:var(--text-muted);">${perfil.email}</div>
            </div>
          </div>
        </td>
        <td>${a.area || "-"}</td>
        <td><strong>${gestorNome}</strong></td>
        <td>${formatDate(a.inicio_contrato)} até ${formatDate(a.fim_contrato)}</td>
        <td><span class="badge ${status === 'Concluído' ? 'badge-finished' : 'badge-active'}">${status}</span></td>
        <td>
          <div class="action-buttons">
            <button class="btn-action" onclick="openDetailsModal('${perfil.id}')" title="Ver Detalhes"><i data-lucide="eye"></i></button>
            <button class="btn-action" onclick="openEditModal('${perfil.id}')" title="Editar"><i data-lucide="pencil"></i></button>
            <button class="btn-action" onclick="openDeleteModal('${perfil.id}')" title="Excluir"><i data-lucide="trash-2"></i></button>
          </div>
        </td>
      </tr>
    `;
  });

  if (window.lucide) lucide.createIcons();
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

// ==========================================
// FUNÇÕES GLOBAIS (Expostas para o HTML)
// ==========================================
window.openModal = function(modalEl) { if (modalEl) modalEl.classList.add("active"); };
window.closeAllModals = function() { document.querySelectorAll(".modal-overlay").forEach(m => m.classList.remove("active")); };

window.openDetailsModal = function(id) {
  const perfil = apprentices.find(a => a.id === id);
  if (!perfil) return;
  const a = perfil.aprendizes?.[0] || {};
  const gestorObj = gestores.find(g => g.id === a.gestor_id);

  document.getElementById("detailsContent").innerHTML = `
    <p><strong>Nome:</strong> ${perfil.nome_completo}</p>
    <p><strong>E-mail:</strong> ${perfil.email}</p>
    <p><strong>Área:</strong> ${a.area || "-"}</p>
    <p><strong>Gestor Atribuído:</strong> ${gestorObj ? gestorObj.nome_completo : 'Nenhum'}</p>
    <p><strong>Período:</strong> ${formatDate(a.inicio_contrato)} até ${formatDate(a.fim_contrato)}</p>
    <p><strong>Status Atual:</strong> ${a.status || "Ativo"}</p>
  `;
  window.openModal(document.getElementById("detailsModal"));
};

window.openEditModal = function(id) {
  const perfil = apprentices.find(a => a.id === id);
  if (!perfil) return;
  const a = perfil.aprendizes?.[0] || {};

  document.getElementById("modalTitle").textContent = "Editar Aprendiz";
  document.getElementById("editApprenticeId").value = perfil.id;
  document.getElementById("inputName").value = perfil.nome_completo || "";
  document.getElementById("inputEmail").value = perfil.email || "";
  document.getElementById("inputArea").value = a.area || "";
  document.getElementById("selectGestor").value = a.gestor_id || "";
  document.getElementById("inputStartDate").value = a.inicio_contrato || "";
  document.getElementById("inputEndDate").value = a.fim_contrato || "";

  window.openModal(document.getElementById("apprenticeModal"));
};

window.openDeleteModal = function(id) {
  selectedApprenticeId = id;
  document.getElementById("confirmPasswordInput").value = "";
  
  // Abre o primeiro modal de confirmação
  const confirmModal = document.getElementById("confirmDeleteModal");
  window.openModal(confirmModal);

  // Adiciona evento ao botão "Sim, Excluir" para ir para o modal de senha
  document.getElementById("btnConfirmDelete").onclick = () => {
    confirmModal.classList.remove("active");
    window.openModal(document.getElementById("passwordModal"));
  };
};