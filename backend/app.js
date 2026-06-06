require('dotenv').config()
const express = require('express')
const cookieParser = require('cookie-parser')  //somente para senha, periodo de teste
const multer = require('multer');
const path = require('path');


const app = express()
const port = process.env.PORT || 3000;

const auth = require('./auth');

app.use(cookieParser()) //somente para senha, periodo de teste
app.use(auth);


app.use(express.json()); //claude

const admin = require('firebase-admin');
const session = require('express-session');

const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_KEY, 'base64').toString('utf8')
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

app.use(session({
    secret: process.env.SESSION_SECRET || 'secreto',
    resave: false,
    saveUninitialized: false
}));

app.post('/sessao', async (req, res) => {
    try {
        await admin.auth().verifyIdToken(req.body.token);
        req.session.admin = true;
        res.json({ ok: true });
    } catch {
        res.status(401).json({ error: 'Token inválido' });
    }
});

function autenticado(req, res, next) {
    if (req.session.admin) return next();
    res.redirect('/login.html');
}

app.use('/admin', autenticado, express.static(path.join(__dirname, '..', 'public', 'admin')));

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login.html');
});

app.use(express.static(path.join(__dirname, '..', 'public')));

const db = require('./connect_db'); // linha do código antigo


//mostrar eventos na pagina publica e no admin
app.get('/agenda', (req, res) => {

    let qry = `
    SELECT
    *,
    TO_CHAR(DataPost, 'DD') AS dia,
    TO_CHAR(DataPost, 'MM') AS mes,
    TO_CHAR(DataPost, 'YYYY') AS ano
    FROM agenda
    ORDER BY criado_em DESC;` //mostra os mais recente sprimeiro
    

    db.query(qry, (err, results) => {
        if (err) {
            console.error(err)  
            console.log('teste')
        return res.status(500).json({error: 'Erro ao buscar dados!'});
        }
        res.json(results.rows);
    })
  
    
})


//mostrar com filtros
// Página pública — eventos de hoje
app.get('/agenda/hoje', (req, res) => {
    const hoje = new Date().toISOString().split('T')[0];

    const qry = `
        SELECT *,
        TO_CHAR(DataPost, 'DD') AS dia,
        TO_CHAR(DataPost, 'MM') AS mes,
        TO_CHAR(DataPost, 'YYYY') AS ano
        FROM agenda
        WHERE datapost = $1
        ORDER BY horario ASC
    `;

    db.query(qry, [hoje], (err, results) => {
        if (err) return res.status(500).json({ error: 'Erro ao buscar dados!' });
        res.json(results.rows);
    });
});

// Página pública — próximos eventos (excluindo hoje)
app.get('/agenda/proximos', (req, res) => {
    const { pagina = 1 } = req.query;
    const limite = 10;
    const offset = (pagina - 1) * limite;
    const hoje = new Date().toISOString().split('T')[0];

    const qry = `
        SELECT *,
        TO_CHAR(DataPost, 'DD') AS dia,
        TO_CHAR(DataPost, 'MM') AS mes,
        TO_CHAR(DataPost, 'YYYY') AS ano,
        COUNT(*) OVER() AS total
        FROM agenda
        WHERE datapost > $1
        ORDER BY datapost ASC
        LIMIT $2 OFFSET $3
    `;

    db.query(qry, [hoje, limite, offset], (err, results) => {
        if (err) return res.status(500).json({ error: 'Erro ao buscar dados!' });
        const total = results.rows[0]?.total || 0;
        res.json({ eventos: results.rows, total: parseInt(total), pagina: parseInt(pagina) });
    });
});

// Página pública — eventos por dia selecionado
app.get('/agenda/dia', (req, res) => {
    const { data } = req.query;

    const qry = `
        SELECT *,
        TO_CHAR(DataPost, 'DD') AS dia,
        TO_CHAR(DataPost, 'MM') AS mes,
        TO_CHAR(DataPost, 'YYYY') AS ano
        FROM agenda
        WHERE datapost = $1
        ORDER BY horario ASC
    `;

    db.query(qry, [data], (err, results) => {
        if (err) return res.status(500).json({ error: 'Erro ao buscar dados!' });
        res.json(results.rows);
    });
});

// Página interna — busca com paginação
app.get('/agenda/busca', (req, res) => {
    const { termo, data, pagina = 1 } = req.query;
    const limite = 10;
    const offset = (pagina - 1) * limite;

    let condicoes = [];
    let valores = [];

    if (termo) {
        valores.push(`%${termo}%`);
        condicoes.push(`(titulo ILIKE $${valores.length} OR descricao ILIKE $${valores.length})`);
    }

    if (data) {
        valores.push(data);
        condicoes.push(`datapost = $${valores.length}`);
    }

    const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';

    valores.push(limite, offset);

    const qry = `
        SELECT *,
        TO_CHAR(DataPost, 'DD') AS dia,
        TO_CHAR(DataPost, 'MM') AS mes,
        TO_CHAR(DataPost, 'YYYY') AS ano,
        COUNT(*) OVER() AS total
        FROM agenda ${where}
        ORDER BY datapost ASC
        LIMIT $${valores.length - 1} OFFSET $${valores.length}
    `;

    db.query(qry, valores, (err, results) => {
        if (err) return res.status(500).json({ error: 'Erro ao buscar dados!' });
        const total = results.rows[0]?.total || 0;
        res.json({ eventos: results.rows, total: parseInt(total), pagina: parseInt(pagina) });
    });
});

//Para criar novo evento
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null,  path.join(__dirname, '..', 'public', 'imgs')),
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

//Para editar item
const updateimg = multer({ storage });

app.post('/Alteracao_BD', updateimg.single('img'), (req, res) => {
    const { titulo, descricao, idEntrada, dataPost, horario } = req.body;
    const imgPath = req.file ? `/imgs/${req.file.filename}` : null;

    const campos = ['titulo = $1', 'descricao = $2', 'datapost = $3', 'horario = $4'];
    const valores = [titulo, descricao, dataPost, horario];

    if (imgPath) {
        campos.push(`img = $${valores.length + 1}`);
        valores.push(imgPath);
    }

    valores.push(idEntrada);

    const qry = `UPDATE agenda SET ${campos.join(', ')} WHERE idEntrada = $${valores.length}`;

    db.query(qry, valores, (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erro ao atualizar dados!' });
        }
        res.json({ img: imgPath });
    });
}); 

//Atividade de Geografia - regiões do Br

app.get("/regioes", async (req, res) => {
  try {
    const { rows: regioes } = await db.query("SELECT * FROM regiao");
    const { rows: estados } = await db.query("SELECT * FROM estados");

    const resposta = regioes.map(regiao => ({
      ...regiao,
      estados: estados.filter(e => e.sigla_regiao === regiao.id_sigla)
    }));

    res.json(resposta);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar regiões" });
  }
});

//Fazedor de quizzes

// Listar disciplinas
app.get("/disciplinas", async (req, res) => {
  try {
    const { rows } = await db.query(`SELECT * FROM disciplinas`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao buscar disciplinas" });
  }
});




// Novas perguntas
app.post("/novasperguntas", async (req, res) => {
  const { idQuiz, enunciado, alt_a, alt_b, alt_c, alt_d, correto, explicacao } = req.body;

  if (!idQuiz || !enunciado) {
    return res.status(400).json({ erro: "Campos obrigatórios faltando", recebido: req.body });
  }

  try {
    await db.query(`
      INSERT INTO questoes (quiz_id, pergunta, alternativa_a, alternativa_b, alternativa_c, alternativa_d, resposta_correta, explicacao)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [idQuiz, enunciado, alt_a, alt_b, alt_c, alt_d, correto, explicacao]);

    res.json({ sucesso: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao salvar pergunta" });
  }
});

// Novo quiz
app.post("/novoquiz", async (req, res) => {
  const { disciplina, tituloQuiz, randomizar } = req.body;

  if (!disciplina || !tituloQuiz) {
    return res.status(400).json({
      erro: "Campos 'disciplina' e 'tituloQuiz' são obrigatórios.",
      recebido: { disciplina, tituloQuiz }
    });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Insere disciplina se não existir
    await client.query(`
      INSERT INTO disciplinas (nome_disc)
      VALUES ($1)
      ON CONFLICT (nome_disc) DO NOTHING
    `, [disciplina]);

    const { rows: discRows } = await client.query(
      `SELECT id FROM disciplinas WHERE nome_disc = $1`,
      [disciplina]
    );
    const idDisciplina = discRows[0].id;

    // Cria a atividade
    const { rows: atividadeRows } = await client.query(`
      INSERT INTO atividades (titulo, tipo, disciplina_id)
      VALUES ($1, 'quiz', $2)
      RETURNING id
    `, [tituloQuiz, idDisciplina]);
    const idAtividade = atividadeRows[0].id;

    // Cria o quiz vinculado à atividade
    const { rows: quizRows } = await client.query(`
      INSERT INTO quizzes (atividade_id, randomizar)
      VALUES ($1, $2)
      RETURNING id
    `, [idAtividade, randomizar ?? false]);
    const idQuiz = quizRows[0].id;

    await client.query('COMMIT');
    res.json({ sucesso: true, idQuiz, idAtividade, idDisciplina });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ erro: "Erro ao criar quiz" });
  } finally {
    client.release();
  }
});

// Backend
app.post('/novaatvdinamica', async (req, res) => {
    let { titulo, descricao, caminho, disciplina } = req.body;

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // Insere a disciplina se não existir
        await client.query(`
            INSERT INTO disciplinas (nome_disc)
            VALUES ($1)
            ON CONFLICT (nome_disc) DO NOTHING
        `, [disciplina]);

        // Insere a atividade buscando o id da disciplina
        await client.query(`
            INSERT INTO atividades (titulo, descricao, tipo, caminho, disciplina_id)
            VALUES ($1, $2, 'estatica', $3, (SELECT id FROM disciplinas WHERE nome_disc = $4))
        `, [titulo, descricao, caminho, disciplina]);

        await client.query('COMMIT');
        res.json({ sucesso: true });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ erro: "Erro ao salvar atividade" });
    } finally {
        client.release();
    }
});


// 2. Nova — lista atividades e quizzes de uma disciplina
app.get("/disciplina/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const { rows: disciplina } = await db.query(
            `SELECT * FROM disciplinas WHERE id = $1`, [id]
        );
        const { rows: atividades } = await db.query(`
            SELECT 
                a.id, a.titulo, a.tipo, a.caminho,
                q.id AS quiz_id
            FROM atividades a
            LEFT JOIN quizzes q ON q.atividade_id = a.id
            WHERE a.disciplina_id = $1
        `, [id]);

        res.json({ disciplina: disciplina[0], atividades });
    } catch (err) {
        res.status(500).json({ erro: "Erro ao buscar disciplina" });
    }
});

// 3. Já existe — adaptar para PostgreSQL e novo schema
app.get("/quiz/:id", async (req, res) => {
    const { id } = req.params;
    const pagina = parseInt(req.query.pagina) || 1;
    const porPagina = 10;
    const offset = (pagina - 1) * porPagina;

    try {
        const { rows: quizRows } = await db.query(`
            SELECT q.*, a.titulo, q.randomizar
            FROM quizzes q
            JOIN atividades a ON a.id = q.atividade_id
            WHERE q.id = $1
        `, [id]);
        const quiz = quizRows[0];

        const ordem = quiz.randomizar ? 'ORDER BY RANDOM()' : 'ORDER BY id';
        const { rows: questoes } = await db.query(`
            SELECT * FROM questoes WHERE quiz_id = $1 ${ordem} LIMIT $2 OFFSET $3
        `, [id, porPagina, offset]);

        const { rows: totalRows } = await db.query(
            `SELECT COUNT(*) as total FROM questoes WHERE quiz_id = $1`, [id]
        );
        const totalPaginas = Math.ceil(parseInt(totalRows[0].total) / porPagina);

        res.json({ quiz, questoes, totalPaginas, paginaAtual: pagina });
    } catch (err) {
        res.status(500).json({ erro: "Erro ao buscar quiz" });
    }
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
})
