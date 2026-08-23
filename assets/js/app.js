document.addEventListener('DOMContentLoaded', () => {
    const itensMenu = document.querySelectorAll('.menu-item');
    const telas = document.querySelectorAll('.tela-container');

    itensMenu.forEach(item => {
        item.addEventListener('click', () => {
            // 1. Remove a classe active de todos os botões do menu
            itensMenu.forEach(i => i.classList.remove('active'));
            
            // 2. Adiciona active no botão clicado
            item.classList.add('active');

            // 3. Esconde todas as telas
            telas.forEach(tela => tela.classList.remove('active'));

            // 4. Mostra a tela correspondente ao botão clicado
            const idTela = item.getAttribute('data-tela');
            const telaAlvo = document.getElementById(idTela);
            if (telaAlvo) {
                telaAlvo.classList.add('active');
            }
        });
    });
});