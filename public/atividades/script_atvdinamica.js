window.document.getElementById('salvar-atv-dinamica').addEventListener('click', () => {
    let titulo = window.document.getElementById('titulo-atv-dinamica').value;
    let descricao = window.document.getElementById('descricao-atv-dinamica').value;
    let caminho = window.document.getElementById('caminho_atv-dinamica').value;
    let disciplina = window.document.getElementById('input-disciplina').value;

    fetch('/novaatvdinamica', {
        method: "POST",
        body: JSON.stringify({
            titulo: titulo,
            descricao: descricao,
            caminho: caminho,
            disciplina: disciplina
        }),
        headers: { "Content-type": "application/json; charset=UTF-8" }
    });

    window.document.getElementById('formulario_atv_dinamica').reset() 
});