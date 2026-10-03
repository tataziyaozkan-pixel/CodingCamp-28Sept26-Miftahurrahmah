let transactions = JSON.parse(localStorage.getItem('budget_data_v2')) || [];
let myChart = null;

// Set tanggal default hari ini
document.getElementById('date').valueAsDate = new Date();

// Inisialisasi Tema Tersimpan
const savedTheme = localStorage.getItem('theme') || 'light';
document.body.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

function toggleTheme() {
  const currentTheme = document.body.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.body.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon(newTheme);
  renderChart(getCategoryTotals());
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('themeToggle');
  btn.innerText = theme === 'light' ? '🌙' : '☀️';
}

function formatRp(val) {
  return 'Rp ' + Number(val).toLocaleString('id-ID');
}

function getCategoryTotals() {
  const catTotals = {};
  transactions.forEach(t => {
    if (t.type === 'expense') {
      catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
    }
  });
  return catTotals;
}

function render() {
  localStorage.setItem('budget_data_v2', JSON.stringify(transactions));

  const searchKeyword = document.getElementById('searchInput').value.toLowerCase();
  const filterType = document.getElementById('filterType').value;

  let income = 0;
  let expense = 0;
  const catTotals = {};

  transactions.forEach(t => {
    if (t.type === 'income') {
      income += t.amount;
    } else {
      expense += t.amount;
      catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
    }
  });

  document.getElementById('totalBalance').innerText = formatRp(income - expense);
  document.getElementById('totalIncome').innerText = formatRp(income);
  document.getElementById('totalExpense').innerText = formatRp(expense);

  const listEl = document.getElementById('txList');
  listEl.innerHTML = '';

  const filtered = transactions.filter(t => {
    const matchesSearch = t.desc.toLowerCase().includes(searchKeyword);
    const matchesType = filterType === 'all' || t.type === filterType;
    return matchesSearch && matchesType;
  });

  if (filtered.length === 0) {
    listEl.innerHTML = '<li style="justify-content: center; color: var(--text-muted); background: transparent; border: none;">Tidak ada data transaksi.</li>';
  } else {
    filtered.forEach(t => {
      const origIdx = transactions.indexOf(t);
      const li = document.createElement('li');
      li.innerHTML = `
        <div class="tx-info">
          <span class="tx-title">${t.desc}</span>
          <span class="tx-meta">${t.category} • ${t.date}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <span class="tx-amount ${t.type}">
            ${t.type === 'income' ? '+' : '-'}${formatRp(t.amount)}
          </span>
          <button class="btn-del" onclick="deleteTx(${origIdx})">✕</button>
        </div>
      `;
      listEl.appendChild(li);
    });
  }

  renderChart(catTotals);
}

function renderChart(catTotals) {
  const ctx = document.getElementById('categoryChart').getContext('2d');
  const labels = Object.keys(catTotals);
  const data = Object.values(catTotals);
  const isDark = document.body.getAttribute('data-theme') === 'dark';

  if (myChart) myChart.destroy();

  myChart = new Chart(ctx, {
    type: 'doughnut', // Menggunakan Donut Chart agar lebih modern
    data: {
      labels: labels.length ? labels : ['Belum Ada Pengeluaran'],
      datasets: [{
        data: data.length ? data : [1],
        backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899'],
        borderWidth: isDark ? 2 : 1,
        borderColor: isDark ? '#1e293b' : '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          position: 'bottom',
          labels: {
            color: isDark ? '#f8fafc' : '#1e293b',
            boxWidth: 12
          }
        }
      }
    }
  });
}

function exportToCSV() {
  if (transactions.length === 0) {
    alert('Tidak ada data untuk diekspor!');
    return;
  }

  let csvContent = "data:text/csv;charset=utf-8,Deskripsi,Jumlah,Tipe,Kategori,Tanggal\n";
  transactions.forEach(t => {
    csvContent += `"${t.desc}",${t.amount},${t.type},"${t.category}",${t.date}\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "laporan_keuangan.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

document.getElementById('txForm').addEventListener('submit', (e) => {
  e.preventDefault();
  transactions.unshift({
    desc: document.getElementById('desc').value,
    amount: parseFloat(document.getElementById('amount').value),
    type: document.getElementById('type').value,
    category: document.getElementById('category').value,
    date: document.getElementById('date').value
  });
  document.getElementById('desc').value = '';
  document.getElementById('amount').value = '';
  render();
});

function deleteTx(idx) {
  transactions.splice(idx, 1);
  render();
}

function clearData() {
  if (confirm('Hapus seluruh daftar transaksi?')) {
    transactions = [];
    render();
  }
}

render();