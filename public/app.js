document.addEventListener("DOMContentLoaded", () => {
    // Seleção de elementos
    const contentSections = document.querySelectorAll("main section");
    const btnInserir = document.getElementById("btnInserir");
    const btnListar = document.getElementById("btnListar");
    const btnAlterar = document.getElementById("btnAlterar");
    const btnExcluir = document.getElementById("btnExcluir");
    const tabelaFotos = document.getElementById("tabelaFotos");
    const formInserir = document.getElementById("formInserir");
    const formAlterar = document.getElementById("formAlterar");
    const paginationContainer = document.getElementById("pagination");
    
    // Modal de confirmação
    const confirmacaoModal = new bootstrap.Modal(document.getElementById('confirmacaoModal'));
    const btnExcluirConfirmado = document.getElementById('btnExcluirConfirmado');
    let fotoParaExcluir = null;

    // Configuração de paginação
    const itensPorPagina = 5;
    let paginaAtual = 1;
    let todasFotosFiltradas = [];

    // Alternar visibilidade das seções
    function mostrarSecao(secaoId) {
        contentSections.forEach(section => {
            section.classList.add("d-none");
        });
        document.getElementById(secaoId).classList.remove("d-none");
    }

    // Mostrar a seção de inserir ao carregar a página
    mostrarSecao("inserir");

    // Eventos dos botões do menu
    btnInserir.addEventListener("click", () => mostrarSecao("inserir"));
    btnListar.addEventListener("click", () => {
        paginaAtual = 1;
        listarFotos();
        mostrarSecao("listar");
    });
    btnAlterar.addEventListener("click", () => mostrarSecao("alterar"));
    btnExcluir.addEventListener("click", () => mostrarSecao("excluir"));

    // Função para preencher o formulário de alteração
    function preencherFormularioAlteracao(id, title, url) {
        document.getElementById("idAlterar").value = id;
        document.getElementById("novoTitulo").value = title;
        document.getElementById("novaUrl").value = url;
        mostrarSecao("alterar");
    }

    // Criar paginação
    function criarPaginacao(totalItems) {
        const totalPaginas = Math.ceil(totalItems / itensPorPagina);
        paginationContainer.innerHTML = '';

        // Botão anterior
        const prevItem = document.createElement('li');
        prevItem.className = `page-item ${paginaAtual === 1 ? 'disabled' : ''}`;
        prevItem.innerHTML = '<a class="page-link" aria-label="Anterior"><span aria-hidden="true">&laquo;</span></a>';
        prevItem.addEventListener('click', () => {
            if (paginaAtual > 1) {
                paginaAtual--;
                exibirItensPagina();
            }
        });
        paginationContainer.appendChild(prevItem);

        // Botões de páginas
        for (let i = 1; i <= totalPaginas; i++) {
            const pageItem = document.createElement('li');
            pageItem.className = `page-item ${i === paginaAtual ? 'active' : ''}`;
            pageItem.innerHTML = `<a class="page-link">${i}</a>`;
            pageItem.addEventListener('click', () => {
                paginaAtual = i;
                exibirItensPagina();
            });
            paginationContainer.appendChild(pageItem);
        }

        // Botão próximo
        const nextItem = document.createElement('li');
        nextItem.className = `page-item ${paginaAtual === totalPaginas ? 'disabled' : ''}`;
        nextItem.innerHTML = '<a class="page-link" aria-label="Próximo"><span aria-hidden="true">&raquo;</span></a>';
        nextItem.addEventListener('click', () => {
            if (paginaAtual < totalPaginas) {
                paginaAtual++;
                exibirItensPagina();
            }
        });
        paginationContainer.appendChild(nextItem);
    }

    // Exibir itens da página atual
    function exibirItensPagina() {
        tabelaFotos.innerHTML = '';
        
        const inicio = (paginaAtual - 1) * itensPorPagina;
        const fim = Math.min(inicio + itensPorPagina, todasFotosFiltradas.length);
        
        // Atualizar classe ativa nos botões de paginação
        const pageItems = paginationContainer.querySelectorAll('.page-item');
        pageItems.forEach((item, index) => {
            if (index === 0) {
                item.className = `page-item ${paginaAtual === 1 ? 'disabled' : ''}`;
            } else if (index === pageItems.length - 1) {
                item.className = `page-item ${paginaAtual === Math.ceil(todasFotosFiltradas.length / itensPorPagina) ? 'disabled' : ''}`;
            } else {
                item.className = `page-item ${index === paginaAtual ? 'active' : ''}`;
            }
        });
        
        // Renderizar fotos da página atual
        for (let i = inicio; i < fim; i++) {
            const foto = todasFotosFiltradas[i];
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${foto.id}</td>
                <td>${foto.title}</td>
                <td><img src="${foto.thumbnailUrl}" alt="${foto.title}" class="img-thumbnail"></td>
                <td>
                    <i class="bi bi-pencil-square acao-icon icon-editar alterar-foto" 
                       data-id="${foto.id}" 
                       data-title="${foto.title.replace(/"/g, '&quot;')}" 
                       data-url="${foto.thumbnailUrl}"></i>
                    <i class="bi bi-trash acao-icon icon-excluir excluir-foto" 
                       data-id="${foto.id}" 
                       data-source="${foto.source}"></i>
                </td>
            `;
            tabelaFotos.appendChild(row);
        }

        // Adicionar eventos aos ícones de alterar
        document.querySelectorAll('.alterar-foto').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const title = this.getAttribute('data-title');
                const url = this.getAttribute('data-url');
                preencherFormularioAlteracao(id, title, url);
            });
        });

        // Adicionar eventos aos ícones de excluir
        document.querySelectorAll('.excluir-foto').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const source = this.getAttribute('data-source');
                
                // Armazenar temporariamente os dados da foto a ser excluída
                fotoParaExcluir = { id, source };
                
                // Mostrar modal de confirmação
                confirmacaoModal.show();
            });
        });
    }

    // Listar fotos da API E do localStorage
    async function listarFotos() {
        try {
            // Buscar fotos da API
            const response = await fetch("https://jsonplaceholder.typicode.com/photos?_limit=10");
            const fotosAPI = await response.json();
            
            // Adicionar propriedade para identificar a fonte
            fotosAPI.forEach(foto => {
                foto.source = "api";
            });

            // Buscar fotos do localStorage
            const fotosLocal = JSON.parse(localStorage.getItem("fotos")) || [];
            fotosLocal.forEach(foto => {
                foto.source = "local";
            });
            
            // Combinar as duas fontes de fotos
            todasFotosFiltradas = [...fotosAPI, ...fotosLocal];
            
            // Criar paginação
            criarPaginacao(todasFotosFiltradas.length);
            
            // Exibir primeira página
            paginaAtual = 1;
            exibirItensPagina();
        } catch (error) {
            console.error("Erro ao buscar fotos:", error);
        }
    }

    // Evento para confirmar exclusão no modal
    btnExcluirConfirmado.addEventListener('click', function() {
        if (fotoParaExcluir) {
            excluirFoto(fotoParaExcluir.id, fotoParaExcluir.source);
            confirmacaoModal.hide();
            fotoParaExcluir = null;
        }
    });

    // Função para excluir foto
    function excluirFoto(id, source) {
        if (source === "local") {
            // Se for do localStorage, podemos excluir permanentemente
            let fotos = JSON.parse(localStorage.getItem("fotos")) || [];
            const index = fotos.findIndex(foto => foto.id == id);
            
            if (index !== -1) {
                fotos.splice(index, 1);
                localStorage.setItem("fotos", JSON.stringify(fotos));
                alert("Foto excluída com sucesso!");
                listarFotos(); // Atualiza a lista
            }
        } else if (source === "api") {
            // Se for da API, vamos "esconder" adicionando à lista de excluídos
            let fotosExcluidas = JSON.parse(localStorage.getItem("fotosExcluidas")) || [];
            fotosExcluidas.push(parseInt(id));
            localStorage.setItem("fotosExcluidas", JSON.stringify(fotosExcluidas));
            alert("Foto da API escondida da lista!");
            listarFotos(); // Atualiza a lista
        }
    }

    // Adicionar nova foto (simulação via LocalStorage)
    formInserir.addEventListener("submit", (event) => {
        event.preventDefault();
        const titulo = document.getElementById("titulo").value;
        const url = document.getElementById("url").value;

        if (titulo && url) {
            const novasFotos = JSON.parse(localStorage.getItem("fotos")) || [];
            
            // Gerar um ID único que não conflita com os da API (começando de 1000)
            let novoId = 1000;
            if (novasFotos.length > 0) {
                // Encontrar o maior ID existente e adicionar 1
                novoId = Math.max(...novasFotos.map(f => f.id)) + 1;
            }
            
            const novaFoto = {
                id: novoId,
                title: titulo,
                thumbnailUrl: url
            };

            novasFotos.push(novaFoto);
            localStorage.setItem("fotos", JSON.stringify(novasFotos));
            alert("Foto adicionada com sucesso!");
            formInserir.reset();
            
            // Redirecionar para a lista para mostrar a nova foto
            listarFotos();
            mostrarSecao("listar");
        }
    });

    // Excluir foto pelo ID (via formulário de exclusão)
    document.getElementById("btnConfirmarExclusao").addEventListener("click", () => {
        const idExcluir = document.getElementById("idExcluir").value;
        
        // Verificar se o ID existe antes de mostrar a confirmação
        let fotos = JSON.parse(localStorage.getItem("fotos")) || [];
        const foto = fotos.find(foto => foto.id == idExcluir);
        
        if (foto) {
            // Definir o ID e origem da foto a ser excluída
            fotoParaExcluir = { id: idExcluir, source: "local" };
            // Mostrar modal de confirmação
            confirmacaoModal.show();
        } else {
            alert("Foto não encontrada no armazenamento local.");
        }
    });

    // Alterar foto pelo ID
    document.getElementById("btnConfirmarAlteracao").addEventListener("click", () => {
        const idAlterar = document.getElementById("idAlterar").value;
        const novoTitulo = document.getElementById("novoTitulo").value;
        const novaUrl = document.getElementById("novaUrl").value;

        let fotos = JSON.parse(localStorage.getItem("fotos")) || [];
        const foto = fotos.find(f => f.id == idAlterar);

        if (foto) {
            if (novoTitulo) foto.title = novoTitulo;
            if (novaUrl) foto.thumbnailUrl = novaUrl;

            localStorage.setItem("fotos", JSON.stringify(fotos));
            alert("Foto alterada com sucesso!");
            
            // Limpar os campos após a alteração
            document.getElementById("idAlterar").value = "";
            document.getElementById("novoTitulo").value = "";
            document.getElementById("novaUrl").value = "";
            
            // Redirecionar para a lista para mostrar as alterações
            listarFotos();
            mostrarSecao("listar");
        } else {
            alert("Foto não encontrada no armazenamento local.");
        }
    });
});