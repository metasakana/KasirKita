# WarungPintar — Sistem Kasir & Data Stok Toko Kelontong

## Original Problem Statement
Aplikasi mobile "Sistem Kasir & Data Stok Toko Kelontong" yang ringan, cepat, offline-first
untuk operasional toko kelontong harian. Fitur: manajemen stok CRUD, pencarian & skrining harga
instan, kalkulator kasir & transaksi, laporan penjualan/keuangan dengan ekspor CSV, cetak struk.

## User Choices
- Penyimpanan: 1 HP saja (offline penuh, local storage).
- Keamanan: PIN sederhana untuk masuk.
- Cetak struk belanja: ya (tampilan struk + bisa dibagikan/cetak PDF).
- Ekspor: CSV/Excel.
- Tema: cerah/berani (oranye-kuning) default + neutral + dark mode.

## Architecture
- **Frontend-only, fully offline.** Expo Router + React Native (SDK 54). No backend used for data.
- Local storage via `@/src/utils/storage` (AsyncStorage native / IndexedDB web) = single source of truth.
- State via React Context: `StoreContext` (products, transactions, cart, PIN, storeName),
  `ThemeContext` (terang/gelap/netral), `Toast`.
- Fonts: Space Grotesk (numbers/totals) + Plus Jakarta Sans (UI) loaded via expo-font.
- CSV export: expo-file-system + expo-sharing. Receipt: expo-print (print + share PDF).

## Personas
- Pemilik/penjaga toko kelontong: butuh cek harga & stok instan, hitung kembalian cepat, lihat laba.

## Core Requirements (static)
1. CRUD barang (nama, stok, harga modal, harga jual, kategori) — offline.
2. Pencarian real-time + peringatan stok < 5 (merah).
3. Kasir: keranjang, hitung total, kurangi stok otomatis, uang diterima & kembalian.
4. Laporan harian/mingguan/bulanan: pendapatan kotor, modal (HPP), laba bersih + ekspor CSV.
5. PIN login, cetak/bagikan struk, tema terang/netral/gelap.

## Implemented (2026-06)
- [x] PIN setup & unlock (6 digit, secure storage, shake on error)
- [x] Kasir screen: search, category chips, product grid, low-stock badge, sticky glass cart bar
- [x] Cart modal: qty stepper, remove, subtotal
- [x] Checkout: quick-cash suggestions, uang diterima, kembalian, save (decrements stock)
- [x] Receipt: on-screen struk + Cetak (print) + Bagikan (PDF share)
- [x] Stok screen: search, category filter, list with modal/jual/untung per unit, low-stock tint, FAB, edit/delete
- [x] Product form: add/edit/delete with live profit preview
- [x] Laporan: period toggle, metric cards (kotor/HPP/laba), tx history, CSV export
- [x] Pengaturan: theme (terang/netral/gelap), store name, export products CSV, ganti PIN, reset data
- [x] Seed sample products on first launch

## Backlog / Next
- P1: Diskon per transaksi & pajak opsional
- P1: Barcode scan (butuh dev build, tidak jalan di Expo Go)
- P2: Backup/Restore JSON (user memilih CSV saja untuk MVP)
- P2: Grafik tren penjualan
