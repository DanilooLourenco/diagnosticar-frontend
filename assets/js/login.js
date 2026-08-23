document.addEventListener('DOMContentLoaded', () => {
    const abaLogin = document.getElementById('aba-btn-login');
    const abaCadastrar = document.getElementById('aba-btn-cadastrar');
    const formLogin = document.getElementById('form-login-oficina');
    const formCadastrar = document.getElementById('form-cadastrar-oficina');
    
    // Elementos da estrutura do site
    const sidebar = document.querySelector('.sidebar');
    const topbar = document.querySelector('.topbar');
    const telaLogin = document.getElementById('tela-login-oficina');
    const btnSair = document.querySelector('[data-tela="tela-login-oficina"]');

    const API_USUARIOS = 'https://diagnosticar-api.onrender.com/api/usuarios';

    // 🧹 Função universal de limpeza
function limparTelasDevedor() {
    // 1. Limpa o campo de busca de cobrança/devedores por ID e por seletor
    const campoBusca = document.getElementById('campoBuscaDevedor') 
        || document.querySelector('#tela-clientes input') 
        || document.querySelector('input[placeholder*="nome, apelido ou documento"]');
    if (campoBusca) campoBusca.value = '';

    // 2. Oculta todos os cards de resultado (devedor encontrado e tudo certo)
    const cardsParaOcultar = [
        '#resultadoDevedor',
        '#resultadoLimpo',
        '.card-pendencia',
        '.resultado-busca'
    ];
    document.querySelectorAll(cardsParaOcultar.join(',')).forEach(el => {
        el.style.display = 'none';
    });

    // 3. Reexibe a mensagem/orientação inicial caso exista
    const ajudaDevedor = document.getElementById('ajudaDevedor') || document.querySelector('.msg-ajuda-devedor');
    if (ajudaDevedor) ajudaDevedor.style.display = 'block';

    // 4. Limpa formulário de cadastro de serviços
    const formServico = document.getElementById('form-novo-servico');
    if (formServico) formServico.reset();

    // 5. Limpa todos os campos de texto e esconde bloco do fiado
    document.querySelectorAll('#tela-servicos input, #tela-servicos textarea, #tela-clientes input').forEach(input => {
        if (input.type !== 'button' && input.type !== 'submit') {
            input.value = '';
        }
    });

    const blocoFiado = document.getElementById('bloco-cliente-fiado');
    if (blocoFiado) blocoFiado.style.display = 'none';
}

    // 🚀 Função que controla o que aparece na tela baseado na sessão
    function verificarSessao() {
        const usuarioSalvo = localStorage.getItem('oficina_logada');

        if (usuarioSalvo) {
            // USUÁRIO LOGADO: Mostra o menu e libera o painel
            const usuario = JSON.parse(usuarioSalvo);
            
            if (sidebar) sidebar.style.display = 'block';
            if (topbar) topbar.style.display = 'flex';
            
            const topoNome = document.getElementById('nome-oficina-topo');
            if (topoNome) topoNome.textContent = usuario.nomeOficina;

            // Abre a tela inicial do sistema
            document.querySelectorAll('.tela-container').forEach(t => t.classList.remove('active'));
            const telaInicio = document.getElementById('tela-inicio');
            if (telaInicio) telaInicio.classList.add('active');

        } else {
            // NÃO LOGADO: Esconde o menu e mostra APENAS o login
            if (sidebar) sidebar.style.display = 'none';
            if (topbar) topbar.style.display = 'none';

            document.querySelectorAll('.tela-container').forEach(t => t.classList.remove('active'));
            if (telaLogin) telaLogin.classList.add('active');

            limparTelasDevedor();
            limparTodosFormularios();

            document.querySelectorAll('.tela-container').forEach(t => t.classList.remove('active'));
            if (telaLogin) telaLogin.classList.add('active');
        }
    }

    // Alternância de Abas (Entrar / Criar Conta)
    if (abaLogin && abaCadastrar) {
        abaLogin.addEventListener('click', () => {
            abaLogin.style.color = '#0284c7';
            abaLogin.style.borderBottom = '3px solid #0284c7';
            abaCadastrar.style.color = '#64748b';
            abaCadastrar.style.borderBottom = 'none';

            formLogin.style.display = 'block';
            formCadastrar.style.display = 'none';
        });

        abaCadastrar.addEventListener('click', () => {
            abaCadastrar.style.color = '#16a34a';
            abaCadastrar.style.borderBottom = '3px solid #16a34a';
            abaLogin.style.color = '#64748b';
            abaLogin.style.borderBottom = 'none';

            formCadastrar.style.display = 'block';
            formLogin.style.display = 'none';
        });
    }

    // 1. Processar Cadastro
    if (formCadastrar) {
        formCadastrar.addEventListener('submit', async (e) => {
            e.preventDefault();

            const payload = {
                nomeOficina: document.getElementById('cad-nome-oficina').value,
                email: document.getElementById('cad-email').value,
                senha: document.getElementById('cad-senha').value,
                telefone: document.getElementById('cad-telefone').value
            };

            try {
                const resposta = await fetch(`${API_USUARIOS}/cadastrar`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (resposta.ok) {
                    alert('🎉 Oficina cadastrada com sucesso! Agora faça login para entrar.');
                    abaLogin.click();
                } else {
                    const erroData = await resposta.json();
                    alert(erroData.erro || 'Erro ao realizar cadastro.');
                }
            } catch (erro) {
                console.error('Erro:', erro);
                alert('Erro de conexão com o servidor.');
            }
        });
    }

    // 2. Processar Login
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();

            const payload = {
                email: document.getElementById('login-email').value,
                senha: document.getElementById('login-senha').value
            };

            try {
                const resposta = await fetch(`${API_USUARIOS}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (resposta.ok) {
                    const usuarioLogado = await resposta.json();
                    localStorage.setItem('oficina_logada', JSON.stringify(usuarioLogado));
                    
                    alert(`Seja bem-vindo, ${usuarioLogado.nomeOficina}!`);
                    verificarSessao(); // Atualiza a tela para liberar o menu
                } else {
                    alert('E-mail ou senha incorretos!');
                }
            } catch (erro) {
                console.error('Erro:', erro);
                alert('Erro de conexão com o servidor.');
            }
        });
    }

    // 3. Ação do Botão Sair
    if (btnSair) {
        btnSair.addEventListener('click', () => {
            if (confirm('Deseja realmente sair da sua conta?')) {
                localStorage.removeItem('oficina_logada');
                limparTodosFormularios();
                verificarSessao(); // Esconde o menu e volta para o login
            }
        });
    }

    // Executa a verificação assim que a página carrega
    verificarSessao();

        // Garante que toda vez que trocar de menu ou deslogar, a busca suma:
function resetarTelaDevedores() {
    const inputBusca = document.getElementById('campoBuscaDevedor');
    const cardVermelho = document.getElementById('resultadoDevedor');
    const cardVerde = document.getElementById('resultadoLimpo');

    if (inputBusca) inputBusca.value = '';
    if (cardVermelho) cardVermelho.style.display = 'none';
    if (cardVerde) cardVerde.style.display = 'none';
}

// Escuta o clique em qualquer link ou botão do menu lateral
document.querySelectorAll('.sidebar a, .sidebar button, .menu-item').forEach(item => {
    item.addEventListener('click', () => {
        resetarTelaDevedores();
    });
});

});