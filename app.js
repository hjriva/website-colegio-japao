require('dotenv').config()
const express = require('express')
const cookieParser = require('cookie-parser')  //somente para senha, periodo de teste

const app = express()
const port = 3000

const auth = require('./auth');

app.use(cookieParser()) //somente para senha, periodo de teste
app.use(auth);

app.use(express.static('public'))
app.use(express.json()); //claude
const db = require('./connect_db'); // linha do código antigo


//Para mostrar os dados da tabela no painel
app.get('/agenda', (req, res) => {

    let qry = `
    SELECT
    *,
    TO_CHAR(DataPost, 'DD') AS dia,
    TO_CHAR(DataPost, 'MM') AS mes,
    TO_CHAR(DataPost, 'YYYY') AS ano
    FROM agenda;`
    

    db.query(qry, (err, results) => {
        if (err) {
            console.error(err)
            console.log('teste')
        return res.status(500).json({error: 'Erro ao buscar dados!'});
        }
        res.json(results.rows);
    })
  
    
})

//Para criar novo evento
app.post('/updateBD', (req, res) => {

    let nome = req.body.nome;
    console.log('e:' + nome)

    let qry =  `INSERT INTO agenda (descricao, IMG, Titulo, DataPost, Horario) VALUES ('${nome}', 'foto.png', 'Reuniao', '2026-04-26', '14:30:00');`
    db.query(qry, (err, results) => {
        if (err) {
            console.error(err)
        return res.status(500).json({error: 'Erro ao buscar dados!'});
        }
    res.json(results)
    })

})

//Para deletar algum evento
app.post('/deletar', (req, res) => {
    let qry = `DELETE FROM agenda WHERE idEntrada = ${req.body.idEntrada};`
    db.query(qry, (err, results) => {
        if (err) {
            console.log(err)
            return res.status(500).json({error: 'Erro ao buscar dados!'});
        }
        res.json(results)
    }) 
})

//Para editar título
app.post('/Alteracao_BD', (req, res) => {
    console.log(req.body)
    let qry = `UPDATE agenda SET Titulo = '${req.body.nome}', descricao = '${req.body.descricao}' WHERE idEntrada = ${req.body.idEntrada};`
    db.query(qry, (err, results) => {
         if (err) {
            console.log(err)
            return res.status(500).json({error: 'Erro ao buscar dados!'});
        }
        res.json(results)
    })
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
})
