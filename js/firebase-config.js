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

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();