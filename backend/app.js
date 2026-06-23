require('dotenv').config()
const express = require('express')
const cookieParser = require('cookie-parser')  //somente para senha, periodo de teste
const multer = require('multer');
const path = require('path');


const app = express()
const port = process.env.PORT || 3000;

app.use(cookieParser()) //somente para senha, periodo de teste


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
        const { titulo, descricao, data, horario, destaque } = req.body;
        const caminho = req.file ? `/imgs/${req.file.filename}` : null;
        const destaqueVal = destaque === 'true' || destaque === true;

        await db.query(
            'INSERT INTO agenda (descricao, img, titulo, datapost, horario, destaque) VALUES ($1, $2, $3, $4, $5, $6)',
            [descricao, caminho, titulo, data, horario, destaqueVal]
        );

        res.json({ sucesso: true, caminho });
    } catch (err) {
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

app.get('/agenda/destaque', async (req, res) => {
    try {
        const resultado = await db.query(
            'SELECT * FROM agenda WHERE destaque = TRUE LIMIT 1'
        );

        if (resultado.rows.length === 0) {
            return res.json({ destaque: null });
        }

        res.json({ destaque: resultado.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/agenda/ultimo', async (req, res) => {
    try {
        const resultado = await db.query(
            'SELECT * FROM agenda ORDER BY identrada DESC LIMIT 1'
        );

        res.json({ ultimo: resultado.rows[0] || null });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

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
      estados: estados.filter(
    e => e.sigla_regiao?.trim() === regiao.id_sigla?.trim()
)
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
    const { rows } = await db.query(`SELECT * FROM disciplinas ORDER BY id`);
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
    const { rows: discRows } = await client.query(`
    INSERT INTO disciplinas (nome_disc)
    VALUES ($1)
    ON CONFLICT (nome_disc) DO UPDATE SET nome_disc = EXCLUDED.nome_disc
    RETURNING id
`, [disciplina]);
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
        atividades.*,
        quizzes.id AS quiz_id,
        disciplinas.imagem AS imagem_disciplina
    FROM atividades
    LEFT JOIN quizzes ON quizzes.atividade_id = atividades.id
    LEFT JOIN disciplinas ON atividades.disciplina_id = disciplinas.id
    WHERE atividades.disciplina_id = $1
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
        res.json({ quiz, questoes, totalPaginas, totalQuestoes: parseInt(totalRows[0].total), paginaAtual: pagina });
    } catch (err) {
        res.status(500).json({ erro: "Erro ao buscar quiz" });
    }
});


//Claude

app.post("/atualizarDisciplina", async (req, res) => {
  const { id, nome_disc } = req.body;

  if (!id || !nome_disc) {
    return res.status(400).json({ erro: "Dados incompletos" });
  }

  try {
    await db.query(
      `UPDATE disciplinas SET nome_disc = $1 WHERE id = $2`,
      [nome_disc, id]
    );
    res.json({ sucesso: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao atualizar disciplina" });
  }
});

// Atualiza o título do quiz (que vive na tabela atividades)
app.post("/atualizarTituloQuiz", async (req, res) => {
    const { idAtividade, titulo } = req.body;

    if (!idAtividade || !titulo) {
        return res.status(400).json({ erro: "Dados incompletos" });
    }

    try {
        await db.query(
            `UPDATE atividades SET titulo = $1 WHERE id = $2`,
            [titulo, idAtividade]
        );
        res.json({ sucesso: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao atualizar título" });
    }
});

// Atualiza uma pergunta
app.post("/atualizarPergunta", async (req, res) => {
    const { id, pergunta, alt_a, alt_b, alt_c, alt_d, correto, explicacao } = req.body;

    if (!id || !pergunta) {
        return res.status(400).json({ erro: "Dados incompletos" });
    }

    try {
        await db.query(`
            UPDATE questoes SET
                pergunta = $1,
                alternativa_a = $2,
                alternativa_b = $3,
                alternativa_c = $4,
                alternativa_d = $5,
                resposta_correta = $6,
                explicacao = $7
            WHERE id = $8
        `, [pergunta, alt_a, alt_b, alt_c, alt_d, correto, explicacao, id]);

        res.json({ sucesso: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao atualizar pergunta" });
    }
});

app.post("/deletarPergunta", async (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ erro: "Dados incompletos" });
    }

    try {
        await db.query(`DELETE FROM questoes WHERE id = $1`, [id]);
        res.json({ sucesso: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao excluir pergunta" });
    }
});

// Lista disciplinas para o select (excluindo a que será deletada)
app.get('/disciplinas/exceto/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await db.query(
            `SELECT id, nome_disc, imagem FROM disciplinas WHERE id != $1 ORDER BY nome_disc`,
            [id]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: 'Erro ao buscar disciplinas' });
    }
});
app.post("/novaPerguntaQuiz", async (req, res) => {

  const {
    quiz_id,
    pergunta,
    alt_a,
    alt_b,
    alt_c,
    alt_d,
    correto,
    explicacao
  } = req.body;

  if (!quiz_id || !pergunta) {
    return res.status(400).json({
      erro: "Dados incompletos"
    });
  }

  try {

    const { rows } = await db.query(
      `
      INSERT INTO questoes
      (
        quiz_id,
        pergunta,
        alternativa_a,
        alternativa_b,
        alternativa_c,
        alternativa_d,
        resposta_correta,
        explicacao
      )
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING id
      `,
      [
        quiz_id,
        pergunta,
        alt_a,
        alt_b,
        alt_c,
        alt_d,
        correto,
        explicacao
      ]
    );

    res.json({
      sucesso: true,
      id: rows[0].id
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      erro: "Erro ao criar pergunta"
    });

  }
});

// Exclui a disciplina, com opção de migrar ou excluir as atividades vinculadas
app.post('/excluirDisciplina', async (req, res) => {
    const { id, acao, idDestino } = req.body;
    // acao: 'excluir' ou 'migrar'
    // idDestino: id da disciplina destino (só quando acao === 'migrar')

    if (!id || !acao) {
        return res.status(400).json({ erro: 'Dados incompletos' });
    }
    if (acao === 'migrar' && !idDestino) {
        return res.status(400).json({ erro: 'Disciplina destino não informada' });
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        if (acao === 'excluir') {
            // Busca atividades vinculadas
            const { rows: atividades } = await client.query(
                `SELECT id FROM atividades WHERE disciplina_id = $1`, [id]
            );

            for (const atv of atividades) {
                // Busca quiz vinculado à atividade (se houver)
                const { rows: quizzes } = await client.query(
                    `SELECT id FROM quizzes WHERE atividade_id = $1`, [atv.id]
                );
                for (const quiz of quizzes) {
                    // Exclui questões do quiz
                    await client.query(`DELETE FROM questoes WHERE quiz_id = $1`, [quiz.id]);
                }
                // Exclui quizzes da atividade
                await client.query(`DELETE FROM quizzes WHERE atividade_id = $1`, [atv.id]);
            }
            // Exclui atividades da disciplina
            await client.query(`DELETE FROM atividades WHERE disciplina_id = $1`, [id]);

        } else if (acao === 'migrar') {
            // Apenas redireciona as atividades para a disciplina destino
            await client.query(
                `UPDATE atividades SET disciplina_id = $1 WHERE disciplina_id = $2`,
                [idDestino, id]
            );
        }

        // Em ambos os casos, exclui a disciplina
        await client.query(`DELETE FROM disciplinas WHERE id = $1`, [id]);

        await client.query('COMMIT');
        res.json({ sucesso: true });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ erro: 'Erro ao excluir disciplina' });
    } finally {
        client.release();
    }
});

app.get("/atividadesdisplay", async (req, res) => {
    try {
        const { rows } = await db.query(`
SELECT 
        atividades.*,
        quizzes.id AS quiz_id,
        disciplinas.imagem AS imagem_disciplina
    FROM atividades
    LEFT JOIN quizzes ON quizzes.atividade_id = atividades.id
    LEFT JOIN disciplinas ON atividades.disciplina_id = disciplinas.id
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ erro: "Erro ao buscar atividades" });
    }
});

const uploadDisciplina = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'public', 'imgs')),
        filename: (req, file, cb) => {
            const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(null, 'disc-' + unique + path.extname(file.originalname));
        }
    })
});

app.post('/atualizarImagemDisciplina', uploadDisciplina.single('imagem'), async (req, res) => {
    const { id } = req.body;
    if (!id || !req.file) return res.status(400).json({ erro: 'Dados incompletos' });

    const caminho = `imgs/${req.file.filename}`;
    try {
        await db.query(`UPDATE disciplinas SET imagem = $1 WHERE id = $2`, [caminho, id]);
        res.json({ sucesso: true, imagem: caminho });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: 'Erro ao atualizar imagem' });
    }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
})
