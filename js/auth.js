/**
 * Sistem Autentikasi & Manajemen Artikel Wartawan
 * Menggunakan localStorage sebagai database sederhana
 */

const AUTH_KEYS = {
  USERS: "bab_users",
  SESSION: "bab_session",
  UPLOADED_ARTICLES: "bab_uploaded_articles"
};

// ==================== AUTH ====================

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEYS.USERS) || "[]");
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(AUTH_KEYS.USERS, JSON.stringify(users));
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEYS.SESSION) || "null");
  } catch {
    return null;
  }
}

function setSession(user) {
  localStorage.setItem(AUTH_KEYS.SESSION, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(AUTH_KEYS.SESSION);
}

function isLoggedIn() {
  return getCurrentUser() !== null;
}

function registerUser({ name, username, email, password }) {
  const users = getUsers();

  // Validasi username unik
  if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
    return { success: false, message: "Username sudah digunakan." };
  }

  // Validasi email unik
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return { success: false, message: "Email sudah terdaftar." };
  }

  const user = {
    id: Date.now(),
    name,
    username,
    email,
    password: btoa(password), // Enkripsi sederhana (bukan untuk produksi)
    role: "wartawan",
    createdAt: new Date().toISOString()
  };

  users.push(user);
  saveUsers(users);
  return { success: true, message: "Registrasi berhasil! Silakan login." };
}

function loginUser(identifier, password) {
  const users = getUsers();
  const user = users.find(u =>
    (u.username.toLowerCase() === identifier.toLowerCase() ||
     u.email.toLowerCase() === identifier.toLowerCase())
  );

  if (!user) {
    return { success: false, message: "Username/email tidak ditemukan." };
  }

  if (user.password !== btoa(password)) {
    return { success: false, message: "Password salah." };
  }

  // Simpan sesi tanpa password
  const sessionUser = {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role
  };
  setSession(sessionUser);
  return { success: true, message: "Login berhasil!", user: sessionUser };
}

function logoutUser() {
  clearSession();
}

// ==================== ARTIKEL WARTAWAN ====================

function getUploadedArticles() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEYS.UPLOADED_ARTICLES) || "[]");
  } catch {
    return [];
  }
}

function saveUploadedArticles(articles) {
  localStorage.setItem(AUTH_KEYS.UPLOADED_ARTICLES, JSON.stringify(articles));
}

function getArticleByAuthor(username) {
  return getUploadedArticles().filter(a => a.authorUsername === username);
}

function createUploadedArticle(articleData) {
  const articles = getUploadedArticles();
  const newArticle = {
    id: Date.now(),
    slug: generateSlug(articleData.title),
    title: articleData.title,
    excerpt: articleData.excerpt,
    category: articleData.category,
    author: articleData.authorName,
    authorUsername: articleData.authorUsername,
    date: new Date().toISOString(),
    readTime: calculateReadTime(articleData.content),
    featured: false,
    breaking: false,
    image: articleData.image || "",
    imageAlt: articleData.imageAlt || articleData.title,
    video: articleData.video || "",
    content: articleData.content,
    status: "published",
    views: 0
  };
  articles.unshift(newArticle);
  saveUploadedArticles(articles);
  return newArticle;
}

function updateUploadedArticle(id, updates) {
  const articles = getUploadedArticles();
  const index = articles.findIndex(a => a.id === Number(id));
  if (index === -1) return null;
  articles[index] = { ...articles[index], ...updates };
  saveUploadedArticles(articles);
  return articles[index];
}

function deleteUploadedArticle(id) {
  let articles = getUploadedArticles();
  articles = articles.filter(a => a.id !== Number(id));
  saveUploadedArticles(articles);
}

function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function calculateReadTime(html) {
  const text = html.replace(/<[^>]*>/g, "").trim();
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

// Gabungkan artikel statis + artikel unggahan wartawan
function getAllArticles() {
  const uploaded = getUploadedArticles().map(a => ({
    ...a,
    id: a.id,
    fromNewsroom: true
  }));
  return [...uploaded, ...ARTICLES];
}

// ==================== HELPER ====================

function showAuthMessage(el, message, type = "error") {
  if (!el) return;
  el.textContent = message;
  el.className = `auth-message auth-message--${type}`;
  setTimeout(() => {
    el.textContent = "";
    el.className = "auth-message";
  }, 5000);
}