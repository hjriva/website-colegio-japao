(function () {
    var STORAGE_KEY = 'colegio-japao-dark-mode';

    /*overlay de transição */
    var overlay = document.createElement('div');
    overlay.id = 'dark-mode-overlay';
    overlay.style.cssText = [
        'position:fixed',
        'inset:0',
        'z-index:99998',
        'pointer-events:none',
        'opacity:0',
        'background:#1e1e1e',
        'transition:opacity 0.5s ease'
    ].join(';');
    document.body.appendChild(overlay);

    var btn = document.getElementById('btn-dark-mode');

    function atualizarIcone(isDark) {
        if (!btn) return;
        var icon = btn.querySelector('i');
        if (!icon) return;
        if (isDark) {
            icon.className = 'fa-solid fa-moon';
            icon.style.color = '#1a1a1a';
            btn.setAttribute('title', 'Voltar ao modo claro');
        } else {
            icon.className = 'fa-regular fa-moon';
            icon.style.color = '#ffffff';
            btn.setAttribute('title', 'Ativar modo noturno');
        }
    }

    function aplicarModo(isDark, animate) {
        if (animate) {
            /* 1. escurece overlay */
            overlay.style.opacity = '1';
            setTimeout(function () {
                /* 2. troca o tema enquanto tela está coberta */
                if (isDark) {
                    document.documentElement.classList.add('dark-mode');
                } else {
                    document.documentElement.classList.remove('dark-mode');
                }
                atualizarIcone(isDark);
                /* 3. revela a tela já no novo tema */
                overlay.style.opacity = '0';
            }, 180);
        } else {
            if (isDark) {
                document.documentElement.classList.add('dark-mode');
            } else {
                document.documentElement.classList.remove('dark-mode');
            }
            atualizarIcone(isDark);
        }
    }

    var salvo = localStorage.getItem(STORAGE_KEY);
    var prefereSistema = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var isDark = salvo !== null ? salvo === '1' : prefereSistema;

    /* Na carga da página: sem animação (evita flash) */
    aplicarModo(isDark, false);

    if (btn) {
        btn.addEventListener('click', function () {
            isDark = !isDark;
            aplicarModo(isDark, true); /* ao clicar: com animação */
            localStorage.setItem(STORAGE_KEY, isDark ? '1' : '0');
        });
    }
})();