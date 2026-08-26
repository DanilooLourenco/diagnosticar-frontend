document.addEventListener('DOMContentLoaded', () => {
    // 1. CAPTURA DE ELEMENTOS DAS SUBTELAS
    const painelInicial = document.getElementById('servicos-painel-inicial');
    const formularioNovo = document.getElementById('formulario-novo-servico');
    const buscaCliente = document.getElementById('busca-cliente-servico');
    const subtelaRecibo = document.getElementById('subtela-emissao-recibo');

    // Botões de navegação principal
    const btnFluxoNovo = document.getElementById('btn-fluxo-novo');
    const btnFluxoCliente = document.getElementById('btn-fluxo-cliente');
    const btnFluxoNota = document.getElementById('btn-fluxo-nota');
    const btnAtalhoHistorico = document.getElementById('btn-atalho-historico');
    const botoesVoltar = document.querySelectorAll('.btn-voltar-painel');

    // URL base da sua API Spring Boot no IntelliJ
    const API_URL = 'https://diagnosticar-api.onrender.com/api/diagnosticos';

    // Elementos internos do fluxo de Recibo/Nota
    const reciboPasso1 = document.getElementById('recibo-passo-1');
    const reciboPasso2 = document.getElementById('recibo-passo-2');
    const btnReciboSim = document.getElementById('btn-recibo-sim');
    const btnReciboNao = document.getElementById('btn-recibo-nao');
    const blocoBuscaPlacaRecibo = document.getElementById('bloco-busca-placa-recibo');
    const reciboPlacaBusca = document.getElementById('recibo-placa-busca');
    const btnBuscarServicosRecibo = document.getElementById('btn-buscar-servicos-recibo');
    const listaServicosReciboContainer = document.getElementById('lista-servicos-recibo-container');
    const listaServicosReciboRadios = document.getElementById('lista-servicos-recibo-radios');
    const blocoAvancarPasso1 = document.getElementById('bloco-avancar-passo-1');
    const btnAvancarRecibo = document.getElementById('btn-avancar-recibo');
    const formReciboFinal = document.getElementById('form-recibo-final');
    const blocoDadosServicoRecibo = document.getElementById('bloco-dados-servico-recibo');

    // Variáveis de controle do recibo ativo
    let servicoSelecionadoObjeto = null;
    let fluxoReciboExistente = false;

    // ==========================================================================
    // ⚡ PREENCHIMENTO AUTOMÁTICO DE VEÍCULO PELA PLACA
    // ==========================================================================
    const campoPlacaInput = document.getElementById('serv-placa');
    const campoModeloInput = document.getElementById('serv-modelo');
    const campoAnoInput = document.getElementById('serv-ano');

    if (campoPlacaInput) {
        campoPlacaInput.addEventListener('input', async () => {
            const placa = campoPlacaInput.value.trim().toUpperCase();

            if (placa.length === 7) {
                try {
                    const resposta = await fetch(`${API_URL}/veiculo/${placa}`);
                    if (resposta.ok) {
                        const veiculo = await resposta.json();
                        campoModeloInput.value = veiculo.modelo;
                        campoAnoInput.value = veiculo.ano;
                        campoModeloInput.style.backgroundColor = '#f1f5f9';
                        campoAnoInput.style.backgroundColor = '#f1f5f9';
                    } else {
                        campoModeloInput.style.backgroundColor = '';
                        campoAnoInput.style.backgroundColor = '';
                    }
                } catch (erro) {
                    console.error("Erro ao verificar placa:", erro);
                }
            } else {
                campoModeloInput.style.backgroundColor = '';
                campoAnoInput.style.backgroundColor = '';
            }
        });
    }

    // ==========================================================================
    // 🔄 CONTROLE DE TRANSIÇÃO DE SUBTELAS
    // ==========================================================================
    if (btnFluxoNovo) {
        btnFluxoNovo.addEventListener('click', () => {
            painelInicial.style.display = 'none';
            formularioNovo.style.display = 'block';
        });
    }

    if (btnFluxoCliente) {
        btnFluxoCliente.addEventListener('click', () => {
            painelInicial.style.display = 'none';
            buscaCliente.style.display = 'block';
        });
    }

    // Ação do Novo Botão da Nota Fiscal / Recibo
    if (btnFluxoNota) {
        btnFluxoNota.addEventListener('click', () => {
            painelInicial.style.display = 'none';
            subtelaRecibo.style.display = 'block';
            resetarFluxoRecibo();
        });
    }

    botoesVoltar.forEach(botao => {
        botao.addEventListener('click', () => {
            formularioNovo.style.display = 'none';
            buscaCliente.style.display = 'none';
            subtelaRecibo.style.display = 'none';
            painelInicial.style.display = 'block';
            
            const resultadoBox = document.getElementById('resultado-busca-cliente');
            const campoBusca = document.getElementById('busca-placa-cliente');
            if (resultadoBox) resultadoBox.style.display = 'none';
            if (campoBusca) campoBusca.value = '';
        });
    });

    if (btnAtalhoHistorico) {
        btnAtalhoHistorico.addEventListener('click', () => {
            const itemMenuHistorico = document.querySelector('[data-tela="tela-carros"]');
            if (itemMenuHistorico) itemMenuHistorico.click();
        });
    }

    // ==========================================================================
    // 🔍 BUSCA REAL DE CLIENTE NO BANCO DE DADOS (Spring Boot / MySQL)
    // ==========================================================================
    const btnPesquisar = document.getElementById('btn-executar-busca-cliente');
    const resultadoBox = document.getElementById('resultado-busca-cliente');
    const listaServicosContainer = document.getElementById('lista-servicos-selecionaveis');

    if (btnPesquisar) {
        btnPesquisar.addEventListener('click', async () => {
            const placaBuscada = document.getElementById('busca-placa-cliente').value.trim().toUpperCase();
            if (!placaBuscada) {
                alert('Por favor, digite uma placa para pesquisar.');
                return;
            }

            try {
                const resposta = await fetch(`${API_URL}/cliente/${placaBuscada}`);
                if (resposta.status === 404) {
                    alert('Veículo não cadastrado! Use a opção "Novo Serviço" para registrá-lo.');
                    if (resultadoBox) resultadoBox.style.display = 'none';
                    return;
                }
                if (!resposta.ok) throw new Error('Erro na comunicação com o servidor.');

                const veiculoEncontrado = await resposta.json();
                document.getElementById('carro-cliente-nome').innerText = veiculoEncontrado.modelo;
                document.getElementById('carro-cliente-ano').innerText = veiculoEncontrado.ano;
                document.getElementById('carro-cliente-placa').innerText = placaBuscada;

                listaServicosContainer.innerHTML = '';
                veiculoEncontrado.historico.forEach((servico, index) => {
                    const dataFormatada = servico.dataServico ? servico.dataServico.split('-').reverse().join('/') : 'N/D';
                    const itemHtml = `
                        <label class="item-servico-check">
                            <input type="checkbox" class="chk-servico" data-index="${index}">
                            <div class="detalhe-linha">
                                <p><strong>Data:</strong> ${dataFormatada} | <strong>Valor:</strong> R$ ${servico.valor.toFixed(2).replace('.', ',')}</p>
                                <small>${servico.descricao}</small>
                            </div>
                        </label>
                    `;
                    listaServicosContainer.insertAdjacentHTML('beforeend', itemHtml);
                });

                window.historicoAtivo = veiculoEncontrado.historico.map(s => ({
                    data: s.dataServico ? s.dataServico.split('-').reverse().join('/') : 'N/D',
                    descricao: s.descricao,
                    valor: s.valor
                }));
                window.carroAtivo = veiculoEncontrado;
                window.placaAtiva = placaBuscada;
                resultadoBox.style.display = 'block';
            } catch (erro) {
                console.error('Erro na busca:', erro);
                alert('Erro ao conectar com o banco de dados.');
            }
        });
    }

    // ==========================================================================
    // 📄 LAUDO GERAL EM PDF
    // ==========================================================================
    const btnGerarPdf = document.getElementById('btn-gerar-pdf-selecionados');
    if (btnGerarPdf) {
        btnGerarPdf.addEventListener('click', async () => {
            const checkboxes = document.querySelectorAll('.chk-servico:checked');
            if (checkboxes.length === 0) {
                alert('Selecione pelo menos um serviço da lista para gerar o relatório!');
                return;
            }

            let totalAcumulado = 0;
            let netLinhasHtml = '';

            checkboxes.forEach(chk => {
                const idx = parseInt(chk.getAttribute('data-index'));
                if (window.historicoAtivo && window.historicoAtivo[idx]) {
                    const servicoObjeto = window.historicoAtivo[idx];
                    totalAcumulado += parseFloat(servicoObjeto.valor) || 0;
                    netLinhasHtml += `
                        <div style="padding: 10px 0; border-bottom: 1px dashed #cbd5e1;">
                            <p style="margin: 0 0 5px 0; font-size: 14px;"><strong>Data:</strong> ${servicoObjeto.data}</p>
                            <p style="margin: 0 0 5px 0; font-size: 14px;"><strong>Serviço:</strong> ${servicoObjeto.descricao}</p>
                            <p style="margin: 0; font-size: 14px; text-align: right;"><strong>Valor:</strong> R$ ${servicoObjeto.valor.toFixed(2).replace('.', ',')}</p>
                        </div>
                    `;
                }
            });

            const dadosOficina = await buscarDadosOficina();
            let logoHtml = `<h2 style="margin: 0; font-size: 22px;">${dadosOficina.nomeOficina}</h2>`;
            if (dadosOficina.logoBase64) {
                logoHtml = `<img src="${dadosOficina.logoBase64}" style="max-height: 50px; max-width: 150px; object-fit: contain;">`;
            }

            const templateRelatorio = document.createElement('div');
            templateRelatorio.innerHTML = `
                <div style="width: 170mm; font-family: 'Courier New', Courier, monospace; padding: 5px; color: #0f172a; margin: 0 auto; box-sizing: border-box; font-size: 13px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 5px;">
                        <div>
                            ${logoHtml}
                            <br>
                            <small style="font-size: 11px;">${dadosOficina.nomeOficina} - Histórico Técnico</small>
                        </div>
                        <div style="border: 1px solid #0f172a; padding: 4px 8px; font-weight: bold; font-size: 11px;">LAUDO DE SERVIÇOS</div>
                    </div>
                    <div style="margin: 12px 0; background: #f8fafc; padding: 10px; border-radius: 4px; border: 1px solid #e2e8f0; font-size: 13px;">
                        <p style="margin: 0 0 4px 0;"><strong>Veículo:</strong> ${window.carroAtivo ? window.carroAtivo.modelo : 'Não identificado'}</p>
                        <p style="margin: 0 0 4px 0;"><strong>Ano:</strong> ${window.carroAtivo ? window.carroAtivo.ano : ''}</p>
                        <p style="margin: 0;"><strong>Placa Cadastrada:</strong> ${window.placaAtiva || ''}</p>
                    </div>
                    <h3 style="border-bottom: 1px solid #0f172a; padding-bottom: 3px; font-size: 14px; margin-top: 10px;">Relação de Atendimentos Selecionados</h3>
                    <div style="margin-bottom: 15px;">${netLinhasHtml}</div>
                    <div style="text-align: right; font-size: 15px; margin-bottom: 20px; font-weight: bold; border-top: 1px solid #0f172a; padding-top: 5px;">
                        VALOR TOTAL DO LAUDO: R$ ${totalAcumulado.toFixed(2).replace('.', ',')}
                    </div>
                    <div style="text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 10px; font-size: 10px; color: #64748b; margin-top: 15px; page-break-inside: avoid;">
                        <p style="margin: 0 0 3px 0;">${dadosOficina.endereco} ${dadosOficina.telefone ? ' - ' + dadosOficina.telefone : ''}</p>
                        <p style="font-weight: bold; margin: 0; color: #334155;">${dadosOficina.mensagemRodape}</p>
                    </div>
                </div>
            `;

            templateRelatorio.style.minHeight = "297mm"; 
            const opcoesPdf = {
                margin:       [10, 15, 10, 15],
                filename:     `laudo_servicos_${window.placaAtiva || 'geral'}.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
            };

            setTimeout(() => { html2pdf().set(opcoesPdf).from(templateRelatorio).save(); }, 250);
        });
    }

    // ==========================================================================
    // 🧠 LÓGICA INTELIGENTE DO MÓDULO DE NOTA / RECIBO (NOVO!)
    // ==========================================================================
    function resetarFluxoRecibo() {
        reciboPasso1.style.display = 'block';
        reciboPasso2.style.display = 'none';
        blocoBuscaPlacaRecibo.style.display = 'none';
        listaServicosReciboContainer.style.display = 'none';
        blocoAvancarPasso1.style.display = 'none';
        btnReciboSim.classList.remove('ativo');
        btnReciboNao.classList.remove('ativo');
        reciboPlacaBusca.value = '';
        listaServicosReciboRadios.innerHTML = '';
        formReciboFinal.reset();
        servicoSelecionadoObjeto = null;
        fluxoReciboExistente = false;
    }

    // Mecânico escolhe que o serviço JÁ EXISTE no banco
    btnReciboSim.addEventListener('click', () => {
        btnReciboSim.classList.add('ativo');
        btnReciboNao.classList.remove('ativo');
        blocoBuscaPlacaRecibo.style.display = 'block';
        blocoAvancarPasso1.style.display = 'none'; // Só avança se achar e marcar o serviço
        fluxoReciboExistente = true;
    });

    // Mecânico escolhe que é um Serviço NOVO / AVULSO
    btnReciboNao.addEventListener('click', () => {
        btnReciboNao.classList.add('ativo');
        btnReciboSim.classList.remove('ativo');
        blocoBuscaPlacaRecibo.style.display = 'none';
        blocoAvancarPasso1.style.display = 'block'; // Avança direto, não precisa buscar nada
        fluxoReciboExistente = false;
        servicoSelecionadoObjeto = null;
    });

    // Executa a busca de histórico dentro da aba de Recibos
    btnBuscarServicosRecibo.addEventListener('click', async () => {
        const placa = reciboPlacaBusca.value.trim().toUpperCase();
        if (!placa) {
            alert('Digite uma placa para buscar.');
            return;
        }

        try {
            const resposta = await fetch(`${API_URL}/cliente/${placa}`);
            if (resposta.status === 404) {
                alert('Nenhum serviço encontrado para esta placa! Use a opção de Serviço Avulso.');
                return;
            }
            if (!resposta.ok) throw new Error('Erro na comunicação.');

            const veiculo = await resposta.json();
            listaServicosReciboRadios.innerHTML = '';

            // Renderiza a lista de Radio Buttons (Garante que só escolha UM serviço para a nota)
            veiculo.historico.forEach((s, idx) => {
                const dataFmt = s.dataServico ? s.dataServico.split('-').reverse().join('/') : 'N/D';
                const radioHtml = `
                    <label style="display: flex; align-items: flex-start; gap: 10px; cursor: pointer; padding: 5px; border-bottom: 1px solid #f1f5f9;">
                        <input type="radio" name="radio-servico-recibo" class="rad-recibo" data-index="${idx}" style="margin-top: 3px;">
                        <div>
                            <span style="font-size: 13px; font-weight: bold;">Data: ${dataFmt} - Valor: R$ ${s.valor.toFixed(2).replace('.', ',')}</span>
                            <br><small style="color: #64748b;">${s.descricao}</small>
                        </div>
                    </label>
                `;
                listaServicosReciboRadios.insertAdjacentHTML('beforeend', radioHtml);
            });

            // Cria o ouvinte para interceptar qual rádio ele escolheu
            document.querySelectorAll('.rad-recibo').forEach(radio => {
                radio.addEventListener('change', (e) => {
                    const index = parseInt(e.target.getAttribute('data-index'));
                    const sOriginal = veiculo.historico[index];
                    servicoSelecionadoObjeto = {
                        data: sOriginal.dataServico ? sOriginal.dataServico.split('-').reverse().join('/') : 'N/D',
                        descricao: sOriginal.descricao,
                        valor: sOriginal.valor
                    };
                    blocoAvancarPasso1.style.display = 'block'; // Libera o avanço
                });
            });

            listaServicosReciboContainer.style.display = 'block';

        } catch (erro) {
            console.error(erro);
            alert('Erro ao carregar serviços.');
        }
    });

    // Transição do Passo 1 para o Passo 2
    btnAvancarRecibo.addEventListener('click', () => {
        reciboPasso1.style.display = 'none';
        reciboPasso2.style.display = 'block';

        const descInput = document.getElementById('rec-servico-descricao');
        const valorInput = document.getElementById('rec-servico-valor');
        const dataInput = document.getElementById('rec-servico-data');

        if (fluxoReciboExistente && servicoSelecionadoObjeto) {
            // 🔥 Bloqueia os campos e injeta os dados reais do MySQL para o mecânico não trapacear
            descInput.value = servicoSelecionadoObjeto.descricao;
            valorInput.value = servicoSelecionadoObjeto.valor;
            
            // Converte "dd/mm/aaaa" de volta para o padrão "yyyy-mm-dd" do input date
            if (servicoSelecionadoObjeto.data !== 'N/D') {
                dataInput.value = servicoSelecionadoObjeto.data.split('/').reverse().join('-');
            }
            
            blocoDadosServicoRecibo.style.opacity = "0.7";
            descInput.disabled = true;
            valorInput.disabled = true;
            dataInput.disabled = true;
        } else {
            // 🔵 Libera tudo limpo para digitação livre (Serviço Avulso)
            blocoDadosServicoRecibo.style.opacity = "1";
            descInput.disabled = false;
            valorInput.disabled = false;
            dataInput.disabled = false;
        }
    });

    // INTERCEPTADOR DO SUBMIT: GERADOR DO LAYOUT DA NOTA/RECIBO FISCAL
    formReciboFinal.addEventListener('submit', async (e) => {
        e.preventDefault();

        const dadosOficina = await buscarDadosOficina();
        
        // Pega dados da Empresa Cliente
        const empNome = document.getElementById('rec-cliente-nome').value;
        const empDoc = document.getElementById('rec-cliente-documento').value;
        const empEmail = document.getElementById('rec-cliente-email').value || 'Não informado';

        // Pega dados do serviço (independente de estar bloqueado ou livre)
        const sDesc = document.getElementById('rec-servico-descricao').value;
        const sValRaw = parseFloat(document.getElementById('rec-servico-valor').value) || 0;
        const sDataRaw = document.getElementById('rec-servico-data').value;
        const sDataFmt = sDataRaw ? sDataRaw.split('-').reverse().join('/') : '--/--/----';

        let logoHtml = `<h2 style="margin: 0; font-size: 22px; color: #0f172a;">${dadosOficina.nomeOficina}</h2>`;
        if (dadosOficina.logoBase64) {
            logoHtml = `<img src="${dadosOficina.logoBase64}" style="max-height: 45px; max-width: 140px; object-fit: contain;">`;
        }

        const templateReciboPDF = document.createElement('div');
        templateReciboPDF.innerHTML = `
            <div style="width: 170mm; font-family: 'Courier New', Courier, monospace; padding: 15px; color: #0f172a; margin: 0 auto; box-sizing: border-box; font-size: 13px; min-height: 275mm; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 15px;">
                        <div>
                            ${logoHtml}
                            <br><small style="font-size: 11px;">CNPJ: ${dadosOficina.cnpj || '---'}</small>
                        </div>
                        <div style="border: 1px solid #0f172a; padding: 4px 8px; font-weight: bold; font-size: 11px; letter-spacing: 1px; background: #f8fafc;">RECIBO DE PRESTAÇÃO DE SERVIÇOS</div>
                    </div>

                    <div style="margin-bottom: 15px; font-size: 12px; color: #334155; line-height: 1.4; border-bottom: 1px solid #cbd5e1; padding-bottom: 10px;">
                        <p><strong>Prestador:</strong> ${dadosOficina.nomeOficina}</p>
                        <p><strong>Endereço:</strong> ${dadosOficina.endereco}</p>
                    </div>

                    <div style="background: #f8fafc; padding: 12px; border: 1px solid #cbd5e1; border-radius: 4px; margin-bottom: 20px; line-height: 1.5;">
                        <h4 style="margin: 0 0 8px 0; font-size: 13px; text-transform: uppercase; border-bottom: 1px dashed #cbd5e1; padding-bottom: 3px;">Tomador do Serviço (Cliente)</h4>
                        <p><strong>Razão Social:</strong> ${empNome}</p>
                        <p><strong>CNPJ / CPF:</strong> ${empDoc}</p>
                        <p><strong>E-mail:</strong> ${empEmail}</p>
                    </div>

                    <h3 style="border-bottom: 1px solid #0f172a; padding-bottom: 3px; font-size: 13px; margin-top: 20px;">Discriminação dos Serviços Executados</h3>
                    <div style="padding: 15px; border: 1px solid #e2e8f0; min-height: 60mm; margin-bottom: 15px; white-space: pre-wrap; background: #fff; line-height: 1.5;">${sDesc}</div>
                </div>

                <div>
                    <div style="text-align: right; margin-bottom: 15px; border-top: 1px solid #0f172a; padding-top: 8px;">
                        <p style="margin: 0 0 4px 0;"><strong>Data de Emissão:</strong> ${sDataFmt}</p>
                        <h3 style="margin: 0; font-size: 16px; font-weight: bold;">VALOR LÍQUIDO DO RECIBO: R$ ${sValRaw.toFixed(2).replace('.', ',')}</h3>
                    </div>

                    <div style="text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 10px; font-size: 10px; color: #64748b; margin-top: 25px;">
                        <p style="font-weight: bold; margin: 0; color: #334155;">${dadosOficina.mensagemRodape}</p>
                        <p style="margin-top: 3px; font-size: 9px;">Documento administrativo gerado sem valor de cupom fiscal síncrono municipal.</p>
                    </div>
                </div>
            </div>
        `;

        const opcoes = {
            margin:       10,
            filename:     `recibo_servico_${empNome.toLowerCase().replace(/\s+/g, '_')}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        setTimeout(() => {
            html2pdf().set(opcoes).from(templateReciboPDF).save();
            alert('Recibo gerado e baixado com sucesso!');
            resetarFluxoRecibo();
            if (botoesVoltar[0]) botoesVoltar[0].click(); // Volta pro menu principal
        }, 200);
    });


    // FUNÇÃO AUXILIAR CENTRALIZADA PARA BUSCAR CONFIGURAÇÕES DA OFICINA
    async function buscarDadosOficina() {
        let padrao = {
            nomeOficina: "DiagnostiCar",
            cnpj: "",
            endereco: "Configurar Endereço nas Configurações",
            telefone: "",
            mensagemRodape: "Documento gerado administrativamente pelo painel DiagnostiCar",
            logoBase64: ""
        };
        try {
            const respostaOficina = await fetch('https://diagnosticar-api.onrender.com/api/configuracoes/oficina');
            if (respostaOficina.ok) {
                return await respostaOficina.json();
            }
        } catch (erro) {
            console.error("Erro ao carregar dados da oficina:", erro);
        }
        return padrao;
    }
// ==========================================================================
    // 💾 INTERCEPTADOR DO FORMULÁRIO DE CADASTRO (CORRIGIDO E SEGURO)
    // ==========================================================================
    if (formularioNovo) {
        formularioNovo.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Captura os dados diretamente do HTML usando os IDs corretos do seu index
            const placa = document.getElementById('serv-placa')?.value || '';
            const modelo = document.getElementById('serv-modelo')?.value || '';
            const ano = document.getElementById('serv-ano')?.value || '';
            const descricao = document.getElementById('serv-descricao')?.value || '';
            const valorRaw = document.getElementById('serv-valor')?.value || '0';
            const dataRaw = document.getElementById('serv-data')?.value || '';

            // Limpa a formatação de moeda para mandar um número limpo para o Java
            const valorNumerico = parseFloat(valorRaw) || 0;
            
            // 🚀 Tratamento da data para o formato YYYY-MM-DD que o MySQL exige
            let dataFormatadaParaJava = dataRaw;
            if (dataRaw.includes('/')) {
                dataFormatadaParaJava = dataRaw.split('/').reverse().join('-');
            }

            
            // 1. Pega os dados da oficina logada
            const usuarioSalvo = JSON.parse(localStorage.getItem('oficina_logada'));
            const usuarioId = usuarioSalvo ? usuarioSalvo.id : null;

            // Monta o payload perfeitamente alinhado com o Java DTO
            const payload = {
                placa: placa.trim().toUpperCase(),
                modelo: modelo.trim(),
                ano: parseInt(ano) || 0,
                descricao: descricao.trim(),
                valor: valorNumerico, // 🚀 Ajustado para 'valor'
                dataServico: dataFormatadaParaJava, // 🚀 Data tratada para o Java
                formaPagamento: document.getElementById('serv-forma-pagamento')?.value || 'A_VISTA',
                usuario: usuarioId ? { id: usuarioId } : null,
                
                // Dados do devedor caso seja fiado
                fiadoNome: document.getElementById('fiado-cliente-nome')?.value || '',
                fiadoApelido: document.getElementById('fiado-cliente-apelido')?.value || '',
                fiadoDocumento: document.getElementById('fiado-cliente-documento')?.value || '',
                fiadoTelefone: document.getElementById('fiado-cliente-telefone')?.value || ''
            };

            try {
                const resposta = await fetch(`${API_URL}/novo`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!resposta.ok) {
                const erroApi = await resposta.text();
                throw new Error(`Status ${resposta.status}: ${erroApi}`);
                }
                alert(`Veículo ${modelo} (${placa}) e serviço gravados no MySQL com sucesso!`);
                
                formularioNovo.reset();
                if (botoesVoltar[0]) botoesVoltar[0].click(); // Volta para o painel inicial do app

            } catch (erro) {
                console.error('Erro ao salvar serviço:', erro);
                alert("ERRO DETALHADO: " + erro.message);
            }
        });
    }

    // ==========================================================================
    // 💵 LÓGICA DE SELEÇÃO ESTILO APP: À VISTA OU A PRAZO (FIADO)
    // ==========================================================================
    const btnPagVista = document.getElementById('btn-pag-vista');
    const btnPagPrazo = document.getElementById('btn-pag-prazo');
    const inputHiddenPagamento = document.getElementById('serv-forma-pagamento');
    const blocoClienteFiado = document.getElementById('bloco-cliente-fiado');
    const inputFiadoNome = document.getElementById('fiado-cliente-nome');
    const inputFiadoDocumento = document.getElementById('fiado-cliente-documento');

    function alternarFormaPagamento(opcao) {
        if (!inputHiddenPagamento || !blocoClienteFiado) return;

        // Atualiza o valor do input hidden para o Spring Boot
        inputHiddenPagamento.value = opcao;

        if (opcao === 'A_PRAZO') {
            btnPagPrazo.classList.add('ativo');
            btnPagVista.classList.remove('ativo');
            
            // Mostra o bloco do fiado e liga a obrigatoriedade
            blocoClienteFiado.style.display = 'block';
            if (inputFiadoNome) inputFiadoNome.required = true;
            if (inputFiadoDocumento) inputFiadoDocumento.required = true;
        } else {
            btnPagVista.classList.add('ativo');
            btnPagPrazo.classList.remove('ativo');
            
            // Esconde o bloco do fiado e desliga a obrigatoriedade
            blocoClienteFiado.style.display = 'none';
            if (inputFiadoNome) inputFiadoNome.required = false;
            if (inputFiadoDocumento) inputFiadoDocumento.required = false;
            
            // Limpa os campos internos
            const inputsInternos = blocoClienteFiado.querySelectorAll('input');
            inputsInternos.forEach(input => input.value = '');
        }
    }

    // Ouvintes de clique nos botões estilo App
    if (btnPagVista && btnPagPrazo) {
        btnPagVista.addEventListener('click', () => alternarFormaPagamento('A_VISTA'));
        btnPagPrazo.addEventListener('click', () => alternarFormaPagamento('A_PRAZO'));
    }

});