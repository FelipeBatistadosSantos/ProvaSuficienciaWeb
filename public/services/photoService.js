class PhotoService {
  constructor() {
      this.API_LIMIT = 10;
  }
  
  async getAllPhotos() {
      try {
          const fotosAPI = await (await fetch(`https://jsonplaceholder.typicode.com/photos?_limit=${this.API_LIMIT}`)).json();
          fotosAPI.forEach(foto => foto.source = "api");
          const fotosLocal = JSON.parse(localStorage.getItem("fotos")) || [];
          fotosLocal.forEach(foto => foto.source = "local");
          const fotosExcluidas = JSON.parse(localStorage.getItem("fotosExcluidas")) || [];
          return [...fotosAPI.filter(foto => !fotosExcluidas.includes(foto.id)), ...fotosLocal];
      } catch (error) {
          console.error("Erro ao buscar fotos:", error);
          throw error;
      }
  }
  
  async getPhotoById(id) {
      const fotosLocal = JSON.parse(localStorage.getItem("fotos")) || [];
      const fotoLocal = fotosLocal.find(f => f.id == id);
      if (fotoLocal) return { ...fotoLocal, source: "local" };
      try {
          const foto = await (await fetch(`https://jsonplaceholder.typicode.com/photos/${id}`)).json();
          const fotosExcluidas = JSON.parse(localStorage.getItem("fotosExcluidas")) || [];
          return fotosExcluidas.includes(parseInt(id)) ? null : { ...foto, source: "api" };
      } catch (error) {
          console.error("Erro ao buscar foto por ID:", error);
          return null;
      }
  }
  
  addPhoto({ title, thumbnailUrl }) {
      const fotos = JSON.parse(localStorage.getItem("fotos")) || [];
      const novoId = fotos.length ? Math.max(...fotos.map(f => f.id)) + 1 : 11;
      const novaFoto = { id: novoId, title, thumbnailUrl };
      localStorage.setItem("fotos", JSON.stringify([...fotos, novaFoto]));
      return novaFoto;
  }
  
  updatePhoto(id, { title, thumbnailUrl, source }) {
      if (source === "api") {
          const alteracoes = JSON.parse(localStorage.getItem("alteracoesAPI")) || {};
          alteracoes[id] = { title, thumbnailUrl };
          localStorage.setItem("alteracoesAPI", JSON.stringify(alteracoes));
          return true;
      }
      const fotos = JSON.parse(localStorage.getItem("fotos")) || [];
      const index = fotos.findIndex(f => f.id == id);
      if (index === -1) return null;
      fotos[index] = { ...fotos[index], ...(title && { title }), ...(thumbnailUrl && { thumbnailUrl }) };
      localStorage.setItem("fotos", JSON.stringify(fotos));
      return fotos[index];
  }
  
  deletePhoto(id, source) {
      try {
          if (source === "local") {
              let fotos = JSON.parse(localStorage.getItem("fotos")) || [];
              const index = fotos.findIndex(foto => foto.id == id);
              
              if (index !== -1) {
                  fotos.splice(index, 1);
                  localStorage.setItem("fotos", JSON.stringify(fotos));
                  return true;
              }
              
              return false;
          } else if (source === "api") {
              let fotosExcluidas = JSON.parse(localStorage.getItem("fotosExcluidas")) || [];
              fotosExcluidas.push(parseInt(id));
              localStorage.setItem("fotosExcluidas", JSON.stringify(fotosExcluidas));
              return true;
          }
          
          return false;
      } catch (error) {
          console.error("Erro ao excluir foto:", error);
          throw error;
      }
  }

  moveToTrash(id, source) {
      if (source === "api") {
          const excluidas = JSON.parse(localStorage.getItem("fotosExcluidas")) || [];
          localStorage.setItem("fotosExcluidas", JSON.stringify([...excluidas, parseInt(id)]));
          return true;
      }
      const fotos = JSON.parse(localStorage.getItem("fotos")) || [];
      const lixeira = JSON.parse(localStorage.getItem("lixeira")) || [];
      const index = fotos.findIndex(f => f.id == id);
      if (index === -1) return false;
      const [foto] = fotos.splice(index, 1);
      localStorage.setItem("fotos", JSON.stringify(fotos));
      localStorage.setItem("lixeira", JSON.stringify([...lixeira, { ...foto, deletedAt: new Date().toISOString() }]));
      return true;
  }

  restoreFromTrash(id) {
      const lixeira = JSON.parse(localStorage.getItem("lixeira")) || [];
      const index = lixeira.findIndex(item => item.id == id);
      if (index === -1) return false;
      const [item] = lixeira.splice(index, 1);
      delete item.deletedAt;
      const fotos = JSON.parse(localStorage.getItem("fotos")) || [];
      localStorage.setItem("fotos", JSON.stringify([...fotos, item]));
      localStorage.setItem("lixeira", JSON.stringify(lixeira));
      return true;
  }

  getTrashItems() {
      return JSON.parse(localStorage.getItem("lixeira")) || [];
  }
}

export default new PhotoService();