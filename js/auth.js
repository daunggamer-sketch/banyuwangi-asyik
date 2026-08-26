/**
 * Sistem Autentikasi & Manajemen Artikel Wartawan
 * Menggunakan Firebase Auth + Firestore + Storage (database terpusat)
 */

// ==================== AUTH (Firebase) ====================

/**
 * Registrasi user baru
 */
async function registerUser({ name, username, email, password }) {
  try {
    // Buat akun di Firebase Auth
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    // Simpan profil ke Firestore
    await db.collection("users").doc(user.uid).set({
      name,
      username,
      email,
      role: "wartawan",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, message: "Registrasi berhasil! Silakan login." };
  } catch (error) {
    let message = error.message;
    if (error.code === "auth/email-already-in-use") {
      message = "Email sudah terdaftar.";
    } else if (error.code === "auth/invalid-email") {
      message = "Format email tidak valid.";
    } else if (error.code === "auth/weak-password") {
      message = "Password terlalu lemah, minimal 6 karakter.";
    }
    return { success: false, message };
  }
}

/**
 * Login user
 */
async function loginUser(identifier, password) {
  try {
    const email = identifier.includes("@") ? identifier : `${identifier}@placeholder.firebase`;
    let userCredential;

    if (email.includes("placeholder.firebase")) {
      // Jika login pakai username, cari email-nya dulu di Firestore
      const snapshot = await db.collection("users")
        .where("username", "==", identifier)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return { success: false, message: "Username tidak ditemukan." };
      }

      const userData = snapshot.docs[0].data();
      userCredential = await auth.signInWithEmailAndPassword(userData.email, password);
    } else {
      userCredential = await auth.signInWithEmailAndPassword(email, password);
    }

    const user = userCredential.user;

    // Ambil data profil dari Firestore
    const doc = await db.collection("users").doc(user.uid).get();
    let userData = {
      id: user.uid,
      email: user.email,
      name: user.email.split("@")[0],
      username: user.email.split("@")[0],
      role: "wartawan"
    };

    if (doc.exists) {
      userData = {
        id: user.uid,
        email: doc.data().email || user.email,
        name: doc.data().name || userData.name,
        username: doc.data().username || userData.username,
        role: doc.data().role || "wartawan"
      };
    }

    // Simpan sesi
    setSession(userData);
    return { success: true, message: "Login berhasil!", user: userData };
  } catch (error) {
    let message = error.message;
    if (error.code === "auth/user-not-found") {
      message = "Email tidak terdaftar. Silakan daftar dulu.";
    } else if (error.code === "auth/wrong-password") {
      message = "Password salah.";
    } else if (error.code === "auth/invalid-email") {
      message = "Format email tidak valid.";
    }
    return { success: false, message };
  }
}

async function logoutUser() {
  try {
    await auth.signOut();
  } catch (e) {
    // Abaikan
  }
  clearSession();
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

// ==================== ARTIKEL (Firestore) ====================

/**
 * Ambil semua artikel dari Firestore
 */
async function getUploadedArticlesFromFirebase() {
  try {
    const snapshot = await db.collection("articles").orderBy("date", "desc").get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Gagal mengambil artikel:", error);
    // Fallback ke localStorage
    return getUploadedArticlesLocal();
  }
}

/**
 * Simpan artikel baru ke Firestore
 */
async function createUploadedArticleFirebase(articleData) {
  try {
    const docRef = await db.collection("articles").add({
      ...articleData,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return { id: docRef.id, ...articleData };
  } catch (error) {
    console.error("Gagal menyimpan artikel:", error);
    throw error;
  }
}

/**
 * Hapus artikel dari Firestore
 */
async function deleteUploadedArticleFirebase(id) {
  try {
    await db.collection("articles").doc(id).delete();
    return true;
  } catch (error) {
    console.error("Gagal menghapus artikel:", error);
    throw error;
  }
}

/**
 * Ambil artikel milik penulis tertentu
 */
async function getArticleByAuthorFirebase(username) {
  try {
    const snapshot = await db.collection("articles")
      .where("authorUsername", "==", username)
      .orderBy("date", "desc")
      .get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Gagal mengambil artikel penulis:", error);
    return [];
  }
}

// ==================== UPLOAD FILE (Storage) ====================

/**
 * Upload file (foto/video) ke Firebase Storage
 */
async function uploadFileFirebase(file, path) {
  try {
    const storageRef = storage.ref(`${path}/${Date.now()}_${file.name}`);
    const snapshot = await storageRef.put(file);
    const downloadURL = await snapshot.ref.getDownloadURL();
    return downloadURL;
  } catch (error) {
    console.error("Gagal upload file:", error);
    throw error;
  }
}

// ==================== KOMPATIBILITAS (wrapper) ====================

/**
 * Fungsi wrapper agar kode lama tetap berfungsi.
 * Mencoba Firebase dulu, fallback ke localStorage.
 */

const AUTH_KEYS = {
  USERS: "bab_users",
  SESSION: "bab_session",
  UPLOADED_ARTICLES: "bab_uploaded_articles"
};

// LocalStorage helpers (fallback)
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

function getUploadedArticlesLocal() {
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
  // Gunakan Firebase untuk artikel penulis
  return getArticleByAuthorFirebase(username);
}

function getUploadedArticles() {
  // Gunakan Firebase untuk semua artikel
  return getUploadedArticlesFromFirebase();
}

function createUploadedArticle(articleData) {
  // Gunakan Firebase untuk simpan artikel
  return createUploadedArticleFirebase(articleData);
}

function deleteUploadedArticle(id) {
  // Gunakan Firebase untuk hapus artikel
  return deleteUploadedArticleFirebase(id);
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
 * Gabungkan artikel statis + artikel dari Firebase
 * (async — harus dipanggil dengan await)
 */
async function getAllArticles() {
  let uploaded = [];
  try {
    uploaded = await getUploadedArticlesFromFirebase();
  } catch {
    uploaded = getUploadedArticlesLocal();
  }
  const mapped = uploaded.map(a => ({
    ...a,
    id: a.id,
    fromNewsroom: true,
    date: a.date || new Date().toISOString()
  }));
  return [...mapped, ...ARTICLES];
}

function showAuthMessage(el, message, type = "error") {
  if (!el) return;
  el.textContent = message;
  el.className = `auth-message auth-message--${type}`;
  setTimeout(() => {
    el.textContent = "";
    el.className = "auth-message";
  }, 5000);
}