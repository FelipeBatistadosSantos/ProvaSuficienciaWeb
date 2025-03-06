import photoService from '../services/photoService.js';

class AppController {
  constructor() {
    this.initializeElements();
    this.confirmacaoModal = new bootstrap.Modal(document.getElementById('confirmacaoModal'));
    this.btnExcluirConfirmado = document.getElementById('btnExcluirConfirmado');
    
    this.state = {
      fotoParaExcluir: null,
      itensPorPagina: 5,
      paginaAtual: 1,
      todasFotosFiltradas: []
    };
    
    this.inicializarEventos();
    this.mostrarSecao("inserir");
    this.listarFotos();
  }

  initializeElements() {
    const elements = {
      contentSections: document.querySelectorAll("main section"),
      btnInserir: document.getElementById("btnInserir"),
      btnListar: document.getElementById("btnListar"),
      btnAlterar: document.getElementById("btnAlterar"),
      btnExcluir: document.getElementById("btnExcluir"),
      tabelaFotos: document.getElementById("tabelaFotos"),
      formInserir: document.getElementById("formInserir"),
      formAlterar: document.getElementById("formAlterar"),
      paginationContainer: document.getElementById("pagination"),
      btnLixeira: document.getElementById("btnLixeira"),
      tabelaLixeira: document.getElementById("tabelaLixeira"),
    };

    Object.assign(this, elements);
  }

  inicializarEventos() {
    this.btnInserir?.addEventListener("click", () => this.mostrarSecao("inserir"));
    this.btnListar?.addEventListener("click", () => {
      this.state.paginaAtual = 1;
      this.listarFotos();
      this.mostrarSecao("listar");
    });
    this.btnAlterar?.addEventListener("click", () => this.mostrarSecao("alterar"));
    this.btnExcluir?.addEventListener("click", () => this.mostrarSecao("excluir"));
    this.btnExcluirConfirmado?.addEventListener('click', () => {
      if (this.state.fotoParaExcluir) {
        this.excluirFoto(this.state.fotoParaExcluir.id, this.state.fotoParaExcluir.source);
        this.confirmacaoModal.hide();
        this.state.fotoParaExcluir = null;
      }
    });
    this.formInserir?.addEventListener("submit", (e) => this.handleFormInserir(e));
    document.getElementById("btnConfirmarExclusao")?.addEventListener("click", () => this.prepararExclusao());
    document.getElementById("btnConfirmarAlteracao")?.addEventListener("click", () => this.alterarFoto());
    this.btnLixeira?.addEventListener("click", () => {
      this.mostrarLixeira();
      this.mostrarSecao("lixeira");
    });
  }

  mostrarSecao(secaoId) {
    this.contentSections.forEach(section => section.classList.add("d-none"));
    document.getElementById(secaoId)?.classList.remove("d-none");
  }

  async listarFotos() {
    try {
      this.state.todasFotosFiltradas = await photoService.getAllPhotos();
      this.criarPaginacao(this.state.todasFotosFiltradas.length);
      this.state.paginaAtual = 1;
      this.exibirItensPagina();
    } catch (error) {
      console.error("Erro ao listar fotos:", error);
      alert("Erro ao carregar fotos. Verifique o console para mais detalhes.");
    }
  }

  criarPaginacao(totalItems) {
    const totalPaginas = Math.ceil(totalItems / this.state.itensPorPagina);
    this.paginationContainer.innerHTML = '';

    const createPageItem = (text, isActive, onClick) => {
      const li = document.createElement('li');
      li.className = `page-item ${isActive ? 'active' : ''}`;
      li.innerHTML = `<a class="page-link">${text}</a>`;
      li.addEventListener('click', onClick);
      return li;
    };

    this.paginationContainer.appendChild(
      createPageItem('&laquo;', this.state.paginaAtual === 1, 
        () => this.state.paginaAtual > 1 && (this.state.paginaAtual--, this.exibirItensPagina()))
    );

    for (let i = 1; i <= totalPaginas; i++) {
      this.paginationContainer.appendChild(
        createPageItem(i, i === this.state.paginaAtual,
          () => (this.state.paginaAtual = i, this.exibirItensPagina()))
      );
    }

    this.paginationContainer.appendChild(
      createPageItem('&raquo;', this.state.paginaAtual === totalPaginas,
        () => this.state.paginaAtual < totalPaginas && (this.state.paginaAtual++, this.exibirItensPagina()))
    );
  }

  exibirItensPagina() {
    const inicio = (this.state.paginaAtual - 1) * this.state.itensPorPagina;
    const fim = Math.min(inicio + this.state.itensPorPagina, this.state.todasFotosFiltradas.length);
    
    this.tabelaFotos.innerHTML = '';
    
    this.state.todasFotosFiltradas.slice(inicio, fim).forEach(foto => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${foto.id}</td>
        <td>${foto.title}</td>
        <td><img src="${foto.thumbnailUrl}" alt="${foto.title}" class="img-thumbnail"></td>
        <td>
          <button class="btn btn-sm btn-outline-primary alterar-foto me-2" 
            data-id="${foto.id}" data-title="${foto.title.replace(/"/g, '&quot;')}" 
            data-url="${foto.thumbnailUrl}" data-source="${foto.source}">
            <i class="bi bi-pencil-square"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger excluir-foto" 
            data-id="${foto.id}" data-source="${foto.source}">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      `;

      row.addEventListener('click', (e) => {
        if (!e.target.closest('.btn')) {
          this.mostrarPreviewModal(foto);
        }
      });

      this.tabelaFotos.appendChild(row);
    });

    this.adicionarEventosBotoes();
  }

  mostrarPreviewModal(foto) {
    const modal = new bootstrap.Modal(document.getElementById('imagePreviewModal'));
    document.getElementById('previewImage').src = foto.thumbnailUrl;
    document.getElementById('previewId').textContent = foto.id;
    document.getElementById('previewTitle').textContent = foto.title;
    const urlElement = document.getElementById('previewUrl');
    urlElement.href = foto.thumbnailUrl;
    urlElement.textContent = foto.thumbnailUrl;
    modal.show();
  }

  adicionarEventosBotoes() {
    document.querySelectorAll('.alterar-foto').forEach(btn => {
      btn.addEventListener('click', () => {
        const { id, title, url, source } = btn.dataset;
        this.preencherFormularioAlteracao(id, title, url, source);
      });
    });

    document.querySelectorAll('.excluir-foto').forEach(btn => {
      btn.addEventListener('click', () => {
        this.state.fotoParaExcluir = {
          id: btn.dataset.id,
          source: btn.dataset.source
        };
        this.confirmacaoModal.show();
      });
    });
  }

  preencherFormularioAlteracao(id, title, url, source) {
    document.getElementById("idAlterar").value = id;
    document.getElementById("novoTitulo").value = title;
    document.getElementById("novaUrl").value = url;
    
    let sourceInput = document.getElementById("sourceAlterar");
    if (!sourceInput) {
      sourceInput = document.createElement("input");
      sourceInput.type = "hidden";
      sourceInput.id = "sourceAlterar";
      this.formAlterar.appendChild(sourceInput);
    }
    sourceInput.value = source;
    
    this.mostrarSecao("alterar");
  }

  async handleFormInserir(event) {
    event.preventDefault();
    const titulo = document.getElementById("titulo").value;
    const url = document.getElementById("url").value;

    if (titulo && url) {
      try {
        const novaFoto = await photoService.createPhoto({ title: titulo, thumbnailUrl: url });
        alert("Foto adicionada com sucesso!");
        this.formInserir.reset();
        this.state.todasFotosFiltradas.push(novaFoto); // Adiciona a nova foto à lista
        this.listarFotos(); // Atualiza a listagem de fotos
        this.mostrarSecao("listar");
      } catch (error) {
        console.error("Erro ao adicionar foto:", error);
        alert("Erro ao adicionar foto. Verifique o console para mais detalhes.");
      }
    } else {
      alert("Por favor, preencha todos os campos.");
    }
  }

  prepararExclusao() {
    const idExcluir = document.getElementById("idExcluir").value;
    if (!idExcluir) {
      alert("Por favor, informe o ID da foto a ser excluída.");
      return;
    }

    photoService.getPhotoById(idExcluir)
      .then(foto => {
        if (foto) {
          this.state.fotoParaExcluir = { id: idExcluir, source: foto.source };
          this.confirmacaoModal.show();
        } else {
          alert("Foto não encontrada.");
        }
      })
      .catch(error => {
        console.error("Erro ao buscar foto:", error);
        alert("Erro ao verificar se a foto existe.");
      });
  }

  async excluirFoto(id, source) {
    try {
      if (source === "api") {
        await photoService.deletePhoto(id);
      } else {
        photoService.moveToTrash(id, source);
      }
      alert("Foto movida para a lixeira!");
      this.listarFotos();
    } catch (error) {
      console.error("Erro ao mover para lixeira:", error);
      alert("Erro ao mover para lixeira.");
    }
  }

  async alterarFoto() {
    const id = document.getElementById("idAlterar").value;
    if (!id) {
      alert("Por favor, informe o ID da foto a ser alterada.");
      return;
    }

    try {
      const foto = await photoService.getPhotoById(id);
      if (foto) {
        const novoTitulo = document.getElementById("novoTitulo").value;
        const novaUrl = document.getElementById("novaUrl").value;
        const fotoAtualizada = await photoService.updatePhoto(id, {
          title: novoTitulo || foto.title,
          thumbnailUrl: novaUrl || foto.thumbnailUrl
        });
        
        if (fotoAtualizada) {
          alert("Foto alterada com sucesso!");
          document.getElementById("idAlterar").value = "";
          document.getElementById("novoTitulo").value = "";
          document.getElementById("novaUrl").value = "";
          this.listarFotos();
          this.mostrarSecao("listar");
        }
      } else {
        alert("Foto não encontrada.");
      }
    } catch (error) {
      console.error("Erro ao buscar foto:", error);
      alert("Erro ao buscar foto.");
    }
  }

  mostrarLixeira() {
    const itensLixeira = photoService.getTrashItems();
    this.tabelaLixeira.innerHTML = '';

    itensLixeira.forEach(item => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${item.id}</td>
        <td>${item.title}</td>
        <td><img src="${item.thumbnailUrl}" alt="${item.title}" class="img-thumbnail"></td>
        <td>
          <button class="btn btn-sm btn-success restaurar-item" data-id="${item.id}">
            <i class="bi bi-arrow-counterclockwise"></i> Restaurar
          </button>
        </td>
      `;
      this.tabelaLixeira.appendChild(row);
    });

    document.querySelectorAll('.restaurar-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.closest('button').dataset.id;
        this.restaurarItem(id);
      });
    });
  }

  restaurarItem(id) {
    try {
      if (photoService.restoreFromTrash(id)) {
        alert("Item restaurado com sucesso!");
        this.mostrarLixeira();
        this.listarFotos();
      } else {
        alert("Erro ao restaurar item.");
      }
    } catch (error) {
      console.error("Erro ao restaurar item:", error);
      alert("Erro ao restaurar item.");
    }
  }
}

export default AppController;