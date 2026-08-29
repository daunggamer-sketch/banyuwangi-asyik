/**
 * Dashboard Wartawan — Logika untuk menulis, melihat, menghapus berita
 */

const Dashboard = {
  currentUser: null,

  init() {
    // Proteksi: hanya boleh diakses jika sudah login
    this.currentUser = getCurrentUser();
    if (!this.currentUser) {
      window.location.href = "https://daunggamer-sketch.github.io/banyuwangi-asyik/login.html";
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
        window.location.href = "https://daunggamer-sketch.github.io/banyuwangi-asyik/index.html";
      }, 800);
    });
  },

  setupImagePreview() {
    const imageInput = document.getElementById("article-image");
    const preview = document.getElementById("image-preview");
    const previewImg = document.getElementById("image-preview-img");

    imageInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          const base64 = await uploadFile(file);
          previewImg.src = base64;
          preview.style.display = "flex";
          document.getElementById("image-preview-name").textContent = file.name;
          // Store base64 in data attribute for later use
          imageInput.dataset.base64 = base64;
        } catch (error) {
          console.error("Error processing image:", error);
          this.showMessage(document.getElementById("article-message"), "Gagal memproses gambar. Silakan coba lagi.", "error");
        }
      } else {
        preview.style.display = "none";
        previewImg.src = "";
        delete imageInput.dataset.base64;
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
      const imageInput = document.getElementById("article-image");
      const video = document.getElementById("article-video").value.trim();

      // Get image data from file input
      let image = imageInput.dataset.base64 || "";
      if (!image && imageInput.files.length > 0) {
        // Fallback if base64 conversion failed
        this.showMessage(messageEl, "Gagal memproses gambar. Silakan pilih gambar lagi.", "error");
        return;
      }

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

      const articleData = {
        title,
        category,
        excerpt,
        content: contentHtml,
        image,
        imageAlt: title,
        video,
        authorName: this.currentUser.name,
        authorUsername: this.currentUser.username,
        slug: generateSlug(title),
        readTime: calculateReadTime(contentHtml),
        status: "Published"
      };

      try {
        createUploadedArticle(articleData);
        this.showMessage(messageEl, "Berita berhasil dipublikasikan! 🎉", "success");
        this.showToast("Berita berhasil dipublikasikan!");

        form.reset();
        document.getElementById("image-preview").style.display = "none";
        delete imageInput.dataset.base64;

        // Refresh daftar artikel
        this.renderMyArticles();
      } catch (error) {
        console.error("Error publishing article:", error);
        this.showMessage(messageEl, "Gagal mempublikasikan berita. Silakan coba lagi.", "error");
      }
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
            <span class="article-item__badge">${a.status || 'Published'}</span>
            ${a.video ? '<span>🎥 Video</span>' : ""}
            ${a.image ? '<span>🖼 Foto</span>' : ""}
          </div>
        </div>
        <div class="article-item__actions">
          <a href="article.html?slug=${a.slug}" class="dash-btn" target="_blank">Lihat</a>
          <button class="dash-btn dash-btn--danger" onclick="Dashboard.deleteArticle('${a.id}')">Hapus</button>
        </div>
      </div>
    `).join("");
  },

  deleteArticle(id) {
    if (confirm("Apakah Anda yakin ingin menghapus berita ini?")) {
      console.log("Deleting article with ID:", id);
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