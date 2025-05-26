// Código principal del portafolio: proyectos, animaciones, tema y fondo interactivo

// 1. Cargar proyectos desde GitHub
document.addEventListener('DOMContentLoaded', () => {
  const proyectosLista = document.querySelector('.proyectos-lista');
  if (!proyectosLista) return;

  fetch('https://api.github.com/users/Shadowfiend2504/repos?sort=updated&per_page=6')
    .then(res => res.json())
    .then(repos => {
      const filtrados = repos.filter(repo => repo.name !== "Shadowfiend2504");
      proyectosLista.innerHTML = '';
      filtrados.forEach(repo => {
        const socialPreview = `https://opengraph.githubassets.com/main/${repo.owner.login}/${repo.name}`;
        const div = document.createElement('div');
        div.className = 'proyecto';
        div.innerHTML = `
          <img src="${socialPreview}" alt="Vista previa de ${repo.name}" style="width:100%;border-radius:0.7em;margin-bottom:0.7em;object-fit:cover;aspect-ratio:2.5/1;"/>
          <h3>${repo.name}</h3>
          <p>${repo.description || 'Sin descripción.'}</p>
        `;
        proyectosLista.appendChild(div);
      });
    })
    .catch(() => {
      proyectosLista.innerHTML = '<p>No se pudieron cargar los proyectos.</p>';
    });
});

// 2. Fade-in para secciones al hacer scroll
document.addEventListener('DOMContentLoaded', () => {
  const secciones = document.querySelectorAll('section');
  function mostrarSeccion() {
    secciones.forEach(sec => {
      const rect = sec.getBoundingClientRect();
      if (rect.top < window.innerHeight - 80) {
        sec.classList.add('visible');
      }
    });
  }
  window.addEventListener('scroll', mostrarSeccion);
  mostrarSeccion();
});

// 3. Modo claro/oscuro accesible
document.addEventListener('DOMContentLoaded', () => {
  const themeBtn = document.getElementById('toggle-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem('theme');

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    if (themeBtn) themeBtn.checked = theme === 'dark';
  }

  setTheme(savedTheme || (prefersDark ? 'dark' : 'light'));

  if (themeBtn) {
    themeBtn.addEventListener('change', () => {
      setTheme(themeBtn.checked ? 'dark' : 'light');
    });
  }
});

// 4. Fondo hexagonal interactivo
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('hex-bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width = window.innerWidth;
  let height = window.innerHeight;
  let hexRadius = Math.max(16, Math.min(width, height) / 36);
  let hexHeight = Math.sqrt(3) * hexRadius;
  let hexagons = [];
  let hoveredHex = null;
  let animationFrame;

  // Colores según tema
  function getThemeColors() {
    const theme = document.documentElement.getAttribute('data-theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    return theme === 'dark'
      ? { base: '#23202a', border: '#2d2540', glow: '#b388ff' }
      : { base: '#e9ddff', border: '#b39ddb', glow: '#8e24aa' };
  }

  // Ajusta tamaño y genera hexágonos
  function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    hexRadius = Math.max(16, Math.min(width, height) / 36);
    hexHeight = Math.sqrt(3) * hexRadius;
    generateHexagons();
    drawHexagons();
  }

  // Genera la grilla de hexágonos
  function generateHexagons() {
    hexagons = [];
    const cols = Math.ceil(width / (hexRadius * 1.5)) + 2;
    const rows = Math.ceil(height / hexHeight) + 2;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * hexRadius * 1.5;
        const y = row * hexHeight + (col % 2 ? hexHeight / 2 : 0);
        hexagons.push({ x, y, lit: 0 });
      }
    }
  }

  // Dibuja un hexágono individual
  function drawHexagon(x, y, radius, fill, border, lit, theme) {
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI / 3 * i - Math.PI / 6;
      ctx.lineTo(x + radius * Math.cos(angle), y + radius * Math.sin(angle));
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.globalAlpha = lit > 0 ? 0.85 * lit : (theme === 'dark' ? 0.18 : 0.00);
    ctx.fill();
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = border;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    if (lit > 0.05) {
      ctx.globalAlpha = 0.5 * lit;
      ctx.shadowColor = fill;
      ctx.shadowBlur = 18 * lit;
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }

  // Dibuja todos los hexágonos
  function drawHexagons() {
    ctx.clearRect(0, 0, width, height);
    const { base, border, glow } = getThemeColors();
    const theme = document.documentElement.getAttribute('data-theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    for (const hex of hexagons) {
      drawHexagon(
        hex.x,
        hex.y,
        hexRadius - 2,
        hex.lit > 0.05 ? glow : base,
        border,
        hex.lit,
        theme // <-- Pasa el tema aquí
      );
    }
  }

  // Obtiene el hexágono más cercano al mouse
  function getHexAt(mx, my) {
    let minDist = Infinity, closest = null;
    for (const hex of hexagons) {
      const dx = mx - hex.x;
      const dy = my - hex.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < hexRadius * 0.95 && dist < minDist) {
        minDist = dist;
        closest = hex;
      }
    }
    return closest;
  }

  // Animación de encendido y apagado
  function animate() {
    let needsRedraw = false;
    for (const hex of hexagons) {
      if (hex === hoveredHex) {
        if (hex.lit < 1) {
          hex.lit += 0.18;
          if (hex.lit > 1) hex.lit = 1;
          needsRedraw = true;
        }
      } else {
        if (hex.lit > 0) {
          hex.lit -= 0.08;
          if (hex.lit < 0) hex.lit = 0;
          needsRedraw = true;
        }
      }
    }
    if (needsRedraw) drawHexagons();
    animationFrame = requestAnimationFrame(animate);
  }

  // Eventos de interacción
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    hoveredHex = getHexAt(mx, my);
  });

  canvas.addEventListener('mouseleave', () => {
    hoveredHex = null;
  });

  window.addEventListener('resize', resizeCanvas);

  // Redibuja al cambiar el tema
  const observer = new MutationObserver(drawHexagons);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // Inicializa
  resizeCanvas();
  cancelAnimationFrame(animationFrame);
  animate();
});