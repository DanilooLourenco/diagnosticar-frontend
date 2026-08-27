document.addEventListener("DOMContentLoaded", function () {
    // Pegando as inputs do formulário
    const inputData = document.getElementById("orc-data");
    const inputModelo = document.getElementById("orc-modelo");
    const inputAno = document.getElementById("orc-ano");
    const inputMecanico = document.getElementById("orc-mecanico");
    const inputServico = document.getElementById("orc-servico");
    const inputValor = document.getElementById("orc-valor");
    const inputTempo = document.getElementById("orc-tempo");

    // Pegando os elementos do papel de Preview
    const viewData = document.getElementById("view-data");
    const viewCarro = document.getElementById("view-carro");
    const viewMecanico = document.getElementById("view-mecanico");
    const viewServico = document.getElementById("view-servico");
    const viewTempo = document.getElementById("view-tempo");
    const viewValor = document.getElementById("view-valor");

    // Evento para atualizar o papel de Parede conforme digita
    function atualizarPreview() {
        // Formata a data para padrão BR
        if(inputData.value) {
            const dataBr = inputData.value.split("-").reverse().join("/");
            viewData.innerText = dataBr;
        }
        
        viewCarro.innerText = `${inputModelo.value || '------------------'} ${inputAno.value ? '- ' + inputAno.value : ''}`;
        viewMecanico.innerText = inputMecanico.value || '------------------';
        viewServico.innerText = inputServico.value || 'Nenhum serviço descrito ainda...';
        viewTempo.innerText = inputTempo.value || '--';
        
        // Formata o valor digitado para moeda decimal
        const valorDigitado = parseFloat(inputValor.value);
        viewValor.innerText = isNaN(valorDigitado) ? "0,00" : valorDigitado.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    }

    // Ouvintes para atualizar em tempo real
    inputData.addEventListener("input", atualizarPreview);
    inputModelo.addEventListener("input", atualizarPreview);
    inputAno.addEventListener("input", atualizarPreview);
    inputMecanico.addEventListener("input", atualizarPreview);
    inputServico.addEventListener("input", atualizarPreview);
    inputValor.addEventListener("input", atualizarPreview);
    inputTempo.addEventListener("input", atualizarPreview);

    // 🖨️ AÇÃO DO BOTÃO IMPRIMIR
    document.getElementById("btn-imprimir").addEventListener("click", function() {
        window.print(); // Dispara o comando nativo de impressão do PC/Celular
    });

    // 💬 AÇÃO DO BOTÃO WHATSAPP
    document.getElementById("btn-whatsapp").addEventListener("click", function() {
        const dataBr = inputData.value ? inputData.value.split("-").reverse().join("/") : "--/--/----";
        
        // Monta o texto limpo com quebras de linha para mandar pro cliente
        const textoZap = encodeURIComponent(
`*🛠️ ORÇAMENTO - DIAGNOSTICAR*
---------------------------------------
*Data:* ${dataBr}
*Veículo:* ${inputModelo.value} (${inputAno.value})
*Mecânico:* ${inputMecanico.value}

*Serviço Realizado:*
${inputServico.value}

*Tempo Estimado:* ${inputTempo.value}
---------------------------------------
*💰 VALOR TOTAL:* R$ ${parseFloat(inputValor.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

_Ficamos no aguardo da sua aprovação!_`
        );

       // Abre direto no aplicativo do celular ou no WhatsApp Web no PC
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
if (isMobile) {
    window.location.href = `whatsapp://send?text=${textoZap}`;
} else {
    window.open(`https://web.whatsapp.com/send?text=${textoZap}`, "_blank");
}
    });

    // ==========================================================================
    // 📄 GERADOR DE ORÇAMENTO PDF COM DADOS DINÂMICOS DA OFICINA
    // ==========================================================================
    document.getElementById('btn-pdf').addEventListener('click', async () => {
        
        // 🚀 1. BUSCA OS DADOS DA OFICINA ATUALIZADOS NO BANCO VIA JAVA
        let dadosOficina = {
            nomeOficina: "DiagnostiCar",
            endereco: "Configurar Endereço nas Configurações",
            telefone: "",
            mensagemRodape: "Orçamento válido por 10 dias.",
            logoBase64: ""
        };

        try {
            const respostaOficina = await fetch('https://diagnosticar-api.onrender.com/api/configuracoes/oficina');
            if (respostaOficina.ok) {
                dadosOficina = await respostaOficina.json();
            }
        } catch (erro) {
            console.error("Não foi possível carregar os dados da oficina para o PDF do orçamento:", erro);
        }

        // Pega os valores atuais dos inputs para montar o PDF
        const dataBr = inputData.value ? inputData.value.split("-").reverse().join("/") : "--/--/----";
        const modeloCarro = inputModelo.value || 'Não Informado';
        const anoCarro = inputAno.value || '';
        const mecanicoResponsavel = inputMecanico.value || 'Não Informado';
        const descricaoServico = inputServico.value || 'Nenhum serviço descrito...';
        const tempoEstimado = inputTempo.value || '--';
        
        const valorDigitado = parseFloat(inputValor.value);
        const valorFormatado = isNaN(valorDigitado) ? "0,00" : valorDigitado.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

        // Gerencia dinamicamente o topo: se tiver logo, renderiza a imagem; senão, o texto do nome
        let logoHtml = `<h2 style="margin: 0; font-size: 22px; color: #1e293b;">${dadosOficina.nomeOficina}</h2>`;
        if (dadosOficina.logoBase64) {
            logoHtml = `<img src="${dadosOficina.logoBase64}" style="max-height: 50px; max-width: 150px; object-fit: contain;">`;
        }

        // 🚀 2. CRIA O TEMPLATE EM MEMÓRIA TOTALMENTE FORMATADO COMO FOLHA A4
        const templateOrcamento = document.createElement('div');
        templateOrcamento.innerHTML = `
            <div style="width: 170mm; font-family: 'Courier New', Courier, monospace; padding: 15px; color: #0f172a; margin: 0 auto; box-sizing: border-box; font-size: 13px; min-height: 275mm; display: flex; flex-direction: column; justify-content: space-between;">
                
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 20px;">
                        <div>
                            ${logoHtml}
                            <br>
                            <small style="font-size: 11px; color: #475569;">${dadosOficina.nomeOficina} - Painel de Orçamentos</small>
                        </div>
                        <div style="border: 1px solid #0f172a; padding: 5px 10px; font-weight: bold; font-size: 12px; letter-spacing: 1px;">ORÇAMENTO DE SERVIÇO</div>
                    </div>
                    
                    <div style="margin-bottom: 20px; line-height: 1.6;">
                        <p style="margin: 0 0 5px 0;"><strong>Data do Orçamento:</strong> ${dataBr}</p>
                        <p style="margin: 0 0 5px 0;"><strong>Veículo:</strong> ${modeloCarro} ${anoCarro ? '- ' + anoCarro : ''}</p>
                        <p style="margin: 0 0 5px 0;"><strong>Responsável Técnico:</strong> ${mecanicoResponsavel}</p>
                    </div>

                    <h3 style="border-bottom: 1px solid #0f172a; padding-bottom: 3px; font-size: 14px; margin-top: 25px;">Descrição do Serviço Proposto</h3>
                    <div style="background: #f8fafc; padding: 15px; border-radius: 4px; border: 1px dashed #cbd5e1; min-height: 80mm; margin-bottom: 20px; white-space: pre-wrap; font-size: 13px; line-height: 1.5;">${descricaoServico}</div>
                </div>

                <div>
                    <div style="text-align: right; margin-bottom: 10px; line-height: 1.5;">
                        <p style="margin: 0 0 5px 0;"><strong>Tempo Estimado:</strong> ${tempoEstimado}</p>
                        <h3 style="margin: 0; font-size: 18px; font-weight: bold; border-top: 1px solid #0f172a; padding-top: 5px;">VALOR TOTAL: R$ ${valorFormatado}</h3>
                    </div>

                    <div style="text-align: center; border-top: 1px solid #cbd5e1; padding-top: 15px; font-size: 11px; color: #64748b; margin-top: 40px;">
                        <p style="margin: 0 0 5px 0;">${dadosOficina.endereco} ${dadosOficina.telefone ? ' - Tel/Whats: ' + dadosOficina.telefone : ''}</p>
                        <p style="font-weight: bold; margin: 0; color: #334155;">${dadosOficina.mensagemRodape}</p>
                    </div>
                </div>

            </div>
        `;

        const nomeArquivo = `orcamento_${modeloCarro.toLowerCase().replace(/\s+/g, '_')}.pdf`;

        const opcoes = {
            margin:       10,
            filename:     nomeArquivo,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, letterRendering: true }, 
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // Renderiza e executa o download automático com um pequeno delay de sincronia
        setTimeout(() => {
            html2pdf().set(opcoes).from(templateOrcamento).save();
        }, 150);
    });
});