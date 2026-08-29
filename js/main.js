const App = {
  initCommon() {
    this.renderBreakingTicker();
    this.renderHeaderDate();
    this.initSearch();
    this.initMobileMenu();
    this.initNewsletter();
    this.renderAuthNav();
  },

  initHomepage() {
    this.initCommon();
    this.renderHero();
    this.renderCategoryTabs();
    this.renderNewsGrid("Semua");
    this.renderStoriesRow();
    this.renderCategorySections();
    this.renderMostRead();
  },

  initArticlePage() {
    this.initCommon();
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const slug = params.get("slug");
    const article = slug ? getArticleBySlug(slug) : getArticleById(id);

    if (!article) {
      document.title = "Artikel Tidak Ditemukan — Banyuwangi Asyik Berita";
      document.getElementById("article-content").innerHTML = `
        <div class="article-header text-center" style="padding:4rem 0;">
          <h1 class="article-header__title">Artikel Tidak Ditemukan</h1>
          <p class="article-header__excerpt">Maaf, artikel yang Anda cari tidak tersedia.</p>
          <a href="index.html" style="color:var(--color-primary);font-weight:600;">&larr; Kembali ke Beranda</a>
        </div>`;
      return;
    }

    // Update meta tags untuk SEO & social sharing
    document.title = `${article.title} — Banyuwangi Asyik Berita`;
    document.querySelector('meta[name="description"]').setAttribute("content", article.excerpt);
    document.querySelector('meta[property="og:title"]').setAttribute("content", article.title);
    document.querySelector('meta[property="og:description"]').setAttribute("content", article.excerpt);
    document.querySelector('meta[property="og:image"]').setAttribute("content", article.image);
    document.querySelector('meta[property="og:url"]').setAttribute("content", window.location.href);
    document.querySelector('meta[name="twitter:title"]').setAttribute("content", article.title);
    document.querySelector('meta[name="twitter:description"]').setAttribute("content", article.excerpt);
    document.querySelector('meta[name="twitter:image"]').setAttribute("content", article.image);
    document.querySelector('link[rel="canonical"]').setAttribute("href", window.location.href);

    document.getElementById("article-content").innerHTML = `
      <header class="article-header">
        <div class="article-header__category">${article.category}</div>
        <h1 class="article-header__title">${article.title}</h1>
        <p class="article-header__excerpt">${article.excerpt}</p>
        <div class="article-header__meta">
          <span class="article-header__author">Oleh ${article.author}</span>
          <span><time datetime="${article.date}">${formatDate(article.date)}</time></span>
          <span>${article.readTime} menit baca</span>
        </div>
      </header>
      <img class="article-hero-image" src="${article.image}" alt="${article.imageAlt}">
      <p class="article-hero-caption">${article.imageAlt}</p>
      ${article.video ? getVideoEmbedHtml(article.video, article.title) : ""}
      <div class="article-body">${article.content}</div>
      <div class="article-share">
        <span class="article-share__label">Bagikan</span>
        <button class="article-share__btn" onclick="App.shareArticle('facebook')">Facebook</button>
        <button class="article-share__btn" onclick="App.shareArticle('twitter')">X / Twitter</button>
        <button class="article-share__btn" onclick="App.shareArticle('whatsapp')">WhatsApp</button>
        <button class="article-share__btn" onclick="App.copyLink(this)">Salin Link</button>
      </div>`;

    this.renderRelatedArticles(article);
    this.trackArticleView(article.id);
  },

  // URL SEO-friendly menggunakan slug
  articleUrl(article) {
    return `article.html?slug=${article.slug}`;
  },

  renderBreakingTicker() {
    const breaking = getBreakingNews();
    const items = breaking.length ? breaking : getAllNews().slice(0, 3);
    const html = [...items, ...items].map(a => `
      <a href="${this.articleUrl(a)}" class="breaking-bar__item">${a.title}</a>
    `).join("");
    const el = document.getElementById("breaking-ticker");
    if (el) el.innerHTML = html;
  },

  renderHeaderDate() {
    const el = document.getElementById("header-date");
    if (el) {
      el.textContent = new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    }
  },

  renderAuthNav() {
    console.log("renderAuthNav called");
    const el = document.getElementById("auth-nav");
    console.log("auth-nav element:", el);
    
    if (!el) {
      console.error("auth-nav element not found!");
      return;
    }

    // Check if auth functions are available
    if (typeof isLoggedIn !== 'undefined' && typeof getCurrentUser !== 'undefined' && typeof logoutUser !== 'undefined') {
      if (isLoggedIn()) {
        const user = getCurrentUser();
        console.log("User logged in:", user);
        el.innerHTML = `
          <a href="dashboard.html" class="auth-nav__link auth-nav__link--user" title="Dashboard wartawan">👤 ${user.name.split(" ")[0]}</a>
          <a href="#" class="auth-nav__link auth-nav__link--logout" id="auth-logout">Keluar</a>`;
        const logoutBtn = document.getElementById("auth-logout");
        logoutBtn?.addEventListener("click", (e) => {
          e.preventDefault();
          logoutUser();
          window.location.reload();
        });
      } else {
        console.log("User not logged in");
        el.innerHTML = `
          <a href="login.html" class="auth-nav__link">Masuk</a>
          <a href="signup.html" class="auth-nav__link auth-nav__link--cta">Daftar</a>`;
      }
    } else {
      console.log("Auth functions not available, showing default buttons");
      // Keep the default HTML buttons
    }

    // Render mobile auth nav
    const mobileEl = document.getElementById("mobile-nav-auth");
    console.log("mobile-nav-auth element:", mobileEl);
    
    if (!mobileEl) {
      console.error("mobile-nav-auth element not found!");
      return;
    }

    if (typeof isLoggedIn !== 'undefined' && typeof getCurrentUser !== 'undefined' && typeof logoutUser !== 'undefined') {
      if (isLoggedIn()) {
        const user = getCurrentUser();
        mobileEl.innerHTML = `
          <a href="dashboard.html" class="mobile-nav__auth-link">👤 ${user.name.split(" ")[0]}</a>
          <a href="#" class="mobile-nav__auth-link" id="mobile-auth-logout">Keluar</a>`;
        const mobileLogoutBtn = document.getElementById("mobile-auth-logout");
        mobileLogoutBtn?.addEventListener("click", (e) => {
          e.preventDefault();
          logoutUser();
          window.location.reload();
        });
      } else {
        mobileEl.innerHTML = `
          <a href="login.html" class="mobile-nav__auth-link">Masuk</a>
          <a href="signup.html" class="mobile-nav__auth-link mobile-nav__auth-link--cta">Daftar</a>`;
      }
    } else {
      console.log("Auth functions not available, showing default mobile buttons");
      mobileEl.innerHTML = `
        <a href="login.html" class="mobile-nav__auth-link">Masuk</a>
        <a href="signup.html" class="mobile-nav__auth-link mobile-nav__auth-link--cta">Daftar</a>`;
    }
  },

  renderHero() {
    const article = getFeaturedArticle();
    const el = document.getElementById("hero-section");
    if (!el || !article) return;

    const dateText = new Date(article.date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    el.innerHTML = `
      <div class="hero-shell">
        <div class="hero-shell__image">
          <img src="assets/hero-banyuwangi-reference.png" alt="Pemandangan alam Banyuwangi" fetchpriority="high">
        </div>
        <div class="hero-shell__panel">
          <div class="hero-brand">
            <div class="hero-brand__mark" aria-hidden="true"></div>
            <div class="hero-brand__text">Banyuwangi<br>Asyik</div>
          </div>
          <div class="hero-date">${dateText}</div>
          <div class="hero-copy">
            <span class="hero-copy__tag">${article.category}</span>
            <h1>${article.title}</h1>
            <p>${article.excerpt}</p>
            <div class="hero-meta">
              <span>${article.author}</span>
              <span>${getRelativeTime(article.date)}</span>
              <span>${article.readTime} minutes</span>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderCategoryTabs() {
    const el = document.getElementById("category-tabs");
    if (!el) return;
    el.innerHTML = "";
  },

  renderNewsGrid(category) {
    const el = document.getElementById("news-grid");
    if (!el) return;

    const articles = getAllArticles().slice(0, 3);
    const positions = ["center center", "center 35%", "center 20%"];
    el.innerHTML = `
      <div class="top-stories-header">
        <h2>TOP STORIES</h2>
      </div>
      <div class="top-stories-grid">
        ${articles.map((a, index) => `
          <a href="${this.articleUrl(a)}" class="top-story-card ${index === 0 ? "top-story-card--featured" : ""}">
            <div class="top-story-card__thumb">
              <img src="${a.image}" alt="${a.imageAlt}" loading="lazy" style="object-position: ${positions[index] || "center center"};">
            </div>
            <div class="top-story-card__content">
              <div class="top-story-card__label">${a.category}</div>
              <h3>${a.title}</h3>
              <p>${a.excerpt}</p>
            </div>
          </a>
        `).join("")}
      </div>
    `;
  },

  renderStoriesRow() {
    const el = document.getElementById("stories-row");
    if (!el) return;

    const events = [
      "Banyuwangi Cultural Festival",
      "Beach Cleanup Day",
      "Traditional Dance Performance"
    ];
    const image = getAllArticles()[0]?.image || "assets/article-1.svg";

    el.innerHTML = `
      <section class="local-events">
        <div class="local-events__title-wrap">
          <h2>LOCAL EVENTS</h2>
        </div>
        <div class="local-events__body">
          <ul class="local-events__list">
            ${events.map(item => `<li>• ${item}</li>`).join("")}
          </ul>
          <div class="local-events__image">
            <img src="${image}" alt="Acara lokal Banyuwangi" loading="lazy">
          </div>
        </div>
        <div class="timeline-header">BANYUWANGI TIMELINE</div>
        <div class="timeline-grid">
          <div class="timeline-item"><span>ORIGINS</span><small>Early settlements</small></div>
          <div class="timeline-item"><span>GROWTH</span><small>Agricultural development</small></div>
          <div class="timeline-item"><span>MODERNIZATION</span><small>Infrastructure expansion</small></div>
          <div class="timeline-item"><span>CULTURE</span><small>Revival of traditions</small></div>
        </div>
      </section>
    `;
  },

  renderCategorySections() {
    const el = document.getElementById("category-sections");
    if (!el) return;

    const culture = getAllArticles().slice(0, 2);
    const highlightImage = culture[0]?.image || "assets/article-3.svg";

    el.innerHTML = `
      <section class="cultural-highlight">
        <div class="cultural-highlight__title">CULTURAL HIGHLIGHTS</div>
        <div class="cultural-highlight__content">
          <div class="cultural-highlight__image">
            <img src="${highlightImage}" alt="Budaya Banyuwangi" loading="lazy">
          </div>
          <ul>
            <li>Traditional Banyuwangi dance performances</li>
            <li>Unique culinary festival experiences</li>
            <li>Annual cultural celebrations</li>
          </ul>
        </div>
      </section>

      <section class="next-steps">
        <div class="next-steps__card next-steps__card--gold">
          <span>Subscribe Now</span>
          <small>Receive daily news</small>
          <a href="https://www.youtube.com/@bwi_asyik" target="_blank" rel="noopener noreferrer" class="next-steps__link">YouTube</a>
        </div>
        <div class="next-steps__card">
          <span>Connect Online</span>
          <small>Follow us online</small>
        </div>
        <div class="next-steps__card">
          <span>Get Involved</span>
          <small>Attend local events</small>
        </div>
      </section>

      <section class="contact-us">
        <h2>Contact Us</h2>
        <p>Get in touch with us today</p>
        <div class="contact-us__row">
          <div>Email</div>
          <strong>bwiasyik@gmail.com</strong>
        </div>
        <div class="contact-us__row">
          <div>Phone</div>
          <strong>+6285213037381</strong>
        </div>
      </section>
    `;
  },

  renderMostRead() {
    const el = document.getElementById("most-read");
    if (!el) return;
    el.innerHTML = "";
  },

  renderRelatedArticles(current) {
    const el = document.getElementById("related-articles");
    if (!el) return;

    const related = getAllNews()
      .filter(a => a.id !== current.id && a.category === current.category)
      .slice(0, 3);

    const fallback = getAllNews().filter(a => a.id !== current.id).slice(0, 3);
    const articles = related.length ? related : fallback;

    el.innerHTML = `
      <div class="section-header">
        <h2 class="section-header__title">Berita Terkait</h2>
      </div>
      <div class="stories-row">
        ${articles.map(a => `
          <a href="${this.articleUrl(a)}" class="story-card">
            <img class="story-card__image" src="${a.image}" alt="${a.imageAlt}" loading="lazy">
            <div class="story-card__content">
              <div class="story-card__category">${a.category}</div>
              <h3 class="story-card__title">${a.title}</h3>
            </div>
          </a>
        `).join("")}
      </div>`;
  },

  initSearch() {
    const modal = document.getElementById("search-modal");
    const btnOpen = document.getElementById("btn-search");
    const btnClose = document.getElementById("search-close");
    const input = document.getElementById("search-input");
    const results = document.getElementById("search-results");

    if (!modal) return;

    // Debounce untuk performa pencarian
    let debounceTimer;

    btnOpen?.addEventListener("click", () => {
      modal.classList.add("open");
      setTimeout(() => input?.focus(), 50);
    });

    btnClose?.addEventListener("click", () => modal.classList.remove("open"));

    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.remove("open");
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") modal.classList.remove("open");
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        modal.classList.toggle("open");
        if (modal.classList.contains("open")) setTimeout(() => input?.focus(), 50);
      }
    });

    input?.addEventListener("input", () => {
      clearTimeout(debounceTimer);
      const query = input.value.trim().toLowerCase();
      if (!query) {
        results.innerHTML = "";
        return;
      }

      // Debounce 150ms
      debounceTimer = setTimeout(() => {
        const matched = getAllNews().filter(a =>
          a.title.toLowerCase().includes(query) ||
          a.excerpt.toLowerCase().includes(query) ||
          a.category.toLowerCase().includes(query)
        );

        results.innerHTML = matched.length
          ? matched.map(a => `
              <a href="${this.articleUrl(a)}" class="search-result-item">
                <div class="search-result-item__title">${highlightMatch(a.title, query)}</div>
                <div class="search-result-item__meta">${a.category} &middot; ${formatShortDate(a.date)}</div>
              </a>
            `).join("")
          : `<p style="padding:1rem 0;color:var(--color-text-muted);">Tidak ada hasil untuk &ldquo;${escapeHtml(query)}&rdquo;</p>`;
      }, 150);
    });
  },

  initMobileMenu() {
    const btn = document.getElementById("btn-menu");
    const nav = document.getElementById("mobile-nav");
    if (!btn || !nav) return;

    const toggleMenu = (open) => {
      nav.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", String(open));
      btn.setAttribute("aria-label", open ? "Tutup menu navigasi" : "Buka menu navigasi");
      document.body.style.overflow = open ? "hidden" : "";
    };

    btn.addEventListener("click", () => {
      toggleMenu(!nav.classList.contains("open"));
    });

    nav.querySelectorAll(".mobile-nav__link").forEach(link => {
      link.addEventListener("click", () => toggleMenu(false));
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        toggleMenu(false);
      }
    });
  },

  initNewsletter() {
    const form = document.getElementById("newsletter-form");
    const messageEl = document.getElementById("newsletter-message");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const emailInput = form.querySelector('input[type="email"]');
      const email = emailInput.value.trim();

      if (!isValidEmail(email)) {
        showNewsletterMessage(messageEl, "Masukkan alamat email yang valid.", "error");
        emailInput.focus();
        return;
      }

      // Simpan ke localStorage sebagai data langganan (simulasi)
      let subscribers = [];
      try {
        subscribers = JSON.parse(localStorage.getItem("bab_subscribers") || "[]");
      } catch {
        subscribers = [];
      }
      if (!subscribers.includes(email)) {
        subscribers.push(email);
        localStorage.setItem("bab_subscribers", JSON.stringify(subscribers));
      }

      showNewsletterMessage(messageEl, "Terima kasih! Anda telah berlangganan newsletter kami.", "success");
      form.reset();
    });
  },

  shareArticle(platform) {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);
    const links = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
      whatsapp: `https://wa.me/?text=${title}%20${url}`
    };
    window.open(links[platform], "_blank", "width=600,height=400,noopener,noreferrer");
  },

  copyLink(btn) {
    const url = window.location.href;
    const copyFallback = () => {
      // Fallback untuk browser lama
      const textarea = document.createElement("textarea");
      textarea.value = url;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
      } catch (err) {
        // Abaikan
      }
      document.body.removeChild(textarea);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        showToast("Link artikel berhasil disalin!");
      }).catch(() => {
        copyFallback();
        showToast("Link artikel berhasil disalin!");
      });
    } else {
      copyFallback();
      showToast("Link artikel berhasil disalin!");
    }
  },

  // Simulasi pelacakan views (untuk fitur "Terpopuler" di masa depan)
  trackArticleView(id) {
    try {
      let views = JSON.parse(localStorage.getItem("bab_views") || "{}");
      views[id] = (views[id] || 0) + 1;
      localStorage.setItem("bab_views", JSON.stringify(views));
    } catch {
      // Abaikan jika localStorage tidak tersedia
    }
  }
};

// ---- Helper Functions ----

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showNewsletterMessage(el, message, type) {
  if (!el) return;
  el.textContent = message;
  el.className = `newsletter-form__message newsletter-form__message--${type}`;
  setTimeout(() => {
    el.textContent = "";
    el.className = "newsletter-form__message";
  }, 5000);
}

function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), 2500);
}

function highlightMatch(text, query) {
  const safeText = escapeHtml(text);
  const safeQuery = escapeHtml(query);
  const escaped = safeQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  return safeText.replace(regex, "<mark>$1</mark>");
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Konversi URL video menjadi embed HTML
 * Mendukung YouTube, Vimeo, dan Google Drive
 */
function getVideoEmbedHtml(url, title) {
  if (!url) return "";

  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    return `
      <div class="article-video">
        <iframe
          src="https://www.youtube.com/embed/${ytMatch[1]}"
          title="${escapeHtml(title)}"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          loading="lazy"></iframe>
      </div>`;
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `
      <div class="article-video">
        <iframe
          src="https://player.vimeo.com/video/${vimeoMatch[1]}"
          title="${escapeHtml(title)}"
          frameborder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowfullscreen
          loading="lazy"></iframe>
      </div>`;
  }

  // Google Drive
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) {
    return `
      <div class="article-video">
        <iframe
          src="https://drive.google.com/file/d/${driveMatch[1]}/preview"
          title="${escapeHtml(title)}"
          frameborder="0"
          allow="autoplay; encrypted-media"
          allowfullscreen
          loading="lazy"></iframe>
      </div>`;
  }

  // Fallback: link biasa
  return `
    <div class="article-video article-video--link">
      <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">🎥 Tonton Video Terkait</a>
    </div>`;
}