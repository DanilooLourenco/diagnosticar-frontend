// O "DOMContentLoaded" garante que o código só roda depois que o HTML foi todo carregado na tela
document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================================================
    // 🏢 1. CONTROLE DE TRANSIÇÃO DE SUBTELAS (PÁGINA GERAL vs FORMULÁRIO)
    // ==========================================================================
    const painelGeralConfig = document.getElementById('painel-inicial-configuracoes');
    const subtelaPerfil = document.getElementById('subtela-formulario-perfil');
    const btnCardPerfil = document.getElementById('btn-subtela-perfil');
    const btnVoltarConfig = document.getElementById('btn-voltar-config-geral');

    // Quando clica no Card "Perfil da Oficina", esconde o menu de opções e mostra o formulário
    if (btnCardPerfil) {
        btnCardPerfil.addEventListener('click', () => {
            if (painelGeralConfig) painelGeralConfig.style.display = 'none';
            if (subtelaPerfil) subtelaPerfil.style.display = 'block';
        });
    }

    // Quando clica no Botão "Voltar", esconde o formulário e volta para o menu de cartões
    if (btnVoltarConfig) {
        btnVoltarConfig.addEventListener('click', () => {
            if (subtelaPerfil) subtelaPerfil.style.display = 'none';
            if (painelGeralConfig) painelGeralConfig.style.display = 'block';
        });
    }


    // ==========================================================================
    // 📝 2. CAPTURA DOS CAMPOS DO FORMULÁRIO E IMAGENS
    // ==========================================================================
    const formConfig = document.getElementById('form-config-oficina');
    const campoNome = document.getElementById('cfg-nome');
    const campoCnpj = document.getElementById('cfg-cnpj');
    const campoTelefone = document.getElementById('cfg-telefone');
    const campoEmail = document.getElementById('cfg-email');
    const campoEndereco = document.getElementById('cfg-endereco');
    const campoRodape = document.getElementById('cfg-rodape');
    const fileLogo = document.getElementById('cfg-logo-file');
    
    const previewImg = document.getElementById('preview-logo-img');
    const previewPlaceholder = document.getElementById('preview-placeholder');

    // Botões de Ação do Perfil
    const btnEditar = document.getElementById('btn-cfg-editar');
    const btnSalvar = document.getElementById('btn-cfg-salvar');
    const btnCancelar = document.getElementById('btn-cfg-cancelar');

    const API_URL = 'https://diagnosticar-api.onrender.com/api/configuracoes/oficina';
    let logoBase64String = ""; // Armazenará a foto convertida em texto

    // ==========================================================================
    // 🔍 3. BUSCA OS DADOS DA OFICINA NO MYSQL (VIA JAVA) E PREENCHE OS CAMPOS
    // ==========================================================================
    async function carregarDadosOficina() {
        try {
            const resposta = await fetch(API_URL);
            if (!resposta.ok) throw new Error('Erro ao buscar dados do servidor.');
            
            const dados = await resposta.json();

            // Preenche os inputs com o que veio do MySQL
            if (campoNome) campoNome.value = dados.nomeOficina || "";
            if (campoCnpj) campoCnpj.value = dados.cnpj || "";
            if (campoTelefone) campoTelefone.value = dados.telefone || "";
            if (campoEmail) campoEmail.value = dados.email || "";
            if (campoEndereco) campoEndereco.value = dados.endereco || "";
            if (campoRodape) campoRodape.value = dados.mensagemRodape || "";

            // Se o banco já tiver uma imagem em Base64 salva, mostra ela no quadradinho
            if (dados.logoBase64 && previewImg && previewPlaceholder) {
                logoBase64String = dados.logoBase64;
                previewImg.src = dados.logoBase64;
                previewImg.style.display = 'block';
                previewPlaceholder.style.display = 'none';
            }

        } catch (erro) {
            console.error("Erro ao carregar configurações:", erro);
        }
    }

    // Executa a busca automática assim que entra na tela
    carregarDadosOficina();


    // ==========================================================================
    // ⚡ 4. CONVERTE A FOTO DA LOGO PARA TEXTO (BASE64) AO SELECIONAR UM ARQUIVO
    // ==========================================================================
    if (fileLogo) {
        fileLogo.addEventListener('change', (e) => {
            const arquivo = e.target.files[0];
            if (arquivo) {
                const leitor = new FileReader();
                leitor.onload = function(eventoReader) {
                    logoBase64String = eventoReader.target.result; 
                    if (previewImg && previewPlaceholder) {
                        previewImg.src = logoBase64String;
                        previewImg.style.display = 'block';
                        previewPlaceholder.style.display = 'none';
                    }
                };
                leitor.readAsDataURL(arquivo);
            }
        });
    }


    // ==========================================================================
    // ✏️ 5. LÓGICA DO BOTÃO "EDITAR PERFIL" (AQUI ENTRA O BLOCO QUE VOCÊ PERGUNTOU!)
    // ==========================================================================
    if (btnEditar) {
        btnEditar.addEventListener('click', (e) => {
            e.preventDefault(); 
            e.stopPropagation(); 
            
            // Procura todos os inputs dentro do form e tira o bloqueio (disabled)
            if (formConfig) {
                const inputs = formConfig.querySelectorAll('input');
                inputs.forEach(input => {
                    input.disabled = false;
                    input.removeAttribute('disabled');
                });
            }

            // Esconde o botão "Editar" e mostra o "Salvar" e "Cancelar"
            btnEditar.style.display = 'none';
            if (btnSalvar) btnSalvar.style.display = 'block';
            if (btnCancelar) btnCancelar.style.display = 'block';
        });
    }


    // ==========================================================================
    // ❌ 6. LÓGICA DO BOTÃO "CANCELAR EDIÇÃO"
    // ==========================================================================
    if (btnCancelar) {
        btnCancelar.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Bloqueia todos os campos de novo (cinza)
            if (formConfig) {
                const inputs = formConfig.querySelectorAll('input');
                inputs.forEach(input => input.disabled = true);
            }
            
            // Volta os botões para o estado inicial
            btnEditar.style.display = 'block';
            if (btnSalvar) btnSalvar.style.display = 'none';
            btnCancelar.style.display = 'none';
            
            // Desfaz as alterações recarregando o que estava salvo no banco
            carregarDadosOficina(); 
        });
    }


    // ==========================================================================
    // 💾 7. BOTÃO "SALVAR ALTERAÇÕES" (DISPARADO NO SUBMIT DO FORMULÁRIO)
    // ==========================================================================
    if (formConfig) {
        formConfig.addEventListener('submit', async (e) => {
            e.preventDefault();

            const payload = {
                nomeOficina: campoNome.value.trim(),
                cnpj: campoCnpj.value.trim(),
                telefone: campoTelefone.value.trim(),
                email: campoEmail.value.trim(),
                endereco: campoEndereco.value.trim(),
                mensagemRodape: campoRodape.value.trim(),
                logoBase64: logoBase64String
            };

            try {
                const resposta = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!resposta.ok) throw new Error('Falha ao atualizar dados no banco.');

                alert("Configurações da oficina atualizadas com sucesso!");
                
                // Trava os campos novamente após salvar
                const inputs = formConfig.querySelectorAll('input');
                inputs.forEach(input => input.disabled = true);
                
                btnEditar.style.display = 'block';
                if (btnSalvar) btnSalvar.style.display = 'none';
                if (btnCancelar) btnCancelar.style.display = 'none';

            } catch (erro) {
                console.error("Erro ao salvar dados:", erro);
                alert("Erro ao salvar as configurações. Verifique a conexão com o back-end.");
            }
        });
    }
});