class PhotoService {
    constructor() {
        this.API_LIMIT = 10;
    }
    
    async getAllPhotos() {
        // Obtem as informações das fotos da API e do localStorage	
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
    
    async createPhoto({ title, thumbnailUrl }) {
        try {
            // Faz o POST para a API
            const response = await fetch('https://jsonplaceholder.typicode.com/photos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, thumbnailUrl })
            });
            
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const newPhoto = await response.json();
            
            const fotosLocal = JSON.parse(localStorage.getItem("fotos")) || [];
            const novoId = fotosLocal.length ? Math.max(...fotosLocal.map(f => f.id)) + 1 : 1;
            
            const fotoLocal = {
                id: novoId,
                title,
                thumbnailUrl,
                source: "local"
            };
            
            fotosLocal.push(fotoLocal);
            localStorage.setItem("fotos", JSON.stringify(fotosLocal));
            
            return fotoLocal;
        } catch (error) {
            console.error("Erro ao criar foto:", error);
            throw error;
        }
    }
    
    async updatePhoto(id, { title, thumbnailUrl }) {
        // Faz o PUT para a API
        try {
            const response = await fetch(`https://jsonplaceholder.typicode.com/photos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, thumbnailUrl })
            });
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const updatedPhoto = await response.json();
            return updatedPhoto;
        } catch (error) {
            console.error("Erro ao atualizar foto:", error);
            throw error;
        }
    }
    
    async deletePhoto(id) {
        // Faz o DELETE para a API
        try {
            const response = await fetch(`https://jsonplaceholder.typicode.com/photos/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return true;
        } catch (error) {
            console.error("Erro ao deletar foto:", error);
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