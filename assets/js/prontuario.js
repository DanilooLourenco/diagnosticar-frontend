const campoBuscaPlaca = document.getElementById('campoBuscaPlaca');
const btnBuscarProntuario = document.getElementById('btnBuscarProntuario');
const dadosDoVeiculo = document.getElementById('dadosDoVeiculo');
const prontuarioModelo = document.getElementById('prontuarioModelo');
const prontuarioAno = document.getElementById('prontuarioAno');
const prontuarioPlaca = document.getElementById('prontuarioPlaca');
const listaProntuario = document.getElementById('listaProntuario');

async function consultarProntuário() {
    const placa = campoBuscaPlaca.value.trim().toUpperCase();
    
    if (!placa) {
        alert("Por favor, digite uma placa válida.");
        return;
    }

    try {
        // Bate na rota do Java que busca o histórico de diagnósticos por áudio
        const resposta = await fetch(`https://diagnosticar-api.onrender.com/api/diagnosticos/placa/${placa}`);
        
        if (!resposta.ok) {
            throw new Error('Falha na comunicação com o servidor de diagnósticos.');
        }

        const diagnosticos = await resposta.json();

        // Validação defensiva: se a lista vier vazia ou nula
        if (!diagnosticos || diagnosticos.length === 0) {
            if (dadosDoVeiculo) dadosDoVeiculo.style.display = 'none';
            listaProntuario.innerHTML = `<p style="color: #e74c3c; font-weight: bold; text-align: center;">Nenhum histórico de áudio encontrado para a placa ${placa}.</p>`;
            return;
        }

        // Pega os dados do veículo do primeiro registro encontrado com segurança
        const primeiroRegistro = diagnosticos[0];
        if (primeiroRegistro && primeiroRegistro.carro) {
            const carro = primeiroRegistro.carro;
            prontuarioModelo.innerText = `${carro.marca || ''} - ${carro.modelo || 'Detectado pela Placa'}`;
            prontuarioAno.innerText = carro.ano || '2026';
            prontuarioPlaca.innerText = carro.placa || placa;
            if (dadosDoVeiculo) dadosDoVeiculo.style.display = 'block';
        } else {
            // Caso o diagnóstico exista mas o relacionamento com carro esteja nulo
            prontuarioModelo.innerText = "Veículo Não Identificado";
            prontuarioAno.innerText = "N/D";
            prontuarioPlaca.innerText = placa;
            if (dadosDoVeiculo) dadosDoVeiculo.style.display = 'block';
        }

        // Desenha a linha do tempo de atendimentos na tela
        listaProntuario.innerHTML = "";
        
        diagnosticos.forEach((d, index) => {
            // Tratamento caso a data venha nula do banco
            const dataFmt = d.dataHora ? new Date(d.dataHora).toLocaleString('pt-BR') : 'Data não registrada';
            const card = document.createElement('div');
            card.style = "border: 1px solid #e0e0e0; padding: 15px; margin-bottom: 15px; border-radius: 6px; background-color: #fdfdfd; box-shadow: 0 2px 4px rgba(0,0,0,0.02); text-align: left;";
            
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px dashed #eee; padding-bottom: 5px;">
                    <span style="color: #3498db; font-weight: bold;">#Atendimento ${index + 1}</span>
                    <span style="color: #7f8c8d; font-size: 14px;">📅 ${dataFmt}</span>
                </div>
                <p style="margin: 5px 0; font-size: 14px; color: #555;"><strong>Relato do Mecânico:</strong> <em>"${d.transcricaoAudio || 'Sem transcrição disponível.'}"</em></p>
                <div style="margin-top: 10px; padding: 12px; background-color: #f8f9fa; border-radius: 4px; font-size: 14px; white-space: pre-line; border-left: 3px solid #2ecc71;">
                    <strong>Laudo do Especialista (IA):</strong>\n${d.relatorioEstruturado || 'Sem laudo gerado.'}
                </div>
            `;
            listaProntuario.appendChild(card);
        });

    } catch (erro) {
        console.error("Erro ao buscar prontuário:", erro);
        alert("Erro ao conectar com o servidor para buscar o prontuário. Certifique-se de que a API no IntelliJ está rodando.");
    }
}

if (btnBuscarProntuario) {
    btnBuscarProntuario.addEventListener('click', consultarProntuário);
}