let mediaRecorder;
let audioChunks = [];

const btnIniciar = document.getElementById('btnIniciar');
const btnParar = document.getElementById('btnParar');
const statusTexto = document.getElementById('status');
const resultadoBox = document.getElementById('resultado');

if (btnIniciar) {
    btnIniciar.addEventListener('click', async () => {
        audioChunks = [];
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            statusTexto.innerText = "Status: Analisando sintomas com a IA...";
            
            // Envia APENAS o arquivo de áudio puro para o Java
            const formData = new FormData();
            formData.append('audio', audioBlob, 'audio.wav');

            try {
                // Rota simplificada da IA
                const resposta = await fetch("https://diagnosticar-api.onrender.com/api/diagnosticos/audio", {
                    method: 'POST',
                    body: formData
                });
                
                const dados = await resposta.json();
                
                // Exibe a resposta independente do nome que veio do Java
                if (dados.relatorioEstruturado) {
                    resultadoBox.innerText = dados.relatorioEstruturado;
                } else if (dados.relatorio) {
                    resultadoBox.innerText = dados.relatorio;
                } else if (dados.laudo) {
                    resultadoBox.innerText = dados.laudo;
                } else {
                    resultadoBox.innerText = typeof dados === 'string' ? dados : JSON.stringify(dados);
                }

                statusTexto.innerText = "Status: Análise concluída!";
            } catch (erro) {
                console.error("Erro na IA:", erro);
                statusTexto.innerText = "Status: Erro ao analisar.";
                alert("Não foi possível processar o áudio.");
            }
        };

        mediaRecorder.start();
        btnIniciar.disabled = true;
        btnParar.disabled = false;
        statusTexto.innerText = "Status: Ouvindo sintomas...";
    });
}

if (btnParar) {
    btnParar.addEventListener('click', () => {
        mediaRecorder.stop();
        btnIniciar.disabled = false;
        btnParar.disabled = true;
    });
}