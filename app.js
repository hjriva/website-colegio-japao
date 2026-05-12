require('dotenv').config()
const express = require('express')
const cookieParser = require('cookie-parser')  //somente para senha, periodo de teste
const multer = require('multer');
const path = require('path');


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
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/imgs/'),
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + path.extname(file.originalname));
    }
});

const upload = multer({ storage });


app.post('/updateBD', upload.single('imagem'), async (req, res) => {
    try {
    const { titulo, descricao, data, horario } = req.body;
    const caminho = req.file ? `/imgs/${req.file.filename}` : null;

    await db.query(
        'INSERT INTO agenda (descricao, IMG, Titulo, DataPost, Horario) VALUES ($1, $2, $3, $4, $5)',
        [descricao, caminho, titulo, data, horario]
    );

    res.json({ sucesso: true, caminho });
    }
    catch (err) {
        console.error(err); 
        res.status(500).json({ error: err.message });
    }
});

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
