import { supabase } from './supabaseClient.js';

// --- NAVEGAÇÃO ENTRE ETAPAS ---
window.goToStep = function(stepNumber) {
    if (stepNumber === 2) {
        const razaoSocial = document.getElementById('razaoSocial');
        const cnpj = document.getElementById('cnpjInput');
        const email = document.getElementById('emailCadInput');

        let hasError = false;

        if (!razaoSocial.value.trim()) {
            document.getElementById('razosWrapper').classList.add('error');
            hasError = true;
        }
        if (!cnpj.value.trim()) {
            document.getElementById('cnpjWrapper').classList.add('error');
            hasError = true;
        }
        if (!email.value.trim()) {
            document.getElementById('emailCadWrapper').classList.add('error');
            hasError = true;
        }

        if (hasError) return;
    }

    document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));

    if (stepNumber === 1) {
        document.getElementById('step1-cad').classList.add('active');
        document.getElementById('razaoSocial').focus();
    } else if (stepNumber === 2) {
        document.getElementById('step2-cad').classList.add('active');
        document.getElementById('passwordCadInput').focus(); // Corrigido (não existia phoneInput)
    }
};

// --- FUNÇÕES UTILITÁRIAS ---
window.clearError = function(wrapperId) {
    document.getElementById(wrapperId).classList.remove('error');
};

window.togglePasswordVisibility = function(inputId) {
    const passwordInput = document.getElementById(inputId);
    if (passwordInput) {
        passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
    }
};

// --- SUBMISSÃO E VALIDAÇÃO FINAL NO SUPABASE ---
document.addEventListener('DOMContentLoaded', () => {
    
    // Anexa os cliques dos botões utilitários caso o onclick do HTML falhe por causa do módulo
    document.getElementById('btnNextStep')?.addEventListener('click', () => window.goToStep(2));
    document.getElementById('btnPrevStep')?.addEventListener('click', () => window.goToStep(1));
    document.getElementById('btnTogglePass1')?.addEventListener('click', () => window.togglePasswordVisibility('passwordCadInput'));
    document.getElementById('btnTogglePass2')?.addEventListener('click', () => window.togglePasswordVisibility('confirmPasswordInput'));

    const form = document.getElementById('cadFormEmpresa');
    
    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault(); // Impede o recarregamento da página

            // Captura os valores dos inputs
            const razaoSocial = document.getElementById('razaoSocial').value;
            const cnpj = document.getElementById('cnpjInput').value;
            const email = document.getElementById('emailCadInput').value;
            const pass = document.getElementById('passwordCadInput');
            const confirmPass = document.getElementById('confirmPasswordInput');
            
            const confirmWrapper = document.getElementById('confirmPassWrapper');
            const confirmErrorText = document.getElementById('confirmErrorText');

            let hasError = false;

            // Validação de Senha
            if (!pass.value.trim() || pass.value.length < 6) {
                document.getElementById('passCadWrapper').classList.add('error');
                hasError = true;
            }

            if (!confirmPass.value.trim()) {
                confirmErrorText.innerText = "Campo obrigatório. Confirme sua senha.";
                confirmWrapper.classList.add('error');
                hasError = true;
            } else if (pass.value !== confirmPass.value) {
                confirmErrorText.innerText = "As senhas não coincidem.";
                confirmWrapper.classList.add('error');
                hasError = true;
            }

            if (hasError) return;

            // Altera o estado do botão para indicar carregamento
            const submitBtn = event.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Cadastrando...';
            submitBtn.disabled = true;

            try {
                // 1. Cria a conta no Supabase Auth
                // Passamos o tipo "empresa" para a trigger do banco saber quem é
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: email,
                    password: pass.value,
                    options: {
                        data: {
                            tipo: 'empresa'
                        }
                    }
                });

                if (authError) throw authError;

                const userId = authData.user.id;

                // 2. Atualiza o nome completo na tabela 'perfis'
                // A nossa trigger SQL já criou a linha, só precisamos pôr a Razão Social
                const { error: perfilError } = await supabase.from('perfis')
                    .update({ nome_completo: razaoSocial })
                    .eq('id', userId);

                if (perfilError) throw perfilError;

                // 3. Salva os dados institucionais na tabela 'empresas'
                const { error: empresaError } = await supabase.from('empresas').insert([
                    {
                        id: userId,
                        razao_social: razaoSocial,
                        cnpj: cnpj,
                        email_corporativo: email
                    }
                ]);

                if (empresaError) throw empresaError;

                alert('Cadastro da empresa realizado com sucesso!');
                window.location.href = 'login.html'; // Redireciona para login

            } catch (error) {
                alert("Erro no cadastro: " + error.message);
                console.error(error);
            } finally {
                // Restaura o botão caso algo dê errado
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
});

// Apenas por segurança, caso o form do HTML chame a função diretamente
window.handleRegisterSubmit = function(event) {
    event.preventDefault();
};