import { supabase } from './supabaseClient.js';

// --- CONTROLE DE ABAS PRINCIPAIS ---
window.showMainTab = function(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.view-section').forEach(view => view.classList.remove('active'));

    if (tabName === 'aprendiz') {
        document.body.classList.remove('theme-empresa');
        document.getElementById('tab-aprendiz').classList.add('active');
        document.getElementById('view-aprendiz').classList.add('active');
    } else if (tabName === 'empresas') {
        document.body.classList.add('theme-empresa');
        document.getElementById('tab-empresas').classList.add('active');
        document.getElementById('view-empresas').classList.add('active');
        window.backToEmpresaMenu();
    }
};

// --- NAVEGAÇÃO INTERNA DA EMPRESA ---
window.openEmpresaLogin = function() {
    document.getElementById('emp-menu').classList.remove('active');
    document.getElementById('emp-login').classList.add('active');
    window.goToStepEmpresa(1);
};

window.backToEmpresaMenu = function() {
    document.getElementById('emp-login').classList.remove('active');
    document.getElementById('emp-menu').classList.add('active');
};

// Redirecionamento para cadastro.html
window.openEmpresaCadastroNotice = function() {
    window.location.href = 'cadastro.html';
};

// --- FLUXO PASSO A PASSO (APRENDIZ) ---
window.goToStepAprendiz = function(stepNumber) {
    const userInput = document.getElementById('userInputAprendiz');
    const userWrapper = document.getElementById('userWrapperAprendiz');
    
    if (stepNumber === 2) {
        if (!userInput.value.trim()) {
            userWrapper.classList.add('error');
            userInput.focus();
            return;
        }
    }

    document.querySelectorAll('#view-aprendiz .step').forEach(step => step.classList.remove('active'));
    
    if (stepNumber === 1) {
        document.getElementById('step1-aprendiz').classList.add('active');
        userInput.focus();
    } else if (stepNumber === 2) {
        document.getElementById('step2-aprendiz').classList.add('active');
        document.getElementById('passwordInputAprendiz').focus();
    }
};

// --- FLUXO PASSO A PASSO (EMPRESA) ---
window.goToStepEmpresa = function(stepNumber) {
    const userInput = document.getElementById('userInputEmpresa');
    const userWrapper = document.getElementById('userWrapperEmpresa');
    
    if (stepNumber === 2) {
        if (!userInput.value.trim()) {
            userWrapper.classList.add('error');
            userInput.focus();
            return;
        }
    }

    document.querySelectorAll('#emp-login .step').forEach(step => step.classList.remove('active'));
    
    if (stepNumber === 1) {
        document.getElementById('step1-empresa').classList.add('active');
        userInput.focus();
    } else if (stepNumber === 2) {
        document.getElementById('step2-empresa').classList.add('active');
        document.getElementById('passwordInputEmpresa').focus();
    }
};

// --- FUNÇÕES UTILITÁRIAS ---
window.clearError = function(wrapperId) {
    const wrapper = document.getElementById(wrapperId);
    if (wrapper) wrapper.classList.remove('error');
};

window.togglePasswordVisibility = function(inputId) {
    const passwordInput = document.getElementById(inputId);
    if (passwordInput) {
        passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
    }
};

// --- POP-UP / MODAL DINÂMICO ---
window.openModal = function(type) {
    const modalTitle = document.getElementById('modalTitle');
    const modalText = document.getElementById('modalText');

    if (type === 'empresa') {
        modalTitle.innerText = "Recuperação de Conta Empresarial";
        modalText.innerText = "Se você perdeu o acesso à conta da empresa ou CNPJ cadastrado, por favor entre em contato com o administrador da conta corporativa ou com o suporte técnico da plataforma.";
    } else {
        modalTitle.innerText = "Recuperação de E-mail (Aprendiz)";
        modalText.innerText = "Se você não se lembra do e-mail cadastrado, entre em contato com a coordenação da sua instituição de ensino para consultar ou atualizar seus dados.";
    }

    document.getElementById('instructionModal').classList.add('active');
};

window.closeModal = function() {
    document.getElementById('instructionModal').classList.remove('active');
};

// --- SUBMISSÃO E AUTENTICAÇÃO REAL NO SUPABASE ---
document.addEventListener('DOMContentLoaded', () => {
    
    // Login de Aprendiz
    const formAprendiz = document.getElementById('loginFormAprendiz');
    if (formAprendiz) {
        formAprendiz.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('userInputAprendiz').value;
            const senha = document.getElementById('passwordInputAprendiz').value;

            if (!senha.trim()) {
                document.getElementById('passWrapperAprendiz').classList.add('error');
                return;
            }

            await realizarLogin(email, senha);
        });
    }

    // Login de Empresa / Equipe
    const formEmpresa = document.getElementById('loginFormEmpresa');
    if (formEmpresa) {
        formEmpresa.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('userInputEmpresa').value;
            const senha = document.getElementById('passwordInputEmpresa').value;

            if (!senha.trim()) {
                document.getElementById('passWrapperEmpresa').classList.add('error');
                return;
            }

            await realizarLogin(email, senha);
        });
    }
});

// Função centralizada de login e redirecionamento por perfil
async function realizarLogin(email, senha) {
    try {
        // 1. Autentica no Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: senha,
        });

        if (authError) throw authError;

        const userId = authData.user.id;

        // 2. Consulta a tabela de perfis para descobrir o tipo de usuário
        const { data: perfilData, error: perfilError } = await supabase
            .from('perfis')
            .select('tipo')
            .eq('id', userId)
            .single();

        if (perfilError) throw perfilError;

        const tipo = perfilData.tipo;

        // 3. Redirecionamento inteligente baseado no tipo de usuário
        if (tipo === 'aprendiz') {
            window.location.href = 'aprendiz.html';
        } else if (tipo === 'empresa') {
            window.location.href = 'projetos.html'; // Ou painel da empresa
        } else if (tipo === 'equipe' || tipo === 'gestor' || tipo === 'admin') {
            window.location.href = 'projetos.html';
        } else {
            window.location.href = 'dashboard.html';
        }

    } catch (error) {
        alert("Erro ao entrar: E-mail ou senha incorretos.");
        console.error("Erro de login:", error.message);
    }
}