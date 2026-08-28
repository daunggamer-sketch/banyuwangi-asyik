/**
 * Sistem Autentikasi & Manajemen Artikel Wartawan
 * Menggunakan localStorage sebagai primary, Firebase sebagai opsional
 */

// ==================== AUTH (localStorage - Primary) ====================

/**
 * Registrasi user baru dengan localStorage (primary method)
 */
function registerUser({ name, username, email, password }) {
  console.log("Memulai registrasi untuk:", email);
  
  try {
    const users = getUsers();
    const existingUser = users.find(u => u.email === email || u.username === username);
    
    if (existingUser) {
      if (existingUser.email === email) {
        return { success: false, message: "Email sudah terdaftar." };
      } else {
        return { success: false, message: "Username sudah digunakan." };
      }
    }
    
    const newUser = {
      id: Date.now().toString(),
      name,
      username,
      email,
      password, // Catatan: Ini tidak aman untuk production, gunakan hash di production
      role: "wartawan",
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    saveUsers(users);
    console.log("Registrasi berhasil");
    return { success: true, message: "Registrasi berhasil! Silakan login." };
  } catch (error) {
    console.error("Error registrasi:", error);
    return { success: false, message: "Gagal registrasi. Silakan coba lagi." };
  }
}

/**
 * Login user dengan localStorage (primary method)
 */
function loginUser(identifier, password) {
  console.log("Memulai login untuk:", identifier);
  
  try {
    const users = getUsers();
    const user = users.find(u => 
      (u.email === identifier || u.username === identifier) && u.password === password
    );
    
    if (!user) {
      const userExists = users.find(u => u.email === identifier || u.username === identifier);
      if (userExists) {
        return { success: false, message: "Password salah." };
      } else {
        return { success: false, message: "User tidak ditemukan. Silakan daftar dulu." };
      }
    }
    
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      role: user.role || "wartawan"
    };
    
    setSession(userData);
    console.log("Login berhasil");
    return { success: true, message: "Login berhasil!", user: userData };
  } catch (error) {
    console.error("Error login:", error);
    return { success: false, message: "Gagal login. Silakan coba lagi." };
  }
}

function logoutUser() {
  clearSession();
  console.log("User logged out");
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

// ==================== ARTIKEL (localStorage) ====================

/**
 * Ambil semua artikel dari localStorage
 */
function getUploadedArticles() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEYS.UPLOADED_ARTICLES) || "[]");
  } catch {
    return [];
  }
}

/**
 * Simpan artikel baru ke localStorage
 */
function createUploadedArticle(articleData) {
  try {
    const articles = getUploadedArticles();
    const newArticle = {
      id: Date.now().toString(),
      ...articleData,
      date: new Date().toISOString()
    };
    articles.unshift(newArticle);
    localStorage.setItem(AUTH_KEYS.UPLOADED_ARTICLES, JSON.stringify(articles));
    return newArticle;
  } catch (error) {
    console.error("Gagal menyimpan artikel:", error);
    throw error;
  }
}

/**
 * Hapus artikel dari localStorage
 */
function deleteUploadedArticle(id) {
  try {
    console.log("Deleting article from localStorage, ID:", id);
    const articles = getUploadedArticles();
    console.log("Current articles:", articles);
    const filtered = articles.filter(a => String(a.id) !== String(id));
    console.log("After filtering:", filtered);
    localStorage.setItem(AUTH_KEYS.UPLOADED_ARTICLES, JSON.stringify(filtered));
    console.log("Article deleted successfully");
    return true;
  } catch (error) {
    console.error("Gagal menghapus artikel:", error);
    throw error;
  }
}

/**
 * Ambil artikel milik penulis tertentu
 */
function getArticleByAuthor(username) {
  try {
    const articles = getUploadedArticles();
    return articles.filter(a => a.authorUsername === username)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (error) {
    console.error("Gagal mengambil artikel penulis:", error);
    return [];
  }
}

// ==================== UPLOAD FILE (localStorage - base64) ====================

/**
 * Upload file dan convert ke base64 untuk localStorage
 */
function uploadFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ==================== KOMPATIBILITAS (localStorage keys) ====================

const AUTH_KEYS = {
  USERS: "bab_users",
  SESSION: "bab_session",
  UPLOADED_ARTICLES: "bab_uploaded_articles"
};

// LocalStorage helpers
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

// ==================== HELPER ====================

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

/**
 * Gabungkan artikel statis + artikel dari localStorage
 */
function getAllArticles() {
  const uploaded = getUploadedArticles();
  const mapped = uploaded.map(a => ({
    ...a,
    id: a.id,
    fromNewsroom: true,
    date: a.date || new Date().toISOString(),
    slug: a.slug || generateSlug(a.title),
    readTime: a.readTime || calculateReadTime(a.content),
    featured: false,
    breaking: false
  }));
  return [...mapped, ...ARTICLES];
}

// Make getAllArticles available globally for articles.js
window.getAllArticles = getAllArticles;

function showAuthMessage(el, message, type = "error") {
  if (!el) return;
  el.textContent = message;
  el.className = `auth-message auth-message--${type}`;
  setTimeout(() => {
    el.textContent = "";
    el.className = "auth-message";
  }, 5000);
}