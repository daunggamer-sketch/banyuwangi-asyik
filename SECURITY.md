# Security Policy

## Reporting Security Vulnerabilities

Jika Anda menemukan kerentanan keamanan di Banyuwangi Asyik Berita, silakan hubungi kami melalui:

**Email:** bwiasyik@gmail.com  
**WhatsApp:** +62 852-1303-7381

Tolong sertakan:
- Deskripsi kerentanan
- Langkah-langkah reproduksi
- Dampak potensial
- Saran perbaikan (jika ada)

## Fitur Keamanan

Aplikasi ini menerapkan langkah-langkah keamanan berikut:

### Security Headers
- **HSTS** (HTTP Strict-Transport-Security) - 1 tahun
- **X-Frame-Options** - Mencegah clickjacking
- **X-Content-Type-Options** - Mencegah MIME type sniffing
- **Content-Security-Policy** - Membatasi loading resources
- **Referrer-Policy** - Melindungi privasi user
- **Permissions-Policy** - Batasi API berbahaya

### Authentication & Authorization
- Password minimal 8 karakter
- Validasi input di client dan server
- Session management yang aman
- Protection terhadap XSS dan CSRF

### Data Protection
- HTTPS/TLS enforcement (via GitHub Pages)
- Secure cookies configuration
- No hardcoded secrets di codebase
- Encrypted credential storage

### Code Quality
- Input sanitization
- Output encoding
- Regular security audits
- Dependency monitoring

## Production Checklist

Sebelum deploy ke production:

- [x] HTTPS enabled (GitHub Pages automatic)
- [x] Security headers configured
- [x] Content Security Policy tested
- [x] Input validation active
- [x] Output encoding implemented
- [x] No hardcoded secrets
- [x] Logging dan monitoring ready
- [x] Backup strategy planned
- [x] Disaster recovery ready

## Hosting & Domain

### ✅ RECOMMENDED (AMAN)
- **URL:** https://daunggamer-sketch.github.io/banyuwangi-asyik
- **Benefit:** GitHub Pages automatic SSL/TLS, no configuration needed
- **Status:** HTTPS ✓

### ⚠️ CUSTOM DOMAIN (REQUIRES SETUP)
- **URL:** https://banyuwangi-asyik.com (atau domain custom lainnya)
- **Required:** Valid SSL/TLS certificate (Let's Encrypt gratis)
- **Setup:** 
  1. Update DNS records ke GitHub Pages IP
  2. Enable HTTPS di GitHub repository settings
  3. Wait 24 hours untuk propagation
  4. Remove/update CNAME jika needed

## Third-party Dependencies

### Frontend
- Firebase SDK (v8+) - Authentication & Database
- Google Fonts - Typography
- Chart.js (optional) - Analytics

### Security Monitoring
- OWASP dependency checking
- Regular security audits
- Penetration testing schedule

## Update Frequency

- Firebase SDK: Monthly checks
- Google Fonts: Auto-updated
- Security headers: Monitored daily
- Dependency vulnerabilities: Real-time alerts via Dependabot

## Contact

**Untuk pertanyaan keamanan umum:**  
bwiasyik@gmail.com

**Untuk emergency:**  
WhatsApp +62 852-1303-7381

---

Last Updated: September 3, 2026
Version: 1.0.1-security
