# Script Otomatisasi Tempo Network Testnet

## Ringkasan
Script Node.js untuk mengotomatisasi berbagai tugas di Tempo Network Testnet:
- Request dana faucet
- Kirim/terima pembayaran
- Buat stablecoin
- Kelola likuiditas fee
- Tukar token di DEX
- Pasang order DEX

## Konfigurasi
Atur `PRIVATE_KEY` di environment variables (Replit Secrets atau file .env)

## Detail Jaringan
- Chain ID: 42429
- RPC: https://rpc.testnet.tempo.xyz
- Explorer: https://explore.tempo.xyz

## Token Tersedia
- AlphaUSD (0x20c0000000000000000000000000000000000001)
- BetaUSD (0x20c0000000000000000000000000000000000002)
- ThetaUSD (0x20c0000000000000000000000000000000000003)
- PathUSD (0x20c0000000000000000000000000000000000000)

## Cara Penggunaan
```bash
node index.js menu          # Menu interaktif
node index.js faucet        # Request faucet
node index.js balance       # Cek saldo
node index.js send          # Kirim pembayaran
```

## Perubahan Terbaru
- Diperbarui menggunakan SDK resmi tempo.ts
- Semua teks dalam Bahasa Indonesia
- Faucet menggunakan metode bawaan SDK dengan gas sponsorship
