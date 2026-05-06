// auth.js
module.exports = (req, res, next) => {
  const senha = req.query.senha || req.cookies?.senha;

  if (senha === process.env.SITE_PASSWORD) {
    res.cookie('senha', senha, { httpOnly: true }); // lembra a senha no cookie
    return next();
  }

  res.send(`
    <form method="GET">
      <input type="password" name="senha" placeholder="Digite a senha" />
      <button type="submit">Entrar</button>
    </form>
  `);
};

//claude
//somente para senha, periodo de teste