    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
    import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";

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

    onAuthStateChanged(auth, (user) => {
        if (!user) window.location.href = '/login';
    });

document.getElementById('SairBotao').addEventListener('click', async () => {
    console.log('saindo...')
    await fetch('/logout')
    window.location.href = '/login.html'
})