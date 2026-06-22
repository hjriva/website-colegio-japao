const slides = document.querySelectorAll('.slide');
const prevBtn = document.querySelector('.prev-btn');
const nextBtn = document.querySelector('.next-btn');

let currentIndex = 0;

let previaAgenda = window.document.getElementById('previa-agenda')

document.addEventListener('DOMContentLoaded', () => {
    fetch('/agenda/ultimo')
    .then(res => res.json())
    .then(data => {
        console.log(data)
        if (data.ultimo !== null) {
            previaAgenda.style.display = 'block'
            window.document.getElementById('previa-span').textContent = data.ultimo.titulo
        } else {
            previaAgenda.style.display = 'none'
        }
    })
    .catch(err => console.error(err));
});

function updateCarousel() {
    slides.forEach((slide, index) => {
        // limpa todas as classes de estado primeiro
        slide.classList.remove('active', 'prev', 'next');

        // calcula quem deve estar no centro, esquerda e direita
        if (index === currentIndex) {
            slide.classList.add('active'); // imagem do centro
        } else if (index === (currentIndex - 1 + slides.length) % slides.length) {
            slide.classList.add('prev'); // imagem da esquerda
        } else if (index === (currentIndex + 1) % slides.length) {
            slide.classList.add('next'); // imagem da direita
        }
    });
}

// quando clica na seta da direita
nextBtn.addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % slides.length;
    updateCarousel();
});

// quando clica na seta da esquerda
prevBtn.addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + slides.length) % slides.length;
    updateCarousel();
});

// inicia o carrossel organizando a primeira imagem
updateCarousel(); 


window.document.querySelector('.btn-login').addEventListener('click', () => {
    window.location.href = '/admin'
})

 const form = document.getElementById('form');
  const feedback = document.getElementById('feedback-form');

  form.addEventListener('submit', async (e) => {
    e.preventDefault(); // ← impede o redirecionamento

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