import { supabase } from './supabaseClient.js';

// ==========================================
// 1. DADOS DE PROJETOS (Mock temporário)
// ==========================================
const projects = [
  {
    id: 1, title: "Integração e Cultura", description: "Entendimento da cultura, valores e processos organizacionais.",
    tags: ["Comunicação", "Proatividade", "Trabalho em Equipe"], xp: 200, time: "2h", status: "available", color: "#16d39a", icon: "◎"
  },
  {
    id: 2, title: "Ferramentas do Dia a Dia", description: "Uso prático de Slack, Jira, Figma e sistemas internos.",
    tags: ["Organização", "Tecnologia", "Produtividade"], xp: 350, time: "3h", status: "current", color: "#0bbbd6", icon: "▱"
  },
  {
    id: 3, title: "Git e GitHub", description: "Versionamento de código, gestão de branches e pull requests.",
    tags: ["Resolução de Problemas", "Código", "Colaboração"], xp: 480, time: "4h", status: "locked", color: "#8b5cf6", icon: "⑂"
  },
  {
    id: 4, title: "Desenvolvimento Web Básico", description: "HTML, CSS e JavaScript na prática.",
    tags: ["HTML", "CSS", "Lógica"], xp: 400, time: "6h", status: "locked", color: "#6378A3", icon: "▣"
  },
  {
    id: 5, title: "Comunicação Assertiva", description: "Prática de comunicação em situações do ambiente profissional.",
    tags: ["Comunicação", "Clareza"], xp: 300, time: "2h", status: "locked", color: "#3985ff", icon: "□"
  }
];

const state = {
  completed: Number(localStorage.getItem("stoaCompleted")) || 2
};

const statusText = {
  available: "Disponível",
  current: "Em andamento",
  locked: "Bloqueado"
};

// ==========================================
// 2. FUNÇÕES DE RENDERIZAÇÃO
// ==========================================
function projectCard(project) {
  const disabled = project.status === "locked" ? "disabled" : "";
  return `
    <article class="project-card" style="--accent:${project.color}">
      <div class="project-icon">${project.icon}</div>
      <div class="project-status-dot ${project.status === "available" ? "available" : ""}"></div>
      <h3>${project.title}</h3>
      <p>${project.description}</p>
      <div class="tags">
        ${project.tags.map(tag => `<span class="tag">${tag}</span>`).join("")}
      </div>
      <div class="project-meta">
        <span>☆ ${project.xp} XP</span>
        <span>◷ ${project.time}</span>
      </div>
      <button class="outline-button project-open" data-id="${project.id}" ${disabled}>
        ${project.status === "locked" ? "Bloqueado" : "Ver projeto"}
      </button>
    </article>
  `;
}

function renderProjects() {
  const homeGrid = document.getElementById("home-projects");
  const allGrid = document.getElementById("all-projects");
  
  if (homeGrid) homeGrid.innerHTML = projects.slice(0, 3).map(projectCard).join("");
  if (allGrid) allGrid.innerHTML = projects.map(projectCard).join("");

  document.querySelectorAll(".project-open").forEach(button => {
    button.addEventListener("click", () => openProject(Number(button.dataset.id)));
  });
}

function renderProgress() {
  const total = projects.length;
  const percent = Math.round((state.completed / total) * 100);

  const fill = document.getElementById("progress-fill");
  if (fill) fill.style.width = `${percent}%`;
  
  const progText = document.getElementById("progress-text");
  if (progText) progText.textContent = `${percent}% concluído`;
  
  const projCount = document.getElementById("project-count");
  if (projCount) projCount.textContent = `${state.completed} de ${total} projetos`;

  const evoComp = document.getElementById("evo-completed");
  if (evoComp) evoComp.textContent = state.completed;
  
  const profComp = document.getElementById("profile-completed");
  if (profComp) profComp.textContent = state.completed;
}

function renderJourney() {
  const container = document.getElementById("full-journey");
  if (!container) return;

  container.innerHTML = projects.map((project, index) => {
    let statusClass = "locked";
    let status = "Bloqueado";

    if (index < state.completed) {
      statusClass = "done";
      status = "Concluído";
    } else if (index === state.completed) {
      statusClass = "active";
      status = "Próximo projeto";
    }

    return `
      <div class="journey-row ${statusClass}">
        <div class="row-circle">${statusClass === "done" ? "✓" : statusClass === "active" ? "→" : "♙"}</div>
        <div class="row-info">
          <strong>${project.title}</strong>
          <span>${status} • ${project.xp} XP • ${project.time}</span>
        </div>
        <span>${statusClass === "locked" ? "🔒" : "›"}</span>
      </div>
    `;
  }).join("");
}

// ==========================================
// 3. MODAIS E NAVEGAÇÃO
// ==========================================
// Adicionando window. para expor a função globalmente (caso exista onclick no HTML)
window.openProject = function(id) {
  const project = projects.find(item => item.id === id);
  if (!project || project.status === "locked") return;

  document.getElementById("modal-icon").textContent = project.icon;
  document.getElementById("modal-icon").style.background = project.color;
  document.getElementById("modal-title").textContent = project.title;
  document.getElementById("modal-description").textContent = project.description;
  document.getElementById("modal-status").textContent = statusText[project.status];

  document.getElementById("modal-tags").innerHTML = project.tags.map(tag => `<span class="tag">${tag}</span>`).join("");
  document.getElementById("modal-meta").textContent = `☆ ${project.xp} XP   •   ◷ ${project.time}`;

  const action = document.getElementById("modal-action");
  if (project.status === "available") {
    action.textContent = "Iniciar projeto";
    action.onclick = () => {
      project.status = "current";
      alert("Projeto iniciado! Boa jornada.");
      closeModal();
      renderProjects();
    };
  } else {
    action.textContent = "Continuar projeto";
    action.onclick = () => {
      alert("Continuando seu projeto...");
      closeModal();
    };
  }

  document.getElementById("project-modal").classList.add("open");
};

window.closeModal = function() {
  const modal = document.getElementById("project-modal");
  if(modal) modal.classList.remove("open");
};

window.navigate = function(page) {
  document.querySelectorAll(".page").forEach(section => section.classList.remove("active-page"));
  const target = document.getElementById(page);
  if (target) target.classList.add("active-page");

  document.querySelectorAll(".menu-item[data-page]").forEach(item => {
    item.classList.toggle("active", item.dataset.page === page);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// ==========================================
// 4. SUPABASE: PERFIL E MENU
// ==========================================
async function applyUserData(userId) {
  try {
    // Busca dados reais do banco do Supabase
    const { data: perfil, error } = await supabase
      .from('perfis')
      .select('nome_completo, avatar_url')
      .eq('id', userId)
      .single();

    if (error) throw error;

    const fullName = perfil.nome_completo || "Aprendiz";
    const firstName = fullName.trim().split(/\s+/)[0];

    document.querySelectorAll("[data-user-name]").forEach(el => el.textContent = fullName);
    document.querySelectorAll("[data-user-first-name]").forEach(el => el.textContent = firstName);
    document.querySelectorAll("[data-user-role]").forEach(el => el.textContent = "Aprendiz");

    // Lógica do Avatar
    const avatar = perfil.avatar_url;
    document.querySelectorAll("[data-user-avatar]").forEach(el => {
      if (avatar) {
        el.innerHTML = `<img src="${avatar}" alt="Avatar">`;
        el.classList.add("has-avatar");
      } else {
        el.textContent = firstName.charAt(0).toUpperCase();
      }
    });

  } catch (err) {
    console.error("Erro ao carregar perfil:", err);
  }
}

function setupUserMenu() {
  const button = document.getElementById("user-menu-button");
  const menu = document.getElementById("user-dropdown");
  
  if (button && menu) {
    button.addEventListener("click", event => {
      event.stopPropagation();
      menu.classList.toggle("open");
    });
    document.addEventListener("click", event => {
      if (!menu.contains(event.target) && event.target !== button) menu.classList.remove("open");
    });
  }

  // Controle de Tema
  const themeButton = document.getElementById("theme-toggle");
  const themeIcon = document.getElementById("theme-icon");
  const themeText = document.getElementById("theme-text");

  function applyTheme(theme) {
    document.body.classList.toggle("light-theme", theme === "light");
    if (themeIcon) themeIcon.textContent = theme === "light" ? "☀" : "☾";
    if (themeText) themeText.textContent = theme === "light" ? "Tema claro" : "Tema escuro";
    localStorage.setItem("stoaTheme", theme);
  }

  applyTheme(localStorage.getItem("stoaTheme") || "dark");

  if (themeButton) {
    themeButton.addEventListener("click", () => {
      applyTheme(document.body.classList.contains("light-theme") ? "dark" : "light");
    });
  }

  // Logout com o Supabase
  const logoutBtn = document.getElementById("logout-button");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await supabase.auth.signOut();
      window.location.href = "login.html";
    });
  }
}

// ==========================================
// 5. INICIALIZAÇÃO
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
  // 1. Verifica se o usuário está logado
  const { data: { session } } = await supabase.auth.getSession();
  
  // 2. Se não estiver logado, chuta para a tela de login
  if (!session) {
    window.location.href = "login.html";
    return;
  }

  // 3. Aplica os dados do banco e eventos básicos
  await applyUserData(session.user.id);
  setupUserMenu();
  renderProjects();
  renderProgress();
  renderJourney();

  // 4. Configura Event Listeners estáticos
  document.querySelectorAll(".menu-item[data-page]").forEach(item => {
    item.addEventListener("click", () => navigate(item.dataset.page));
  });

  document.querySelectorAll("[data-page-link]").forEach(button => {
    button.addEventListener("click", () => navigate(button.dataset.pageLink));
  });

  const btnModalClose = document.getElementById("modal-close");
  if (btnModalClose) btnModalClose.addEventListener("click", closeModal);

  const projectModal = document.getElementById("project-modal");
  if (projectModal) {
    projectModal.addEventListener("click", event => {
      if (event.target.id === "project-modal") closeModal();
    });
  }

  const avatarButton = document.getElementById("avatar-button");
  if (avatarButton) {
    avatarButton.addEventListener("click", () => window.location.href = "avatar.html");
  }
});