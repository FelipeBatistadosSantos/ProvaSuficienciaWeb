import AppController from './controllers/appController.js';

document.addEventListener("DOMContentLoaded", () => {
    const appController = new AppController();
});

document.addEventListener("DOMContentLoaded", () => {
    const contentSections = document.querySelectorAll("main section");
    const btnInserir = document.getElementById("btnInserir");
    const btnListar = document.getElementById("btnListar");
    const btnAlterar = document.getElementById("btnAlterar");
    const btnExcluir = document.getElementById("btnExcluir");
    const tabelaFotos = document.getElementById("tabelaFotos");
    const formInserir = document.getElementById("formInserir");
    const formAlterar = document.getElementById("formAlterar");
    const paginationContainer = document.getElementById("pagination");
    
    const confirmacaoModal = new bootstrap.Modal(document.getElementById('confirmacaoModal'));
    const btnExcluirConfirmado = document.getElementById('btnExcluirConfirmado');
    let fotoParaExcluir = null;

    const itensPorPagina = 5;
    let paginaAtual = 1;
    let todasFotosFiltradas = [];

    function mostrarSecao(secaoId) {
        contentSections.forEach(section => {
            section.classList.add("d-none");
        });
        document.getElementById(secaoId).classList.remove("d-none");
    }

    mostrarSecao("inserir");

    btnInserir.addEventListener("click", () => mostrarSecao("inserir"));
    btnListar.addEventListener("click", () => {
        paginaAtual = 1;
        listarFotos();
        mostrarSecao("listar");
    });
    btnAlterar.addEventListener("click", () => mostrarSecao("alterar"));
    btnExcluir.addEventListener("click", () => mostrarSecao("excluir"));

    function preencherFormularioAlteracao(id, title, url) {
        document.getElementById("idAlterar").value = id;
        document.getElementById("novoTitulo").value = title;
        document.getElementById("novaUrl").value = url;
        mostrarSecao("alterar");
    }

    function criarPaginacao(totalItems) {
        const totalPaginas = Math.ceil(totalItems / itensPorPagina);
        paginationContainer.innerHTML = '';

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

    function exibirItensPagina() {
        tabelaFotos.innerHTML = '';
        
        const inicio = (paginaAtual - 1) * itensPorPagina;
        const fim = Math.min(inicio + itensPorPagina, todasFotosFiltradas.length);
        
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

        document.querySelectorAll('.alterar-foto').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const title = this.getAttribute('data-title');
                const url = this.getAttribute('data-url');
                preencherFormularioAlteracao(id, title, url);
            });
        });

        document.querySelectorAll('.excluir-foto').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const source = this.getAttribute('data-source');
                
                fotoParaExcluir = { id, source };
                
                confirmacaoModal.show();
            });
        });
    }

    async function listarFotos() {
        try {
            const response = await fetch("https://jsonplaceholder.typicode.com/photos?_limit=10");
            const fotosAPI = await response.json();
            
            fotosAPI.forEach(foto => {
                foto.source = "api";
            });

            const fotosLocal = JSON.parse(localStorage.getItem("fotos")) || [];
            fotosLocal.forEach(foto => {
                foto.source = "local";
            });
            
            todasFotosFiltradas = [...fotosAPI, ...fotosLocal];
            
            criarPaginacao(todasFotosFiltradas.length);
            
            paginaAtual = 1;
            exibirItensPagina();
        } catch (error) {
            console.error("Erro ao buscar fotos:", error);
        }
    }

    btnExcluirConfirmado.addEventListener('click', function() {
        if (fotoParaExcluir) {
            excluirFoto(fotoParaExcluir.id, fotoParaExcluir.source);
            confirmacaoModal.hide();
            fotoParaExcluir = null;
        }
    });

    function excluirFoto(id, source) {
        if (source === "local") {
            let fotos = JSON.parse(localStorage.getItem("fotos")) || [];
            const index = fotos.findIndex(foto => foto.id == id);
            
            if (index !== -1) {
                fotos.splice(index, 1);
                localStorage.setItem("fotos", JSON.stringify(fotos));
                alert("Foto excluída com sucesso!");
                listarFotos();
            }
        } else if (source === "api") {
            let fotosExcluidas = JSON.parse(localStorage.getItem("fotosExcluidas")) || [];
            fotosExcluidas.push(parseInt(id));
            localStorage.setItem("fotosExcluidas", JSON.stringify(fotosExcluidas));
            alert("Foto da API escondida da lista!");
            listarFotos();
        }
    }

    formInserir.addEventListener("submit", (event) => {
        event.preventDefault();
        const titulo = document.getElementById("titulo").value;
        const url = document.getElementById("url").value;

        if (titulo && url) {
            const novasFotos = JSON.parse(localStorage.getItem("fotos")) || [];
            let novoId = 1000;
            if (novasFotos.length > 0) {
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
            
            listarFotos();
            mostrarSecao("listar");
        }
    });

    document.getElementById("btnConfirmarExclusao").addEventListener("click", () => {
        const idExcluir = document.getElementById("idExcluir").value;
        
        let fotos = JSON.parse(localStorage.getItem("fotos")) || [];
        const foto = fotos.find(foto => foto.id == idExcluir);
        
        if (foto) {
            fotoParaExcluir = { id: idExcluir, source: "local" };
            confirmacaoModal.show();
        } else {
            alert("Foto não encontrada no armazenamento local.");
        }
    });

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
            
            document.getElementById("idAlterar").value = "";
            document.getElementById("novoTitulo").value = "";
            document.getElementById("novaUrl").value = "";
            
            listarFotos();
            mostrarSecao("listar");
        } else {
            alert("Foto não encontrada no armazenamento local.");
        }
    });
});