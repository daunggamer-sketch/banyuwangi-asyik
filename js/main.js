const App = {
  initCommon() {
    this.renderBreakingTicker();
    this.renderHeaderDate();
    this.initSearch();
    this.initMobileMenu();
    this.initNewsletter();
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
      document.getElementById("article-content").innerHTML = `
        <div class="article-header text-center" style="padding:4rem 0;">
          <h1 class="article-header__title">Artikel Tidak Ditemukan</h1>
          <p class="article-header__excerpt">Maaf, artikel yang Anda cari tidak tersedia.</p>
          <a href="index.html" style="color:var(--color-primary);font-weight:600;">← Kembali ke Beranda</a>
        </div>`;
      return;
    }

    document.title = `${article.title} — Banyuwangi Asyik Berita`;
    document.querySelector('meta[name="description"]').content = article.excerpt;

    document.getElementById("article-content").innerHTML = `
      <header class="article-header">
        <div class="article-header__category">${article.category}</div>
        <h1 class="article-header__title">${article.title}</h1>
        <p class="article-header__excerpt">${article.excerpt}</p>
        <div class="article-header__meta">
          <span class="article-header__author">Oleh ${article.author}</span>
          <span>${formatDate(article.date)}</span>
          <span>${article.readTime} menit baca</span>
        </div>
      </header>
      <img class="article-hero-image" src="${article.image}" alt="${article.imageAlt}">
      <p class="article-hero-caption">${article.imageAlt}</p>
      <div class="article-body">${article.content}</div>
      <div class="article-share">
        <span class="article-share__label">Bagikan</span>
        <button class="article-share__btn" onclick="App.shareArticle('facebook')">Facebook</button>
        <button class="article-share__btn" onclick="App.shareArticle('twitter')">X / Twitter</button>
        <button class="article-share__btn" onclick="App.shareArticle('whatsapp')">WhatsApp</button>
        <button class="article-share__btn" onclick="App.copyLink()">Salin Link</button>
      </div>`;

    this.renderRelatedArticles(article);
  },

  articleUrl(article) {
    return `article.html?id=${article.id}`;
  },

  renderBreakingTicker() {
    const breaking = getBreakingNews();
    const items = breaking.length ? breaking : ARTICLES.slice(0, 3);
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

  renderHero() {
    const article = getFeaturedArticle();
    const el = document.getElementById("hero-section");
    if (!el || !article) return;

    el.innerHTML = `
      <a href="${this.articleUrl(article)}" class="hero__link">
        <img class="hero__image" src="${article.image}" alt="${article.imageAlt}">
        <div class="hero__overlay"></div>
        <div class="hero__content">
          <span class="hero__category">${article.category}</span>
          <h1 class="hero__title">${article.title}</h1>
          <p class="hero__excerpt">${article.excerpt}</p>
          <div class="hero__meta">
            <span>${article.author}</span>
            <span>${getRelativeTime(article.date)}</span>
            <span>${article.readTime} min read</span>
          </div>
        </div>
      </a>`;
  },

  renderCategoryTabs() {
    const el = document.getElementById("category-tabs");
    if (!el) return;

    el.innerHTML = CATEGORIES.map((cat, i) => `
      <button class="category-tabs__btn${i === 0 ? " active" : ""}" data-category="${cat}">${cat}</button>
    `).join("");

    el.addEventListener("click", (e) => {
      const btn = e.target.closest(".category-tabs__btn");
      if (!btn) return;
      el.querySelectorAll(".category-tabs__btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      this.renderNewsGrid(btn.dataset.category);
    });
  },

  renderNewsGrid(category) {
    const el = document.getElementById("news-grid");
    if (!el) return;

    const articles = getByCategory(category).filter(a => !a.featured).slice(0, 4);
    el.innerHTML = articles.map(a => `
      <a href="${this.articleUrl(a)}" class="news-card news-card--featured">
        <div class="news-card__image-wrap">
          <img class="news-card__image" src="${a.image}" alt="${a.imageAlt}" loading="lazy">
        </div>
        <div class="news-card__body">
          <div class="news-card__category">${a.category}</div>
          <h3 class="news-card__title">${a.title}</h3>
          <p class="news-card__excerpt">${a.excerpt}</p>
          <div class="news-card__meta">${getRelativeTime(a.date)} · ${a.readTime} min</div>
        </div>
      </a>
    `).join("");
  },

  renderStoriesRow() {
    const el = document.getElementById("stories-row");
    if (!el) return;

    const articles = ARTICLES.slice(2, 5);
    el.innerHTML = articles.map(a => `
      <a href="${this.articleUrl(a)}" class="story-card">
        <img class="story-card__image" src="${a.image}" alt="${a.imageAlt}" loading="lazy">
        <div class="story-card__content">
          <div class="story-card__category">${a.category}</div>
          <h3 class="story-card__title">${a.title}</h3>
        </div>
      </a>
    `).join("");
  },

  renderCategorySections() {
    const el = document.getElementById("category-sections");
    if (!el) return;

    const sections = ["Daerah", "Ekonomi", "Olahraga", "Politik", "Lingkungan"];
    el.innerHTML = sections.map(cat => {
      const articles = getByCategory(cat, 3);
      if (!articles.length) return "";
      const slug = cat.toLowerCase();
      return `
        <section id="${slug}" style="margin-bottom:2.5rem;">
          <div class="section-header">
            <h2 class="section-header__title">${cat}</h2>
            <a href="#" class="section-header__link" data-category="${cat}">Lihat Semua →</a>
          </div>
          <div class="news-grid" style="grid-template-columns:1fr;">
            ${articles.map(a => `
              <a href="${this.articleUrl(a)}" class="news-card news-card--horizontal">
                <div class="news-card__image-wrap">
                  <img class="news-card__image" src="${a.image}" alt="${a.imageAlt}" loading="lazy">
                </div>
                <div class="news-card__body">
                  <div class="news-card__category">${a.category}</div>
                  <h3 class="news-card__title">${a.title}</h3>
                  <p class="news-card__excerpt">${a.excerpt}</p>
                  <div class="news-card__meta">${getRelativeTime(a.date)}</div>
                </div>
              </a>
            `).join("")}
          </div>
        </section>`;
    }).join("");

    el.querySelectorAll(".section-header__link").forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const cat = link.dataset.category;
        document.querySelectorAll(".category-tabs__btn").forEach(btn => {
          btn.classList.toggle("active", btn.dataset.category === cat);
        });
        this.renderNewsGrid(cat);
        document.getElementById("category-tabs").scrollIntoView({ behavior: "smooth" });
      });
    });
  },

  renderMostRead() {
    const el = document.getElementById("most-read");
    if (!el) return;

    el.innerHTML = getMostRead(5).map((a, i) => `
      <li>
        <a href="${this.articleUrl(a)}" class="most-read-item">
          <span class="most-read-item__num">${i + 1}</span>
          <div>
            <div class="most-read-item__title">${a.title}</div>
            <div class="most-read-item__time">${getRelativeTime(a.date)}</div>
          </div>
        </a>
      </li>
    `).join("");
  },

  renderRelatedArticles(current) {
    const el = document.getElementById("related-articles");
    if (!el) return;

    const related = ARTICLES
      .filter(a => a.id !== current.id && a.category === current.category)
      .slice(0, 3);

    const fallback = ARTICLES.filter(a => a.id !== current.id).slice(0, 3);
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

    btnOpen?.addEventListener("click", () => {
      modal.classList.add("open");
      input?.focus();
    });

    btnClose?.addEventListener("click", () => modal.classList.remove("open"));

    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.remove("open");
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") modal.classList.remove("open");
    });

    input?.addEventListener("input", () => {
      const query = input.value.trim().toLowerCase();
      if (!query) {
        results.innerHTML = "";
        return;
      }

      const matched = ARTICLES.filter(a =>
        a.title.toLowerCase().includes(query) ||
        a.excerpt.toLowerCase().includes(query) ||
        a.category.toLowerCase().includes(query)
      );

      results.innerHTML = matched.length
        ? matched.map(a => `
            <a href="${this.articleUrl(a)}" class="search-result-item">
              <div class="search-result-item__title">${a.title}</div>
              <div class="search-result-item__meta">${a.category} · ${formatShortDate(a.date)}</div>
            </a>
          `).join("")
        : `<p style="padding:1rem 0;color:var(--color-text-muted);">Tidak ada hasil untuk "${query}"</p>`;
    });
  },

  initMobileMenu() {
    const btn = document.getElementById("btn-menu");
    const nav = document.getElementById("mobile-nav");
    if (!btn || !nav) return;

    btn.addEventListener("click", () => nav.classList.toggle("open"));
    nav.querySelectorAll(".mobile-nav__link").forEach(link => {
      link.addEventListener("click", () => nav.classList.remove("open"));
    });
  },

  initNewsletter() {
    const form = document.getElementById("newsletter-form");
    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      alert("Terima kasih! Anda telah berlangganan newsletter Banyuwangi Asyik Berita.");
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
    window.open(links[platform], "_blank", "width=600,height=400");
  },

  copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert("Link artikel berhasil disalin!");
    });
  }
};
