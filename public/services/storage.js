export function getLocalFotos() {
    const fotos = JSON.parse(localStorage.getItem("fotos")) || [];
    fotos.forEach(foto => {
        foto.source = "local";
    });
    return fotos;
}

export function saveLocalFoto(titulo, url) {
    const novasFotos = getLocalFotos();
    

    let novoId = 1000;
    if (novasFotos.length > 0) {
        novoId = Math.max(...novasFotos.map(f => f.id)) + 1;
    }
    
    const novaFoto = {
        id: novoId,
        title: titulo,
        thumbnailUrl: url,
        source: "local"
    };

    novasFotos.push(novaFoto);
    localStorage.setItem("fotos", JSON.stringify(novasFotos));
    
    return novaFoto;
}

export function updateLocalFoto(id, novoTitulo, novaUrl) {
    let fotos = getLocalFotos();
    const foto = fotos.find(f => f.id == id);

    if (foto) {
        if (novoTitulo) foto.title = novoTitulo;
        if (novaUrl) foto.thumbnailUrl = novaUrl;

        localStorage.setItem("fotos", JSON.stringify(fotos));
        return true;
    }
    
    return false;
}

export function deleteLocalFoto(id) {
    let fotos = getLocalFotos();
    const index = fotos.findIndex(foto => foto.id == id);
    
    if (index !== -1) {
        fotos.splice(index, 1);
        localStorage.setItem("fotos", JSON.stringify(fotos));
        return true;
    }
    
    return false;
}