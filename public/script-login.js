import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
//import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } 
  from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBDIPOFL_gZrJ1OKKBJY8WHH4qzIFb_yaY",
    authDomain: "tcc-alt-login.firebaseapp.com",
    projectId: "tcc-alt-login",
    storageBucket: "tcc-alt-login.firebasestorage.app",
    messagingSenderId: "590509326654",
    appId: "1:590509326654:web:125337e99bb3da5424ac6f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.getElementById('btn-login').addEventListener('click', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    document.getElementById('erro').style.display = 'none'; 

    try {
        await signInWithEmailAndPassword(auth, email, senha);
        const token = await auth.currentUser.getIdToken();

        await fetch('/sessao', {
            method: 'POST',
            headers: { 'Content-type': 'application/json' },
            body: JSON.stringify({ token })
        });

        window.location.href = '/admin/index.html';
    } catch (err) {
        console.log('erro:', err.message);
        document.getElementById('erro').style.display = 'block';
    }
});

const modal = document.getElementById('modal-esqueci');

document.getElementById('btn-esqueci').addEventListener('click', () => {
    console.log('clicou em esqueci');
  modal.style.display = 'flex';
  
});

document.getElementById('btn-fechar-modal').addEventListener('click', () => {
  modal.style.display = 'none';
  document.getElementById('email-redefinir').value = '';
  document.getElementById('msg-sucesso').style.display = 'none';
  document.getElementById('msg-erro-modal').style.display = 'none';
});

document.getElementById('btn-enviar-reset').addEventListener('click', async () => {
  const emailReset = document.getElementById('email-redefinir').value.trim();

  document.getElementById('msg-sucesso').style.display = 'none';
  document.getElementById('msg-erro-modal').style.display = 'none';

  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailReset);
  if (!emailValido) {
    document.getElementById('msg-erro-modal').style.display = 'block';
    return;
  }

  try {
    await sendPasswordResetEmail(auth, emailReset);
  } catch (err) {
    // Silencioso — não revela se o e-mail existe ou não
  } finally {
    // Sempre mostra sucesso (segurança: não expõe quais e-mails estão cadastrados)
    document.getElementById('msg-sucesso').style.display = 'block';
  }
});

//Adaptado do Claude e da documentação do firebase