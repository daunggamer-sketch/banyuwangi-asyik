/**
 * Sistem Autentikasi & Manajemen Artikel Wartawan
 * Menggunakan Firebase Auth + Firestore + Storage (database terpusat)
 */

// ==================== AUTH (Firebase) ====================

/**
 * Registrasi user baru
 */
async function registerUser({ name, username, email, password }) {
  console.log("Memulai registrasi untuk:", email);
  
  // Cek apakah Firebase tersedia
  if (!auth || !db) {
    console.log("Firebase tidak tersedia, menggunakan mode offline");
    return registerUserLocal({ name, username, email, password });
  }
  
  try {
    // Cek apakah Firebase sudah terinisialisasi
    if (!firebase.apps.length) {
      console.log("Firebase belum terinisialisasi, mencoba inisialisasi...");
      firebase.initializeApp(firebaseConfig);
    }

    console.log("Membuat akun Firebase Auth...");
    // Buat akun di Firebase Auth
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    console.log("Firebase Auth berhasil:", user.uid);

    console.log("Menyimpan profil ke Firestore...");
    // Simpan profil ke Firestore
    await db.collection("users").doc(user.uid).set({
      name,
      username,
      email,
      role: "wartawan",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    console.log("Firestore berhasil");

    return { success: true, message: "Registrasi berhasil! Silakan login." };
  } catch (error) {
    console.error("Error registrasi:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    
    let message = error.message;
    if (error.code === "auth/email-already-in-use") {
      message = "Email sudah terdaftar.";
    } else if (error.code === "auth/invalid-email") {
      message = "Format email tidak valid.";
    } else if (error.code === "auth/weak-password") {
      message = "Password terlalu lemah, minimal 6 karakter.";
    } else if (error.code === "auth/network-request-failed") {
      message = "Koneksi internet bermasalah. Periksa koneksi Anda.";
    } else if (error.code === "auth/too-many-requests") {
      message = "Terlalu banyak percobaan. Coba lagi dalam beberapa menit.";
    } else if (error.code === "auth/internal-error") {
      message = "Terjadi kesalahan internal Firebase. Coba gunakan mode offline.";
    } else if (error.code === "auth/operation-not-allowed") {
      message = "Registrasi email dinonaktifkan. Hubungi admin.";
    }
    
    // Fallback ke localStorage jika Firebase gagal
    console.log("Mencoba fallback ke localStorage...");
    return registerUserLocal({ name, username, email, password });
  }
}

/**
 * Registrasi user dengan localStorage (fallback)
 */
function registerUserLocal({ name, username, email, password }) {
  console.log("Registrasi localStorage untuk:", email);
  
  try {
    const users = getUsers();
    const existingUser = users.find(u => u.email === email || u.username === username);
    
    if (existingUser) {
      if (existingUser.email === email) {
        return { success: false, message: "Email sudah terdaftar (mode offline)." };
      } else {
        return { success: false, message: "Username sudah digunakan (mode offline)." };
      }
    }
    
    const newUser = {
      id: Date.now().toString(),
      name,
      username,
      email,
      password, // Catatan: Ini tidak aman untuk production
      role: "wartawan",
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    saveUsers(users);
    console.log("Registrasi localStorage berhasil");
    return { success: true, message: "Registrasi berhasil (mode offline)! Silakan login." };
  } catch (error) {
    console.error("Error localStorage registrasi:", error);
    return { success: false, message: "Gagal registrasi di localStorage." };
  }
}

/**
 * Login user
 */
async function loginUser(identifier, password) {
  console.log("Memulai login untuk:", identifier);
  
  // Cek apakah Firebase tersedia
  if (!auth || !db) {
    console.log("Firebase tidak tersedia, menggunakan mode offline");
    return loginUserLocal(identifier, password);
  }
  
  try {
    // Cek apakah Firebase sudah terinisialisasi
    if (!firebase.apps.length) {
      console.log("Firebase belum terinisialisasi, mencoba inisialisasi...");
      firebase.initializeApp(firebaseConfig);
    }

    const email = identifier.includes("@") ? identifier : `${identifier}@placeholder.firebase`;
    let userCredential;

    if (email.includes("placeholder.firebase")) {
      console.log("Login dengan username, mencari di Firestore...");
      // Jika login pakai username, cari email-nya dulu di Firestore
      const snapshot = await db.collection("users")
        .where("username", "==", identifier)
        .limit(1)
        .get();

      if (snapshot.empty) {
        console.log("Username tidak ditemukan di Firestore");
        // Coba fallback ke localStorage
        return loginUserLocal(identifier, password);
      }

      const userData = snapshot.docs[0].data();
      console.log("Username ditemukan, email:", userData.email);
      userCredential = await auth.signInWithEmailAndPassword(userData.email, password);
    } else {
      console.log("Login dengan email:", email);
      userCredential = await auth.signInWithEmailAndPassword(email, password);
    }

    const user = userCredential.user;
    console.log("Firebase Auth login berhasil:", user.uid);

    console.log("Mengambil profil dari Firestore...");
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

    console.log("Profil user:", userData);
    // Simpan sesi
    setSession(userData);
    return { success: true, message: "Login berhasil!", user: userData };
  } catch (error) {
    console.error("Error login:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    
    let message = error.message;
    if (error.code === "auth/user-not-found") {
      message = "Email tidak terdaftar. Silakan daftar dulu.";
    } else if (error.code === "auth/wrong-password") {
      message = "Password salah.";
    } else if (error.code === "auth/invalid-email") {
      message = "Format email tidak valid.";
    } else if (error.code === "auth/network-request-failed") {
      message = "Koneksi internet bermasalah. Periksa koneksi Anda.";
    } else if (error.code === "auth/too-many-requests") {
      message = "Terlalu banyak percobaan login. Coba lagi dalam beberapa menit.";
    } else if (error.code === "auth/internal-error") {
      message = "Terjadi kesalahan internal Firebase. Coba gunakan mode offline.";
    }
    
    // Fallback ke localStorage jika Firebase gagal
    console.log("Mencoba fallback ke localStorage...");
    return loginUserLocal(identifier, password);
  }
}

/**
 * Login user dengan localStorage (fallback)
 */
function loginUserLocal(identifier, password) {
  console.log("Login localStorage untuk:", identifier);
  
  try {
    const users = getUsers();
    const user = users.find(u => 
      (u.email === identifier || u.username === identifier) && u.password === password
    );
    
    if (!user) {
      const userExists = users.find(u => u.email === identifier || u.username === identifier);
      if (userExists) {
        return { success: false, message: "Password salah (mode offline)." };
      } else {
        return { success: false, message: "User tidak ditemukan (mode offline). Silakan daftar dulu." };
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
    console.log("Login localStorage berhasil");
    return { success: true, message: "Login berhasil (mode offline)!", user: userData };
  } catch (error) {
    console.error("Error localStorage login:", error);
    return { success: false, message: "Gagal login di Firebase dan localStorage." };
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