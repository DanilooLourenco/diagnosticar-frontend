document.addEventListener('DOMContentLoaded', () => {
    // Elementos da tela
    const campoBusca = document.getElementById('campoBuscaDevedor');
    const btnBuscar = document.getElementById('btnBuscarDevedor');
    
    const resultadoDevedor = document.getElementById('resultadoDevedor');
    const resultadoLimpo = document.getElementById('resultadoLimpo');
    const ajudaDevedor = document.getElementById('ajudaDevedor');

    const devNome = document.getElementById('devNome');
    const devApelido = document.getElementById('devApelido');
    const devDocumento = document.getElementById('devDocumento');
    const devTelefone = document.getElementById('devTelefone');
    const devValor = document.getElementById('devValor');
    const btnCobrarWhatsapp = document.getElementById('btnCobrarWhatsapp');
    const btnRegistrarPagamento = document.getElementById('btnRegistrarPagamento');

    // Elementos do Modal / Pop-up
    const modalPagamento = document.getElementById('modalPagamento');
    const formModalPagamento = document.getElementById('formModalPagamento');
    const pagValorInput = document.getElementById('pagValorInput');
    const pagDataInput = document.getElementById('pagDataInput');
    const btnFecharModalPag = document.getElementById('btnFecharModalPag');

    const API_DEVEDORES = 'https://diagnosticar-api.onrender.com/api/devedores';
    let devedorAtualId = null;

    
 // 1. Consulta o Devedor vinculando à oficina logada
    async function realizarBusca() {
        const termo = campoBusca.value.trim();

        if (!termo) {
            alert('Por favor, digite um nome, apelido ou CPF para consultar!');
            return;
        }

        // Pega os dados da oficina logada no localStorage
        const usuarioSalvo = JSON.parse(localStorage.getItem('oficina_logada'));
        const usuarioId = usuarioSalvo ? usuarioSalvo.id : null;

        if (!usuarioId) {
            alert('Sessão expirada. Por favor, faça login novamente.');
            return;
        }

        try {
            // Envia o termo de busca + o usuarioId da oficina logada
            const resposta = await fetch(`${API_DEVEDORES}/busca?termo=${encodeURIComponent(termo)}&usuarioId=${usuarioId}`);

            if (resposta.status === 404) {
                mostrarTelaClienteLimpo(termo);
                return;
            }

            if (!resposta.ok) {
                throw new Error('Erro ao buscar informações no servidor.');
            }

            const devedor = await resposta.json();
            mostrarTelaDevedor(devedor);

        } catch (erro) {
            console.error('Erro na consulta:', erro);
            alert('Erro ao consultar o servidor. Verifique se o IntelliJ continua rodando.');
        }
    }

    function mostrarTelaDevedor(devedor) {
        devedorAtualId = devedor.id;
        ajudaDevedor.style.display = 'none';
        resultadoLimpo.style.display = 'none';
        resultadoDevedor.style.display = 'block';

        devNome.textContent = devedor.nome;
        devApelido.textContent = devedor.apelido || 'Não cadastrado';
        devDocumento.textContent = devedor.documento;
        devTelefone.textContent = devedor.telefone || 'Não cadastrado';
        
        const valorFormatado = devedor.saldoDevedor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        devValor.textContent = valorFormatado;

        if (devedor.telefone) {
        const numeroLimpo = devedor.telefone.replace(/\D/g, '');
        const numeroFinal = numeroLimpo.startsWith('55') ? numeroLimpo : `55${numeroLimpo}`;
        const mensagem = encodeURIComponent(`Olá ${devedor.nome}, tudo bem? Passando para lembrar do seu saldo em aberto.`);
        
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        btnCobrarWhatsapp.href = isMobile 
            ? `whatsapp://send?phone=${numeroFinal}&text=${mensagem}`
            : `https://web.whatsapp.com/send?phone=${numeroFinal}&text=${mensagem}`;
            
        btnCobrarWhatsapp.style.display = 'inline-flex';
    } else {
        btnCobrarWhatsapp.style.display = 'none';
    }
    }

    function mostrarTelaClienteLimpo(termo) {
        ajudaDevedor.style.display = 'none';
        resultadoDevedor.style.display = 'none';
        resultadoLimpo.style.display = 'block';

        const msgClienteLimpo = document.getElementById('msgClienteLimpo');
        msgClienteLimpo.innerHTML = `O cliente <strong>"${termo}"</strong> não possui nenhuma pendência financeira registrada no sistema.`;
    }

    // 2. Abertura e Fechamento do Modal/Pop-up
    function abrirModalPagamento() {
        if (!devedorAtualId) return;

        // Limpa e preenche o modal com a data de hoje por padrão
        pagValorInput.value = '';
        pagDataInput.value = new Date().toISOString().split('T')[0];
        
        modalPagamento.style.display = 'flex';
        pagValorInput.focus();
    }

    function fecharModalPagamento() {
        modalPagamento.style.display = 'none';
    }

    // 3. Envio do formulário do Modal para o Java
    async function confirmarPagamento(e) {
        e.preventDefault();

        if (!devedorAtualId) return;

        const valorPago = parseFloat(pagValorInput.value);
        const dataPagamento = pagDataInput.value;

        if (isNaN(valorPago) || valorPago <= 0) {
            alert('Por favor, informe um valor de pagamento válido.');
            return;
        }

        try {
            const resposta = await fetch(`${API_DEVEDORES}/${devedorAtualId}/pagar?valorPago=${valorPago}&data=${dataPagamento}`, {
                method: 'POST'
            });

            if (resposta.ok) {
                const resultado = await resposta.json();
                fecharModalPagamento();

                if (resultado.status === 'QUITADO') {
                    alert('🎉 Dívida quitada com sucesso! O registro foi baixado.');
                    resultadoDevedor.style.display = 'none';
                    ajudaDevedor.style.display = 'block';
                    campoBusca.value = '';
                } else {
                    alert(`✅ Abatimento efetuado! Novo saldo devedor: R$ ${resultado.novoSaldo.toFixed(2)}`);
                    devValor.textContent = resultado.novoSaldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                }
            } else {
                alert('Erro ao registrar o pagamento.');
            }
        } catch (erro) {
            console.error('Erro:', erro);
            alert('Erro de conexão com o servidor.');
        }
    }

    // Eventos
    if (btnBuscar) btnBuscar.addEventListener('click', realizarBusca);
    if (campoBusca) {
        campoBusca.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') realizarBusca();
        });
    }

    if (btnRegistrarPagamento) btnRegistrarPagamento.addEventListener('click', abrirModalPagamento);
    if (btnFecharModalPag) btnFecharModalPag.addEventListener('click', fecharModalPagamento);
    if (formModalPagamento) formModalPagamento.addEventListener('submit', confirmarPagamento);
});