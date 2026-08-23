async function carregarBalancoFinanceiro() {
    const usuarioSalvo = JSON.parse(localStorage.getItem('oficina_logada'));
    if (!usuarioSalvo || !usuarioSalvo.id) return;

    try {
        const resposta = await fetch(`https://diagnosticar-api.onrender.com/api/diagnosticos/api/servicos/balanco/${usuarioSalvo.id}`);
        if (!resposta.ok) throw new Error('Falha ao obter dados');

        const dados = await resposta.json();

        const formatarMoeda = (val) => Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        document.getElementById('balanco-total-geral').textContent = formatarMoeda(dados.totalGeral || 0);
        document.getElementById('balanco-total-vista').textContent = formatarMoeda(dados.totalVista || 0);
        document.getElementById('balanco-total-fiado').textContent = formatarMoeda(dados.totalFiado || 0);

    } catch (erro) {
        console.error('Erro ao carregar balanço:', erro);
    }
}

document.getElementById('btnAtualizarBalanco')?.addEventListener('click', carregarBalancoFinanceiro);