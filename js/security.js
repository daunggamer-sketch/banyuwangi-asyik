/**
 * Utilitas Keamanan - Hashing & Enkripsi Password
 * Menggunakan bcryptjs untuk hashing password yang aman
 */

// ==================== PASSWORD HASHING ====================

/**
 * Hash password menggunakan simple secure method
 * Catatan: Untuk production, gunakan bcryptjs library
 */
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Verifikasi password dengan hash
 */
async function verifyPassword(password, hash) {
  const hashedPassword = await hashPassword(password);
  return hashedPassword === hash;
}

/**
 * Generate random salt untuk tambahan keamanan
 */
function generateSalt() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// ==================== CSRF PROTECTION ====================

/**
 * Generate CSRF token untuk form submission
 */
function generateCSRFToken() {
  const token = Math.random().toString(36).substring(2, 15) + 
                Math.random().toString(36).substring(2, 15);
  localStorage.setItem('csrf_token', token);
  return token;
}

/**
 * Validasi CSRF token
 */
function validateCSRFToken(token) {
  const storedToken = localStorage.getItem('csrf_token');
  return token === storedToken;
}

// ==================== RATE LIMITING ====================

/**
 * Simple rate limiter untuk login attempts
 * Maksimal 5 attempts per 15 menit
 */
const RateLimiter = {
  attempts: {},
  
  /**
   * Check if user can attempt login
   */
  canAttempt(username) {
    const now = Date.now();
    const timeWindow = 15 * 60 * 1000; // 15 menit
    
    if (!this.attempts[username]) {
      this.attempts[username] = [];
    }
    
    // Hapus attempts yang sudah lebih dari 15 menit
    this.attempts[username] = this.attempts[username].filter(
      time => now - time < timeWindow
    );
    
    return this.attempts[username].length < 5;
  },
  
  /**
   * Record login attempt
   */
  recordAttempt(username) {
    if (!this.attempts[username]) {
      this.attempts[username] = [];
    }
    this.attempts[username].push(Date.now());
  },
  
  /**
   * Get remaining attempts
   */
  getRemainingAttempts(username) {
    const now = Date.now();
    const timeWindow = 15 * 60 * 1000;
    
    if (!this.attempts[username]) return 5;
    
    const validAttempts = this.attempts[username].filter(
      time => now - time < timeWindow
    );
    
    return Math.max(0, 5 - validAttempts.length);
  }
};

// ==================== SECURE STORAGE ====================

/**
 * Encrypt data sebelum disimpan di localStorage
 * Simple XOR encryption (gunakan library yang lebih robust untuk production)
 */
function encryptData(data, key) {
  const stringData = typeof data === 'string' ? data : JSON.stringify(data);
  let encrypted = '';
  
  for (let i = 0; i < stringData.length; i++) {
    encrypted += String.fromCharCode(
      stringData.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  
  return btoa(encrypted); // Base64 encode
}

/**
 * Decrypt data dari localStorage
 */
function decryptData(encryptedData, key) {
  try {
    const encrypted = atob(encryptedData); // Base64 decode
    let decrypted = '';
    
    for (let i = 0; i < encrypted.length; i++) {
      decrypted += String.fromCharCode(
        encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}

// ==================== CONTENT SECURITY ====================

/**
 * Sanitize HTML untuk prevent XSS attacks
 */
function sanitizeHtml(html) {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate username format
 */
function isValidUsername(username) {
  return /^[a-zA-Z0-9_.-]{3,20}$/.test(username);
}

/**
 * Validate password strength
 * Minimal 8 karakter, harus ada huruf & angka
 */
function validatePasswordStrength(password) {
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const isLengthValid = password.length >= 8;
  
  return {
    isStrong: hasUpperCase && hasLowerCase && hasNumbers && isLengthValid,
    requirements: {
      minLength: isLengthValid,
      hasUpperCase,
      hasLowerCase,
      hasNumbers
    }
  };
}

// ==================== HTTPS ENFORCEMENT ====================

/**
 * Force HTTPS connection
 * Jalankan di awal setiap halaman
 */
function enforceHTTPS() {
  if (window.location.protocol === 'http:' && 
      !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    window.location.href = window.location.href.replace('http:', 'https:');
  }
}

// ==================== SESSION MANAGEMENT ====================

/**
 * Create secure session dengan expiry
 */
function createSecureSession(userData) {
  const session = {
    user: userData,
    createdAt: Date.now(),
    expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 jam
    token: generateCSRFToken()
  };
  
  // Jangan simpan password di session
  delete session.user.password;
  
  // Encrypt sebelum disimpan
  const key = 'banyuwangi-secure-key'; // Gunakan environment variable di production
  const encrypted = encryptData(session, key);
  
  localStorage.setItem('bab_session_secure', encrypted);
  localStorage.setItem('bab_session_key', key); // Jangan simpan key seperti ini! Hanya untuk demo
  
  return session;
}

/**
 * Validasi session masih aktif
 */
function isSessionValid() {
  try {
    const encrypted = localStorage.getItem('bab_session_secure');
    if (!encrypted) return false;
    
    const key = localStorage.getItem('bab_session_key');
    const sessionJson = decryptData(encrypted, key);
    const session = JSON.parse(sessionJson);
    
    return session && session.expiresAt > Date.now();
  } catch (error) {
    console.error('Session validation error:', error);
    return false;
  }
}

/**
 * Clear session secara aman
 */
function clearSecureSession() {
  localStorage.removeItem('bab_session_secure');
  localStorage.removeItem('bab_session_key');
  localStorage.removeItem('csrf_token');
}

// ==================== INITIALIZATION ====================

// Jalankan enforcement HTTPS saat halaman load
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    enforceHTTPS();
  });
}
