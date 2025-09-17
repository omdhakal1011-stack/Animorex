const BACKEND_URL = "https://animorex-auth-2.onrender.com";

// ---------- DOM ----------
const genreBtn = document.getElementById('genre-btn');
const genrePopup = document.getElementById('genre-popup');
const applyGenresBtn = document.getElementById('apply-genres');
const searchInput = document.getElementById('search');
const searchBtn = document.getElementById('search-btn');
const suggestionsList = document.getElementById('suggestions');
const backToTopBtn = document.getElementById('back-to-top');
const animeContainer = document.getElementById('anime-container');
const paginationBar = document.getElementById('pagination');
const trendLeft = document.getElementById('trend-left');
const trendRight = document.getElementById('trend-right');
const trendRow = document.querySelector('.scroll-row');
const favSlider = document.getElementById('favourite-slider');
const sortSelect = document.getElementById('sort-select');

// Auth modal elements
const authTrigger = document.getElementById('auth-trigger');
const authTriggerMobile = document.getElementById('auth-trigger-mobile');
const authModal = document.getElementById('auth-modal');
const closeAuth = document.getElementById('close-auth');
const loginTab = document.getElementById('login-tab');
const signupTab = document.getElementById('signup-tab');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const googleBtn = document.getElementById('google-login');
const discordBtn = document.getElementById('discord-login');

const genreMap = {}; // name -> ID

// ---------- Load Genres ----------
function loadGenres() {
  return fetch('https://api.jikan.moe/v4/genres/anime')
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById('genre-options');
      if (container) {
        container.innerHTML = '';
        data.data.forEach(genre => {
          genreMap[genre.name.toLowerCase()] = genre.mal_id;
          const label = document.createElement('label');
          label.innerHTML = `<input type="checkbox" value="${genre.name.toLowerCase()}" /> ${genre.name}`;
          container.appendChild(label);
        });
      }
    });
}

// ---------- Genre Popup ----------
if (genreBtn && genrePopup) {
  genreBtn.addEventListener('click', e => {
    e.stopPropagation();
    genrePopup.classList.toggle('hidden');
  });
  document.addEventListener('click', e => {
    if (!genrePopup.contains(e.target) && e.target !== genreBtn) genrePopup.classList.add('hidden');
  });
}

// ---------- Apply Genres ----------
if (applyGenresBtn) {
  applyGenresBtn.addEventListener('click', () => {
    const selected = Array.from(document.querySelectorAll('#genre-options input:checked')).map(cb => cb.value);
    if (selected.length > 0) window.location.href = `results.html?genres=${selected.join(',')}`;
  });
}

// ---------- Search ----------
function triggerSearch() {
  const query = (searchInput?.value || '').trim();
  if (query.length > 1) window.location.href = `results.html?q=${encodeURIComponent(query)}`;
}
if (searchBtn) searchBtn.addEventListener('click', triggerSearch);
if (searchInput) {
  searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') triggerSearch(); });
}

// ---------- Suggestions (debounced) ----------
let debounceTimer;
if (searchInput && suggestionsList) {
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const query = searchInput.value.trim();
    if (query.length < 2) { suggestionsList.innerHTML = ''; return; }
    debounceTimer = setTimeout(() => {
      fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=5`)
        .then(res => res.json())
        .then(data => {
          suggestionsList.innerHTML = '';
          data.data.forEach(anime => {
            const li = document.createElement('li');
            li.textContent = anime.title;
            li.addEventListener('click', () => window.location.href = `results.html?q=${encodeURIComponent(anime.title)}`);
            suggestionsList.appendChild(li);
          });
        });
    }, 300);
  });
}

// ---------- Back to Top ----------
if (backToTopBtn) {
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ---------- Trending ----------
if (trendLeft && trendRight && trendRow) {
  trendLeft.addEventListener('click', () => trendRow.scrollBy({ left: -300, behavior: 'smooth' }));
  trendRight.addEventListener('click', () => trendRow.scrollBy({ left: 300, behavior: 'smooth' }));
  fetch('https://api.jikan.moe/v4/top/anime')
    .then(res => res.json())
    .then(data => {
      data.data.slice(0, 15).forEach(anime => {
        const card = document.createElement('div');
        card.className = 'anime-card';
        card.innerHTML = `
          <img src="${anime.images.jpg.image_url}" class="anime-thumb" alt="${anime.title}" />
          <div class="anime-meta">
            <h4 class="anime-title">${anime.title}</h4>
            <p class="anime-sub">${anime.type || '—'} • ${anime.episodes ?? '—'} eps</p>
          </div>
        `;
        trendRow.appendChild(card);
      });
    });
}

// ---------- Favourite Slider ----------
if (favSlider && document.body.id === 'index-page') {
  fetch('https://api.jikan.moe/v4/top/anime?filter=favorite')
    .then(res => res.json())
    .then(({ data }) => {
      const favs = data.slice(0, 10);
      let idx = 0;
      const show = () => {
        const anime = favs[idx];
        favSlider.innerHTML = `
          <div class="anime-card">
            <img src="${anime.images.jpg.image_url}" class="anime-thumb" alt="${anime.title}" />
            <div class="anime-meta">
              <h4 class="anime-title">${anime.title}</h4>
              <p class="anime-sub">${anime.type || '—'} • ${anime.episodes ?? '—'} eps</p>
            </div>
          </div>
        `;
      };
      show();
      setInterval(() => {
        idx = (idx + 1) % favs.length;
        show();
      }, 3000);
    });
}
// ---------- Results Fetch ----------
function fetchResults(query, genres, page = 1) {
  let url = `https://api.jikan.moe/v4/anime?page=${page}`;

  if (query) url += `&q=${encodeURIComponent(query)}`;
  if (genres) {
    const genreList = genres.split(',').map(name => genreMap[name.trim().toLowerCase()]);
    const validIds = genreList.filter(Boolean);
    if (validIds.length > 0) url += `&genres=${validIds.join(',')}`;
  }

  const sortValue = sortSelect?.value;
  if (sortValue === 'score') url += '&order_by=score&sort=desc';
  else if (sortValue === 'popularity') url += '&order_by=members&sort=desc';
  else if (sortValue === 'year') url += '&order_by=start_date&sort=desc';
  else if (sortValue === 'recent') url += '&order_by=created_at&sort=desc';

  fetch(url)
    .then(res => res.json())
    .then(data => {
      if (!animeContainer) return;
      animeContainer.innerHTML = '';
      if (!data.data || data.data.length === 0) {
        animeContainer.innerHTML = '<p style="opacity:.8;text-align:center;">No results found.</p>';
      } else {
        data.data.forEach(anime => {
          const card = document.createElement('div');
          card.className = 'anime-card';
          card.innerHTML = `
            <img src="${anime.images.jpg.image_url}" class="anime-thumb" alt="${anime.title}" />
            <div class="anime-meta">
              <h4 class="anime-title">${anime.title}</h4>
              <p class="anime-sub">${anime.type || '—'} • ${anime.episodes ?? '—'} eps</p>
            </div>
          `;
          animeContainer.appendChild(card);
        });
      }
      renderPagination(data.pagination?.last_visible_page || 1, page);
    });
}

// ---------- Pagination ----------
function renderPagination(totalPages, currentPage) {
  if (!paginationBar) return;
  paginationBar.innerHTML = '';

  const createButton = (label, page, isActive = false) => {
    const btn = document.createElement('button');
    btn.textContent = label;
    if (isActive) btn.classList.add('active');
    btn.addEventListener('click', () => {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('q');
      const g = params.get('genres');
      fetchResults(q, g, page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    paginationBar.appendChild(btn);
  };

  const addDots = () => {
    const dots = document.createElement('span');
    dots.textContent = '...';
    dots.className = 'pagination-dots';
    paginationBar.appendChild(dots);
  };

  for (let i = 1; i <= Math.min(3, totalPages); i++) createButton(i, i, i === currentPage);
  if (totalPages > 5 && currentPage > 4) addDots();
  if (currentPage > 3 && currentPage < totalPages - 1) createButton(currentPage, currentPage, true);
  if (totalPages > 3) {
    if (currentPage < totalPages - 2) addDots();
    createButton(totalPages, totalPages, currentPage === totalPages);
  }
  if (currentPage < totalPages) createButton('Next', currentPage + 1);
}

// ---------- Sort change ----------
sortSelect?.addEventListener('change', () => {
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q');
  const g = params.get('genres');
  fetchResults(q, g);
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ---------- Auth Modal ----------
function openAuth() { authModal?.classList.remove('hidden'); }
function closeAuthModal() { authModal?.classList.add('hidden'); }
authTrigger?.addEventListener('click', openAuth);
authTriggerMobile?.addEventListener('click', openAuth);
closeAuth?.addEventListener('click', closeAuthModal);
authModal?.addEventListener('click', (e) => {
  if (e.target === authModal) closeAuthModal();
});

// Tabs
loginTab?.addEventListener('click', () => {
  loginTab.classList.add('active');
  signupTab.classList.remove('active');
  loginForm.classList.remove('hidden');
  signupForm.classList.add('hidden');
});
signupTab?.addEventListener('click', () => {
  signupTab.classList.add('active');
  loginTab.classList.remove('active');
  signupForm.classList.remove('hidden');
  loginForm.classList.add('hidden');
});

// OAuth buttons
googleBtn?.addEventListener('click', () => {
  window.location.href = `${BACKEND_URL}/api/auth/google/login`;
});
discordBtn?.addEventListener('click', () => {
  window.location.href = `${BACKEND_URL}/api/auth/discord/login`;
});

// Forms (UI validation only)
loginForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  alert('Login will be enabled after backend setup.');
});
signupForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const pwd = document.getElementById('signup-password').value.trim();
  const conf = document.getElementById('signup-confirm').value.trim();
  if (pwd.length < 6) return alert('Password must be at least 6 characters.');
  if (pwd !== conf) return alert('Passwords do not match.');
  alert('Sign up will be enabled after backend setup.');
});

// ---------- Bootstrap ----------
const params = new URLSearchParams(window.location.search);
const qParam = params.get('q');
const gParam = params.get('genres');
const sortParam = params.get('sort');

if (sortParam && sortSelect) {
  if (sortParam === 'trending') sortSelect.value = 'popularity';
}

if (document.body.id === 'results-page') {
  loadGenres().then(() => fetchResults(qParam, gParam));
} else {
  loadGenres();
}

