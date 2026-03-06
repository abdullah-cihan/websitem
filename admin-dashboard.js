
// ===============================================
// ADMIN DASHBOARD & ANALYTICS MODULE
// ===============================================

// ===============================================
// ADMIN DASHBOARD & ANALYTICS MODULE
// ===============================================

const AdminDashboard = {
    // Dashboard verilerini çek
    init: async () => {
        console.log("Dashboard yükleniyor...");
        if (!window.AdminCore) {
            console.warn("API Core Library tanımlanmamış! Lütfen admin-dashboard.js veya global scope'da API_URL belirtin.");
            return;
        }

        try {
            // "Loading" durumu
            document.getElementById('total-posts-count').textContent = "...";
            document.getElementById('total-cats-count').textContent = "...";

            // API İsteği
            const result = await window.AdminCore.fetchAPI('dashboard');

            if (result.ok && result.stats) {
                AdminDashboard.renderStats(result.stats);
                AdminDashboard.renderCharts(result.stats);
            } else {
                console.error("Dashboard verisi alınamadı:", result.error);
                window.showToast("Analiz verileri alınamadı", "error");
            }

        } catch (error) {
            console.error("Dashboard hatası:", error);
            // window.showToast("Bağlantı hatası", "error");
        }
    },

    // İstatistik Kartlarını Güncelle
    renderStats: (stats) => {
        // Animasyonlu sayı artışı efekti (Basit)
        document.getElementById('total-posts-count').textContent = stats.totalPosts || 0;
        document.getElementById('total-cats-count').textContent = Object.keys(stats.categoryMap || {}).length || 0;
    },

    // Grafikleri Çiz (Chart.js)
    renderCharts: (stats) => {
        // Renk Paleti (Modern)
        const colors = {
            blue: 'rgba(59, 130, 246, 0.7)',
            purple: 'rgba(139, 92, 246, 0.7)',
            green: 'rgba(16, 185, 129, 0.7)',
            red: 'rgba(239, 68, 68, 0.7)',
            orange: 'rgba(249, 115, 22, 0.7)',
            border: 'rgba(255, 255, 255, 0.1)',
            text: '#94a3b8'
        };

        // 1. KATEGORİ DAĞILIMI (Pasta Grafik - Doughnut)
        const ctxCat = document.getElementById('categoryChart').getContext('2d');
        if (window.catChartInstance) window.catChartInstance.destroy(); // Öncekini temizle

        const catLabels = Object.keys(stats.categoryMap);
        const catData = Object.values(stats.categoryMap);

        window.catChartInstance = new Chart(ctxCat, {
            type: 'doughnut',
            data: {
                labels: catLabels,
                datasets: [{
                    data: catData,
                    backgroundColor: [colors.blue, colors.purple, colors.green, colors.red, colors.orange],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { color: colors.text } },
                    title: { display: true, text: 'Kategori Dağılımı', color: '#fff' }
                }
            }
        });

        // 2. AYLIK YAZI GRAFİĞİ (Çizgi Grafik - Line)
        const ctxTime = document.getElementById('timelineChart').getContext('2d');
        if (window.timeChartInstance) window.timeChartInstance.destroy();

        // Veriyi sırala (Ay Yıl stringini kabaca sıralamak gerekebilir, şimdilik olduğu gibi alıyoruz)
        const timeLabels = Object.keys(stats.monthlyCounts);
        const timeData = Object.values(stats.monthlyCounts);

        window.timeChartInstance = new Chart(ctxTime, {
            type: 'line',
            data: {
                labels: timeLabels,
                datasets: [{
                    label: 'Yazı Sayısı',
                    data: timeData,
                    borderColor: colors.blue,
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: colors.border },
                        ticks: { color: colors.text }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: colors.text }
                    }
                },
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: `Yazı Periyodu (${new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })})`,
                        color: '#fff'
                    }
                }
            }
        });
    }
};

// Sayfa yüklendiğinde Dashboard başlatılsın (Eğer o an aktif sekme ise)
document.addEventListener('DOMContentLoaded', () => {
    // Admin.js'deki showSection fonksiyonu tetiklendiğinde burası çalışmalı.
    // Ancak basitlik adına, admin.js dashboard'a geçişte AdminDashboard.init()'i çağıracak şekilde güncellenebilir.
    // Şimdilik sadece yüklenince bir deneyelim.
    if (document.getElementById('dashboard').classList.contains('active')) {
        AdminDashboard.init();
    }
});
