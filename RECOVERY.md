# Rencana Pemulihan Sistem E-Voting

## Tujuan
Dokumen ini menjelaskan langkah-langkah yang harus dilakukan jika sistem mengalami gangguan teknis, serangan, atau kegagalan operasional.

## 1. Cek Status API
- [ ] Apakah endpoint bisa diakses?
- [ ] Periksa log error di Vercel atau server log.
- [ ] Restart server jika perlu.

## 2. Cek Koneksi ke Smart Contract
- [ ] Pastikan jaringan Sepolia aktif.
- [ ] Verifikasi kontrak masih tersedia di alamat yang sama.
- [ ] Cek transaksi terakhir melalui Etherscan.

## 3. Cek Data Cloudinary
- [ ] Validasi URL gambar kandidat yang disimpan di Cloudinary.
- [ ] Akses URL secara langsung di browser untuk memastikan gambar masih tersedia dan dapat ditampilkan.
- [ ] Verifikasi bahwa gambar telah di-upload ke folder atau path yang benar sesuai struktur aplikasi.

## 4. Jika Kontrak Bermasalah
- [ ] Deploy ulang smart contract dengan logika yang sama atau diperbaiki.
- [ ] Update alamat kontrak di backend API.
- [ ] Backup data hasil voting sebelumnya jika diperlukan.

## 5. Keamanan Kunci
- [ ] Jangan menyimpan PRIVATE_KEY dalam kode.
- [ ] Gunakan environment variables atau secret manager.
- [ ] Ganti kunci jika terindikasi bocor.

## 6. Serangan atau Spam API
- [ ] Aktifkan rate limiting (`express-rate-limit`).
- [ ] Gunakan middleware validasi input.
- [ ] Pantau trafik dengan alat Vercel Logging.

## 7. Rencana Darurat
- [ ] Siapkan `endVoting()` jika proses tidak dapat dihentikan normal.
- [ ] Beri opsi pemungutan ulang jika terjadi kesalahan sistem.
- [ ] Dokumentasikan insiden sebagai bagian dari audit internal.
