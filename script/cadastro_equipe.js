import { supabase } from './supabaseClient.js';

let managers = [];
let selectedManagerId = null;

document.addEventListener("DOMContentLoaded", async () => {
  // Inicializa ícones
  if (window.lucide) lucide.createIcons();

  // Verifica Autenticação
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = "login.html";
    return;
  }

  // Carrega os dados do banco
  await loadManagers();

  // Evento de Busca
  document.getElementById("searchInput")?.addEventListener("input", renderTable);

  // Formulário de Cadastro/Edição de Gestor
  const managerForm = document.getElementById("managerForm");
  if (managerForm) {
    managerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const id = document.getElementById("editManagerId").value;
      const nome = document.getElementById("inputName").value;
      const email = document.getElementById("inputEmail").value;
      const area = document.getElementById("inputArea").value;
      const cargo = document.getElementById("inputCargo").value;
      const role = document.getElementById("selectRole").value;

      try {
        if (id) {
          // Atualiza dados específicos da equipe
          const { error: errEquipe } = await supabase.from('membros_equipe')
            .update({ area, cargo, permissao: role })
            .eq('id', id);
          if (errEquipe) throw errEquipe;

          // Atualiza o nome na tabela de perfis
          const { error: errPerfil } = await supabase.from('perfis')
            .update({ nome_completo: nome })
            .eq('id', id);
          if (errPerfil) throw errPerfil;

          alert("Gestor atualizado com sucesso!");
        } else {
          // Nota de segurança para novos cadastros
          alert(`Convite enviado para ${email}! O gestor aparecerá na lista assim que acessar o sistema pela primeira vez.`);
        }

        window.closeAllModals();
        await loadManagers();
      } catch (error) {
        alert("Erro ao salvar: " + error.message);
        console.error(error);
      }
    });
  }

  // Formulário de Exclusão
  const passwordForm = document.getElementById("passwordForm");
  if (passwordForm) {
    passwordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        const { error } = await supabase.from('perfis').delete().eq('id', selectedManagerId);
        if (error) throw error;
        
        alert("Gestor removido com sucesso!");
        window.closeAllModals();
        await loadManagers();
      } catch (error) {
        alert("Erro ao remover: " + error.message);
      }
    });
  }

  // Fechar modais
  document.querySelectorAll(".closeModalBtn, .btn-close-modal").forEach(btn => {
    btn.addEventListener("click", window.closeAllModals);
  });
});

// ==========================================
// FUNÇÕES DE BUSCA NO BANCO
// ==========================================
async function loadManagers() {
  try {
    const { data, error } = await supabase
      .from('perfis')
      .select(`
        id, email, nome_completo,
        membros_equipe ( area, cargo, permissao, aprendizes_atribuidos, status )
      `)
      .in('tipo', ['gestor', 'equipe']);

    if (error) throw error;
    managers = data || [];
    renderTable();
  } catch (err) {
    console.error("Erro ao carregar equipe:", err);
  }
}

// ==========================================
// RENDERIZAÇÃO DA TABELA
// ==========================================
function renderTable() {
  const tableBody = document.getElementById("teamTableBody");
  if (!tableBody) return;

  const textSearch = document.getElementById("searchInput")?.value.toLowerCase() || "";
  let pendentes = 0;
  const areasSet = new Set();
  tableBody.innerHTML = "";

  const filtered = managers.filter(perfil => {
    const m = perfil.membros_equipe?.[0] || {};
    const matchText = (perfil.nome_completo || "").toLowerCase().includes(textSearch) || 
                      (m.area || "").toLowerCase().includes(textSearch) ||
                      (perfil.email || "").toLowerCase().includes(textSearch);
    
    if (m.area) areasSet.add(m.area.toLowerCase());
    if (m.status === "Pendente") pendentes++;

    return matchText;
  });

  const countGestores = document.getElementById("countGestores");
  const countAreas = document.getElementById("countAreas");
  const countPendentes = document.getElementById("countPendentes");

  if (countGestores) countGestores.textContent = managers.length;
  if (countAreas) countAreas.textContent = areasSet.size;
  if (countPendentes) countPendentes.textContent = pendentes;

  if (filtered.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px;">Nenhum gestor encontrado.</td></tr>`;
    return;
  }

  filtered.forEach(perfil => {
    const m = perfil.membros_equipe?.[0] || {};
    const nome = perfil.nome_completo || "Sem Nome";
    const iniciais = nome.substring(0, 2).toUpperCase();
    const status = m.status || "Ativo";
    const role = m.permissao || "Gestor";

    tableBody.innerHTML += `
      <tr>
        <td>
          <div class="user-info">
            <div class="user-avatar">${iniciais}</div>
            <div class="user-details">
              <div class="name" style="font-weight:600;">${nome}</div>
              <div class="email" style="font-size:0.8rem; color:var(--text-muted);">${perfil.email}</div>
            </div>
          </div>
        </td>
        <td>${m.area || "-"}</td>
        <td>${m.cargo || "-"}</td>
        <td><span class="apprentices-count" style="font-weight:700;">${m.aprendizes_atribuidos || 0}</span></td>
        <td><span class="badge ${role === 'Administrador' ? 'badge-admin' : 'badge-gestor'}">${role}</span></td>
        <td>
          <button class="badge ${status === 'Ativo' ? 'badge-active' : 'badge-pending'}" onclick="toggleStatus('${perfil.id}', '${status}')" style="border:none; cursor:pointer;">
            ${status}
          </button>
        </td>
        <td>
          <div class="action-buttons">
            <button class="btn-action" onclick="openEditModal('${perfil.id}')" title="Editar"><i data-lucide="pencil"></i></button>
            <button class="btn-action" onclick="openResendModal('${perfil.id}')" title="Reenviar Convite"><i data-lucide="send"></i></button>
            <button class="btn-action" onclick="openDeleteModal('${perfil.id}')" title="Excluir"><i data-lucide="trash-2"></i></button>
          </div>
        </td>
      </tr>
    `;
  });

  if (window.lucide) lucide.createIcons();
}

// ==========================================
// FUNÇÕES GLOBAIS (Expostas para o HTML)
// ==========================================
window.openModal = function(modalEl) { if (modalEl) modalEl.classList.add("active"); };
window.closeAllModals = function() { document.querySelectorAll(".modal-overlay").forEach(m => m.classList.remove("active")); };

window.toggleStatus = async function(id, currentStatus) {
  const newStatus = currentStatus === "Ativo" ? "Pendente" : "Ativo";
  try {
    const { error } = await supabase.from('membros_equipe').update({ status: newStatus }).eq('id', id);
    if (error) throw error;
    await loadManagers();
  } catch (err) {
    alert("Erro ao atualizar status: " + err.message);
  }
};

window.openEditModal = function(id) {
  const perfil = managers.find(m => m.id === id);
  if (!perfil) return;
  const m = perfil.membros_equipe?.[0] || {};

  document.getElementById("editManagerId").value = perfil.id;
  document.getElementById("inputName").value = perfil.nome_completo || "";
  document.getElementById("inputEmail").value = perfil.email || "";
  document.getElementById("inputArea").value = m.area || "";
  document.getElementById("inputCargo").value = m.cargo || "";
  document.getElementById("selectRole").value = m.permissao || "Gestor";

  window.openModal(document.getElementById("formModal"));
};

window.openResendModal = function(id) {
  window.openModal(document.getElementById("resendModal"));
  document.getElementById("btnConfirmResend").onclick = () => {
    window.closeAllModals();
    window.openModal(document.getElementById("successModal"));
  };
};

window.openDeleteModal = function(id) {
  selectedManagerId = id;
  document.getElementById("confirmPasswordInput").value = "";
  const confirmModal = document.getElementById("confirmDeleteModal");
  window.openModal(confirmModal);

  document.getElementById("btnConfirmDelete").onclick = () => {
    confirmModal.classList.remove("active");
    window.openModal(document.getElementById("passwordModal"));
  };
};

const btnOpenAddModal = document.getElementById("btnOpenAddModal") || document.querySelector(".btn-add-member");
if (btnOpenAddModal) {
  btnOpenAddModal.addEventListener("click", () => {
    document.getElementById("managerForm")?.reset();
    document.getElementById("editManagerId").value = "";
    window.openModal(document.getElementById("formModal"));
  });
}