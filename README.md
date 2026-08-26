# Banyuwangi Asyik Berita

Portal berita dengan desain internasional (inspirasi BBC, Reuters, CNN) untuk kabupaten Banyuwangi dan sekitarnya.

🌐 **Domain**: [banyuwangi-asyik.com](https://banyuwangi-asyik.com)

## Fitur

- Desain editorial profesional dengan tipografi serif + sans-serif
- Breaking news ticker
- Hero story dengan overlay dramatis
- Filter kategori (Nasional, Daerah, Ekonomi, Olahraga, Politik, Lingkungan)
- Sidebar terpopuler & newsletter
- Halaman artikel lengkap dengan berita terkait
- Pencarian berita real-time
- SEO optimized (meta tags, Open Graph, Twitter Card, sitemap, robots.txt)
- Aksesibilitas (focus styles, ARIA, prefers-reduced-motion)
- Halaman 404 custom
- Responsif (mobile, tablet, desktop)

## Struktur

```
├── index.html          # Halaman beranda
├── article.html        # Template halaman artikel
├── 404.html            # Halaman error 404
├── css/style.css       # Stylesheet utama
├── js/
│   ├── articles.js     # Data & helper artikel
│   └── main.js         # Logika UI
├── robots.txt          # Konfigurasi crawler
├── sitemap.xml         # Sitemap untuk SEO
└── README.md
```

## Menjalankan Lokal

Buka `index.html` langsung di browser, atau gunakan live server:

```bash
npx serve .
```

## Deploy ke GitHub Pages

1. Push semua file ke repository
2. Buka **Settings → Pages**
3. Source: **Deploy from branch** → `main` → `/ (root)`
4. Simpan — situs live di `https://daunggamer-sketch.github.io/banyuwangi-asyikberita.online/`

## Custom Domain

Untuk domain `banyuwangi-asyik.com`:

1. Tambahkan file `CNAME` berisi: `banyuwangi-asyik.com`
2. Atur DNS di registrar domain:
   - `A` record → `76.76.21.21`
   - `CNAME` `www` → `daunggamer-sketch.github.io`

## Lisensi

© 2026 Banyuwangi Asyik Berita