# E-Voting Blockchain System – Documentation

## 1. Arsitektur Sistem
Sistem ini terdiri dari beberapa komponen utama:
- Smart Contract (Solidity, deploy ke jaringan Sepolia)
- Backend API (Express.js + Ethers.js)
- Cloudinary untuk menyimpan gambar kandidat
- Enkripsi data menggunakan algoritma Keccak-256

## 2. Smart Contract
Kontrak ditulis dalam Solidity, fitur utama:
- Fungsi `createVoting()`, `vote()`, `endVoting()`, `getResults()`
- Penyimpanan kandidat, pemilih, dan hasil voting
- Event untuk log transaksi
- Hanya panitia yang dapat memulai dan mengakhiri voting

## 3. API Backend
### Teknologi:
- Node.js + Express.js
- `ethers.js` untuk komunikasi dengan smart contract
- `multer` untuk upload file gambar
- `dotenv` untuk mengelola konfigurasi sensitif

### Endpoint Utama:
- `POST /api/register`
- `POST /api/login`
- `POST /api/vote`
- `GET /api/results`
- `POST /api/voting/create`
- `PATCH /api/candidate/update/:index`

## 4. Enkripsi dan Keamanan
- Input data sensitif di-hash sebelum dikirim ke blockchain
- Kunci pribadi disimpan di file `.env` (gunakan secret manager di produksi)
- Middleware autentikasi JWT untuk validasi pengguna

## 5. Penyimpanan Gambar
- Gambar kandidat diunggah ke IPFS (atau Cloudinary)
- Hash IPFS disimpan di smart contract untuk transparansi

## 6. Deployment
- Smart contract di-deploy ke Sepolia (via Infura)
- API di-deploy ke Vercel atau VPS
- Gunakan `.env` untuk menyimpan:
  - INFURA_API_KEY
  - PRIVATE_KEY
  - CONTRACT_ADDRESS

## 7. Testing
- Gunakan Postman atau Insomnia untuk uji API
- Gunakan Ganache/Hardhat untuk uji lokal smart contract

## 8. Hak Akses & Peran
- Admin: mengatur voting, tambah kandidat
- Pemilih: hanya dapat memberikan suara
- Developer: tidak memiliki akses ke hasil voting

## 9. Dependensi
- `cloudinary`: `^2.6.0`,
- `dotenv`: `^16.4.7`,
- `ethers`: `^6.13.0`,
- `express`: `^4.21.2`,
- `formidable`: `^3.5.2`,
- `ipfs-http-client`: `^60.0.1`,
- `jsonwebtoken`: `^9.0.2`,
- `multer`: `^1.4.5-lts.2`,
- `slugify`: `^1.6.6`
