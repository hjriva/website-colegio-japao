
function PreviaAgenda() {
fetch('/agenda/ultimo')
    .then(res => res.json())
    .then(data => {
        if (data.ultimo !== null) {
            console.log(data.ultimo.titulo)
        } else {
            // tratar ausência
        }
    })
    .catch(err => console.error(err));
}

