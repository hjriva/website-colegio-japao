// Carrossel - só executa se os elementos existirem na página
const slides = document.querySelectorAll('.slide');
const prevBtn = document.querySelector('.prev-btn');
const nextBtn = document.querySelector('.next-btn');

if (prevBtn && nextBtn && slides.length > 0) {
    let currentIndex = 0;

    function updateCarousel() {
        slides.forEach((slide, index) => {
            slide.classList.remove('active', 'prev', 'next');
            if (index === currentIndex) {
                slide.classList.add('active');
            } else if (index === (currentIndex - 1 + slides.length) % slides.length) {
                slide.classList.add('prev');
            } else if (index === (currentIndex + 1) % slides.length) {
                slide.classList.add('next');
            }
        });
    }

    nextBtn.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % slides.length;
        updateCarousel();
    });

    prevBtn.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + slides.length) % slides.length;
        updateCarousel();
    });

    updateCarousel();

    const container = document.querySelector('.carrossel-container');
    let touchStartX = 0;

    container.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
        const diff = touchStartX - e.changedTouches[0].clientX;

        if (Math.abs(diff) < 30) return; // ignora toques acidentais

        if (diff > 0) {
            // deslizou para esquerda → próximo
            currentIndex = (currentIndex + 1) % slides.length;
        } else {
            // deslizou para direita → anterior
            currentIndex = (currentIndex - 1 + slides.length) % slides.length;
        }
        updateCarousel();
    }, { passive: true });
}

// Prévia da agenda - só executa se o elemento existir
const previaAgenda = document.getElementById('previa-agenda');

document.addEventListener('DOMContentLoaded', () => {
    fetch('/agenda/ultimo')
    .then(res => res.json())
    .then(data => {
        if (data.ultimo !== null) {
            previaAgenda.style.display = 'block';
            document.getElementById('previa-span').textContent = data.ultimo.titulo;
        } else {
            previaAgenda.style.display = 'none';
        }
    })
    .catch(err => console.error(err));
});

// btn-login - só executa se existir
const btnLogin = document.querySelector('.btn-login');
if (btnLogin) {
    btnLogin.addEventListener('click', () => {
        window.location.href = '/admin';
    });
}

// Formulário - só executa se existir
const form = document.getElementById('form');
const feedback = document.getElementById('feedback-form');

if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        try {
            const response = await fetch('https://api.staticforms.xyz/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accessKey: 'sf_661fa586483959058cd022c4',
                    ...Object.fromEntries(formData)
                })
            });
            const result = await response.json();
            if (result.success) {
                feedback.textContent = '✅ Mensagem enviada com sucesso!';
                feedback.style.display = 'block';
                form.reset();
            } else {
                feedback.textContent = '❌ Erro ao enviar. Tente novamente.';
                feedback.style.display = 'block';
            }
        } catch (err) {
            feedback.textContent = '❌ Erro de conexão.';
            feedback.style.display = 'block';
        }
    });
}

  // === MENU ===
const hamburger = document.getElementById('hamburger');
const nav = document.querySelector('nav');

const overlay = document.createElement('div');
overlay.classList.add('nav-overlay');
document.body.appendChild(overlay);
const darkModeBtn = window.document.getElementById('btn-dark-mode')

function toggleMenu() {
    nav.classList.toggle('mobile-open');
    overlay.classList.toggle('active');
}

hamburger.addEventListener('click', toggleMenu);
overlay.addEventListener('click', toggleMenu);

nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        nav.classList.remove('mobile-open');
        overlay.classList.remove('active');
    });
});

