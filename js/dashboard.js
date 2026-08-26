/**
 * Dashboard Wartawan — Logika untuk menulis, melihat, menghapus berita
 */

const Dashboard = {
  currentUser: null,

  init() {
    // Proteksi: hanya boleh diakses jika sudah login
    this.currentUser = getCurrentUser();
    if (!this.currentUser) {
      window.location.href = "login.html";
      return;
    }

    this.setupUserInfo();
    this.setupTabs();
    this.setupLogout();
    this.setupArticleForm();
    this.setupImagePreview();
    this.renderMyArticles();
  },

  setupUserInfo() {
    document.getElementById("dash-username").textContent = `👤 ${this.currentUser.name} (${this.currentUser.role})`;
    document.getElementById("dash-welcome-title").textContent = `Selamat Datang, ${this.currentUser.name}!`;
  },

  setupTabs() {
    const tabs = document.querySelectorAll(".dash-tab");
    const panels = document.querySelectorAll(".dash-panel");

    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        tabs.forEach(t => t.classList.remove("active"));
        panels.forEach(p => p.classList.remove("active"));

        tab.classList.add("active");
        document.getElementById(`panel-${tab.dataset.tab}`).classList.add("active");
      });
    });
  },

  setupLogout() {
    document.getElementById("btn-logout").addEventListener("click", () => {
      logoutUser();
      this.showToast("Berhasil keluar. Sampai jumpa!");
      setTimeout(() => {
        window.location.href = "index.html";
      }, 800);
    });
  },

  setupImagePreview() {
    const imageInput = document.getElementById("article-image");
    const preview = document.getElementById("image-preview");
    const previewImg = document.getElementById("image-preview-img");

    imageInput.addEventListener("input", () => {
      const url = imageInput.value.trim();
      if (url) {
        previewImg.src = url;
        preview.style.display = "flex";
      } else {
        preview.style.display = "none";
        previewImg.src = "";
      }
    });

    // Handle error gambar
    previewImg.addEventListener("error", () => {
      preview.style.display = "none";
    });
  },

  setupArticleForm() {
    const form = document.getElementById("article-form");
    const messageEl = document.getElementById("article-message");

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const title = document.getElementById("article-title").value.trim();
      const category = document.getElementById("article-category").value;
      const excerpt = document.getElementById("article-excerpt").value.trim();
      const content = document.getElementById("article-content").value.trim();
      const image = document.getElementById("article-image").value.trim();
      const video = document.getElementById("article-video").value.trim();

      // Validasi
      if (title.length < 10) {
        this.showMessage(messageEl, "Judul berita minimal 10 karakter.", "error");
        return;
      }
      if (!excerpt) {
        this.showMessage(messageEl, "Ringkasan berita wajib diisi.", "error");
        return;
      }
      const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim());
      if (paragraphs.length < 2) {
        this.showMessage(messageEl, "Isi berita minimal 2 paragraf (pisahkan dengan baris kosong).", "error");
        return;
      }

      // Konversi konten teks menjadi HTML dengan paragraf
      const contentHtml = paragraphs
        .map(p => `<p>${p.trim()}</p>`)
        .join("\n");

      createUploadedArticle({
        title,
        category,
        excerpt,
        content: contentHtml,
        image,
        imageAlt: title,
        video,
        authorName: this.currentUser.name,
        authorUsername: this.currentUser.username
      });

      this.showMessage(messageEl, "Berita berhasil dipublikasikan! 🎉", "success");
      this.showToast("Berita berhasil dipublikasikan!");

      form.reset();
      document.getElementById("image-preview").style.display = "none";

      // Refresh daftar artikel
      this.renderMyArticles();
    });
  },

  renderMyArticles() {
    const listEl = document.getElementById("my-articles-list");
    const myArticles = getArticleByAuthor(this.currentUser.username);

    if (!myArticles.length) {
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">📝</div>
          <h3 class="empty-state__title">Belum Ada Artikel</h3>
          <p class="empty-state__desc">Anda belum menulis berita apa pun. Mulai tulis berita pertama Anda di tab "Tulis Berita".</p>
          <button class="dash-btn dash-btn--primary" onclick="document.getElementById('tab-tulis').click()">Tulis Berita Sekarang</button>
        </div>`;
      return;
    }

    listEl.innerHTML = myArticles.map(a => `
      <div class="article-item">
        <div class="article-item__info">
          <h3 class="article-item__title">${this.escapeHtml(a.title)}</h3>
          <div class="article-item__meta">
            <span>📂 ${a.category}</span>
            <span>📅 ${formatShortDate(a.date)}</span>
            <span>⏱ ${a.readTime} menit</span>
            <span class="article-item__badge">${a.status}</span>
            ${a.video ? '<span>🎥 Video</span>' : ""}
            ${a.image ? '<span>🖼 Foto</span>' : ""}
          </div>
        </div>
        <div class="article-item__actions">
          <a href="article.html?slug=${a.slug}" class="dash-btn" target="_blank">Lihat</a>
          <button class="dash-btn dash-btn--danger" onclick="Dashboard.deleteArticle(${a.id})">Hapus</button>
        </div>
      </div>
    `).join("");
  },

  deleteArticle(id) {
    if (confirm("Apakah Anda yakin ingin menghapus berita ini?")) {
      deleteUploadedArticle(id);
      this.showToast("Berita berhasil dihapus.");
      this.renderMyArticles();
    }
  },

  showMessage(el, message, type = "error") {
    if (!el) return;
    el.innerHTML = `<div class="auth-message auth-message--${type}">${message}</div>`;
    setTimeout(() => {
      el.innerHTML = "";
    }, 5000);
  },

  showToast(message) {
    const toast = document.getElementById("dash-toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove("show"), 2500);
  },

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
};

document.addEventListener("DOMContentLoaded", () => {
  Dashboard.init();
});