/**
 * Konfigurasi Firebase untuk Banyuwangi Asyik Berita
 * Database terpusat — semua wartawan melihat artikel yang sama
 */

const firebaseConfig = {
  apiKey: "AIzaSyDyQDldQ9BHgKwfB0qo3AyX6zp7rgnvbJ4",
  authDomain: "banyuwangi-asyik.firebaseapp.com",
  projectId: "banyuwangi-asyik",
  storageBucket: "banyuwangi-asyik.firebasestorage.app",
  messagingSenderId: "970551988685",
  appId: "1:970551988685:web:663377996bde7741e5f484",
  measurementId: "G-7NHSP8ZL3F"
};

// Inisialisasi Firebase dengan error handling
let db, auth, storage;

try {
  if (!firebase.apps.length) {
    console.log("Menginisialisasi Firebase...");
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase berhasil diinisialisasi");
  } else {
    console.log("Firebase sudah terinisialisasi");
  }
  
  db = firebase.firestore();
  auth = firebase.auth();
  storage = firebase.storage();
  
  console.log("Firebase services siap");
} catch (error) {
  console.error("Gagal menginisialisasi Firebase:", error);
  console.log("Sistem akan menggunakan mode offline (localStorage)");
  
  // Dummy objects untuk mencegah error jika Firebase gagal
  db = null;
  auth = null;
  storage = null;
}