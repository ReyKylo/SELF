# SELF — 3-Day Portfolio Sprint

Mulai dari sini. Targetnya tiga proyek latihan yang bisa kamu jelaskan dan pertahankan dalam percakapan recruiter. Tiga hari menghasilkan versi pertama yang teruji, bukan penguasaan PE/VC/consulting atau pengalaman transaksi nyata. Anggaran waktu 6–8 jam per hari; bila Excel/accounting masih baru, selesaikan satu jalur dahulu dan lanjutkan hari berikutnya. Semua model dan memo yang kamu buat harus dilabeli independent portfolio exercise.

## Day 1 — PE: apakah return akuisisi cukup menarik?

**Assignment:** SELF CoffeeCo, perusahaan hipotetis. Semua angka USD juta. Ini latihan buatan SELF, bukan jawaban JoeCo WSP. Buat acquisition model lima tahun lalu putuskan invest/pass pada hurdle 20% IRR, yang merupakan asumsi latihan.

**Data latihan:** tahun 0 revenue 1.000, EBITDA 100. Entry EV 10× EBITDA. Debt baru 500; biaya transaksi 20 dibayar saat entry, tanpa financing fee. Sponsor equity 520. Tidak ada utang lama/kas tambahan; transaksi disederhanakan cash-free/debt-free. Revenue naik 5% setiap tahun; EBITDA margin 10%; D&A 2% revenue; capex 2%; kenaikan NWC 1%; pajak 25% atas EBIT setelah bunga, dibatasi minimum nol. Bunga 8% dari beginning debt. Seluruh FCF positif disapu untuk repayment, maksimum outstanding debt; tidak ada mandatory amortization terpisah, minimum cash, PIK, opsi manajemen, dividend, exit fee atau pajak exit. Exit akhir tahun 5 pada 10× EBITDA. Jika debt habis, akumulasi sisa kas dan tambahkan saat exit.

**Urutan belajar dan build:**

1. 30 menit: baca PE01 dan tulis sumber dana/kebutuhan. Tonton V01 (8:28), lalu bangun assumptions serta entry valuation.
2. 60 menit: V02 (9:16), bangun Sources & Uses dan operating forecast. Jangan membuka finished template sebelum mencoba.
3. 90 menit: PE02 + V03 (16:50). Buat cash tax, capex, ΔNWC, cash available, repayment dan debt roll-forward.
4. 60 menit: V04 (6:59). Hitung exit EV → equity proceeds → MOIC/IRR.
5. 60 menit: buat sensitivitas growth 0/5/10% dan exit multiple 8/10/12×. Tambahkan skenario bunga 10%; nyatakan cash shortfall bila terjadi, jangan menutupnya dengan debt negatif.
6. 60 menit: tulis investment recommendation maksimal dua halaman: keputusan, harga, tiga driver return, downside, kondisi sebelum investasi.
7. Sisa waktu: QA. V05 opsional sesudah model selesai, bukan prasyarat hari pertama. Gunakan bab 32:14 untuk debt dan 46:04 untuk return; baca koreksi penerbit dahulu.

**Formula kunci:** FCF = EBITDA − cash interest − cash tax − capex − ΔNWC. Cash tax = max(0, EBITDA − D&A − interest) × tax rate. Debt repayment = min(beginning debt, max(0, FCF)). MOIC = total sponsor proceeds / entry sponsor equity. Dengan hanya entry/exit, IRR = MOIC^(1/5) − 1; bandingkan dengan IRR atas seri [-520, 0, 0, 0, 0, proceeds]. Gunakan XIRR jika tanggal aktual tidak berjarak sama.

**Answer checks:** tahun 1 revenue 1.050; EBITDA 105; interest 40; tax 11; FCF 22,5; ending debt 477,5. Akhir tahun 5 EBITDA 127,628156; ending debt 343,906710; exit equity 932,374853; MOIC 1,793029×; IRR 12,387353%. Base case berada di bawah hurdle latihan 20%; contoh keputusan: pass pada harga/struktur ini atau negosiasikan harga lebih rendah. Keputusan ini tidak berlaku untuk perusahaan nyata.

**Submit minimum:** workbook dengan assumptions, funding, operations, debt, returns, sensitivities dan checks; memo dua halaman; README sumber dan keterbatasan. Tidak wajib full three-statement, PPA atau DCF pada sprint ini. PE04 adalah cross-check lanjutan sesudah core selesai. Nama file dan halaman boleh sederhana; formula harus dapat diaudit.

## Day 2 — VC: pertumbuhan yang layak dibiayai atau sekadar ramai?

**Assignment:** tulis IC memo dua halaman untuk perusahaan SaaS fiktif SELF OpsCloud. Lampirkan satu halaman KPI, cohort analysis dan simple cap table. Gunakan Shopify/Toast/Twilio/PagerDuty untuk metode; jangan mencampur angka perusahaan tersebut sebagai data OpsCloud.

**Data latihan (fiktif, USD):** cohort A: 100 pelanggan saat akuisisi, ARPA awal $100 per bulan. Di bulan ke-6, 80 masih aktif dan masing-masing membayar $150. Cohort B: 120 awal × $100; bulan ke-6 84 aktif × $120. Cohort C: 150 awal × $100; baru berumur tiga bulan, 120 aktif × $110. Acquisition cost cohort A total $30.000; gross margin subscription 80%. Cash sekarang $1,2 juta, net cash burn stabil $200.000/bulan. Investment offer: invest $2 juta pada $8 juta pre-money; satu kelas ordinary-equivalent shares, tanpa option-pool top-up, preference atau transaction fees untuk latihan. Skenario berikutnya mendilusi investor lama 20%; tidak ada pro-rata. Hypothetical exit equity proceeds pool $100 juta.

**Urutan belajar dan build:**

1. 45 menit: baca VC01 dan VC02; catat claim → evidence → uncertainty dari memo historis, tanpa memakai hasil sukses masa kini sebagai bukti.
2. 60 menit: V06 (23:47). Buat kamus ARR, gross margin, CAC, logo retention, NRR, burn dan runway. Setiap metrik punya periode/denominator.
3. 90 menit: VC04 + V08 (29:23). Buat tabel cohort dan hitung retention; pisahkan expansion dari customer baru. Latihan spreadsheet berasal dari data SELF di atas, bukan dataset resmi YC.
4. 60 menit: hitung simple cap table dan returns. Untuk priced round, post-money = pre-money + dana baru. Ownership masuk = investasi/post-money; setelah dilution = ownership masuk × (1 − dilution).
5. 60 menit: VC03. Tulis staged diligence: apa yang harus terbukti sebelum cek berikutnya? Pisahkan fakta, asumsi dan pertanyaan terbuka. V07 opsional untuk membandingkan consumer versus B2B.
6. 60–90 menit: memo: recommendation; product/buyer; market; traction/economics; competition; terms/returns; risks; tiga diligence gates. Presentasikan lisan dalam lima menit.

**Answer checks:** cohort A logo retention 80%, NRR 120%; B logo retention 70%, NRR 84%. Jangan bandingkan C pada bulan 3 dengan A/B bulan 6 sebagai performa apples-to-apples. CAC A $300; simple initial-gross-profit CAC payback = $300/($100×80%) = 3,75 bulan, mengabaikan churn/expansion/timing dan bukan realized cohort payback. Runway snapshot enam bulan. Ownership investor 20%, lalu 16%; simple exit proceeds $16 juta → 8× gross MOIC. Exit valuation, timing, preference dan taxes belum diverifikasi; hasil tersebut hanya matematika skenario, bukan expected return. Tanpa waktu exit, jangan mengklaim IRR.

**Market sizing exercise:** pilih 3 segmen calon pembeli; definisikan eligible accounts × annual spend. Isi dengan asumsi berlabel dan daftar sumber yang diperlukan; jangan menyebut hasilnya verified TAM. Bedakan TAM, reachable segment dan jumlah pelanggan realistis.

**Submit minimum:** memo dua halaman, spreadsheet KPI/cohorts/cap table, source list, satu halaman diligence questions. Recommendation yang masuk akal boleh “wait for diligence”, karena data latihan belum cukup membuktikan market size, security, competition dan acquisition scalability. Jangan membuat angka tambahan agar memo tampak lengkap.

## Day 3 — Consulting: pulihkan laba dengan rekomendasi terukur

**Assignment:** kedai fiktif SELF Coffee. Diagnosis penurunan laba dan usulkan dua inisiatif prioritas. Output target enam slide berisi cerita keputusan, bukan ringkasan teori. Hari ini kamu yang membuat deck; paket riset ini tidak membuat deck pengganti.

**Data latihan (IDR):** tahun lalu volume 120.000 cups, harga rata-rata Rp30.000, variable cost Rp10.000/cup, fixed operating costs Rp1,5 miliar. Sekarang volume 100.000, harga Rp30.000, variable cost Rp12.000/cup, fixed costs tetap Rp1,5 miliar. Inisiatif A: pengadaan baru menurunkan variable cost Rp1.000/cup dengan one-off implementation Rp50 juta. B: kampanye menambah 10.000 cups/tahun dengan contribution Rp18.000/cup dan biaya kampanye tahunan Rp60 juta. Asumsikan kapasitas tersedia, tanpa cannibalization, tanpa capex baru, dan dampak ramp-up diabaikan untuk latihan; semua perlu divalidasi sebelum rekomendasi nyata.

**Urutan belajar dan build:**

1. 45 menit: baca CO01 dan CO02. Tulis objective, time horizon, constraints dan issue tree yang spesifik.
2. 60 menit: V09 (30:59). Pause 00:47; kerjakan struktur sendiri. Lanjut ke reasoning 01:21, follow-up 16:20 dan kritik 24:54/27:23. Coaching video bukan template jawaban yang harus sama.
3. 90 menit: hitung profit bridge menggunakan volume effect pada margin lama dan cost effect pada volume sekarang. Buat table driver → impact → evidence required.
4. 60 menit: hitung initiative economics, recurring versus one-off benefit dan payback. Baca CO04 agar tidak menghitung baseline sebagai uplift.
5. 90 menit: bangun enam slide: recommendation; problem/bridge; root-cause hypotheses; initiatives economics; 90-day plan/owners; risks and decision gates. Judul slide berupa kesimpulan yang didukung exhibit.
6. 45 menit: baca CO03 dan berikan recommendation 60 detik: pilih tindakan → dua alasan kuantitatif → risiko → next step.

**Answer checks:** laba tahun lalu Rp900 juta, kini Rp300 juta, turun Rp600 juta. Volume effect = −20.000 × Rp20.000 = −Rp400 juta; cost effect = 100.000 × (−Rp2.000) = −Rp200 juta. Total cocok. A recurring benefit Rp100 juta/tahun; year-one net benefit Rp50 juta; simple payback enam bulan jika saving merata. B annual net benefit Rp120 juta. Jika A juga berlaku pada 10.000 cups tambahan B, ada interaction +Rp10 juta/tahun: combined recurring benefit Rp230 juta; setelah one-off A, first-year uplift Rp180 juta. Tanpa interaction, hasil berbeda; jelaskan konvensi. Jangan jumlahkan dua estimasi tanpa mengecek overlap.

**Official-case mini-checks:** Bain first-year recovery 204.675 cups benar dengan input yang ditampilkan, tetapi pangsa pasar memerlukan denominator yang konsisten. Electro-Light membutuhkan 400 juta botol untuk menutup fixed costs pada contribution $0,10; profit impact harga dan volume harus diuji bersamaan.

**Submit minimum:** enam slide, workbook perhitungan, assumptions/source log dan script recommendation 60 detik. Bedakan fakta kasus, hipotesis akar masalah dan rekomendasi. Data volume/biaya saja belum membuktikan penyebab churn pelanggan atau supplier inflation.

## Final review sebelum dibawa ke recruiter

Bisa dibuka, rumus tidak error, satuan konsisten, source dates tercatat, input berbeda warna dari formula, dan angka utama memo/slides cocok dengan model. Tulis peranmu sendiri dan status latihan. Sertakan apa yang mengubah keputusanmu, data yang belum ada, dan satu kesalahan yang kamu temukan lewat QA. Jangan mengaku mengerjakan deal nyata atau project klien firma sumber.
