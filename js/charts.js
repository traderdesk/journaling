/* ═══════════════════════════════════════
   TRADELOG — CHARTS ENGINE v2
═══════════════════════════════════════ */

(function () {

  /* ── Wait for Chart.js ── */
  function waitForChartJS(cb, attempts = 0) {
    if (typeof Chart !== 'undefined') {
      cb();
    } else if (attempts < 20) {
      setTimeout(() => waitForChartJS(cb, attempts + 1), 150);
    } else {
      console.error('Chart.js failed to load');
    }
  }

  /* ── Global Chart Defaults ── */
  function setDefaults() {
    Chart.defaults.color           = '#8B90A7';
    Chart.defaults.borderColor     = 'rgba(255,255,255,0.05)';
    Chart.defaults.font.family     = "'Inter', sans-serif";
    Chart.defaults.font.size       = 12;
    Chart.defaults.animation       = { duration: 800, easing: 'easeInOutQuart' };

    Chart.defaults.plugins.legend.display     = false;
    Chart.defaults.plugins.tooltip.enabled    = true;
    Chart.defaults.plugins.tooltip.backgroundColor = '#1A1D27';
    Chart.defaults.plugins.tooltip.borderColor     = 'rgba(108,99,255,0.4)';
    Chart.defaults.plugins.tooltip.borderWidth     = 1;
    Chart.defaults.plugins.tooltip.padding         = 12;
    Chart.defaults.plugins.tooltip.titleColor      = '#F0F2FF';
    Chart.defaults.plugins.tooltip.bodyColor       = '#8B90A7';
    Chart.defaults.plugins.tooltip.cornerRadius    = 10;
    Chart.defaults.plugins.tooltip.displayColors   = false;
  }

  /* ── Destroy existing chart on canvas ── */
  function destroyChart(canvasId) {
    const existing = Chart.getChart(canvasId);
    if (existing) existing.destroy();
  }

  /* ── Fix canvas sizing ── */
  function prepCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    const parent = canvas.parentElement;
    if (parent) {
      const h = parent.style.height || parent.offsetHeight;
      if (!h || h === '0px') {
        parent.style.height = '260px';
      }
      canvas.style.width  = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';
    }
    return canvas;
  }

  /* ══════════════════════════════════════
     EQUITY CURVE CHART
  ══════════════════════════════════════ */
  window.renderEquityChart = function (canvasId, tradesData, period) {
    const canvas = prepCanvas(canvasId);
    if (!canvas) return;
    destroyChart(canvasId);

    /* Use TradesDB or fallback demo data */
    let curve = [];

    if (typeof TradesDB !== 'undefined') {
      let trades = TradesDB.getAll();

      /* Filter by period */
      if (period && period !== 'all') {
        const now  = new Date();
        const days = { '1w': 7, '1m': 30, '3m': 90 };
        const cutoff = new Date(now - (days[period] || 0) * 86400000);
        trades = trades.filter(t => t.exitDate && new Date(t.exitDate) >= cutoff);
      }

      curve = TradesDB.getEquityCurve(trades);
    }

    /* Demo data if empty */
    if (!curve || curve.length === 0) {
      const base   = new Date('2025-01-01');
      const values = [0, 320, 180, 540, 420, 780, 650, 920, 840, 1200, 1050, 1480, 1380, 1720, 1650, 2100, 1980, 2350, 2200, 2680, 2550, 3020, 2900, 3280, 3150, 3620, 3500, 3890, 3780, 4280];
      curve = values.map((v, i) => {
        const d = new Date(base);
        d.setDate(d.getDate() + i);
        return { date: d.toISOString().slice(0, 10), value: v };
      });
    }

    const labels = curve.map(d => {
      const dt = new Date(d.date);
      return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const values = curve.map(d => d.value);
    const isPositive = values[values.length - 1] >= 0;
    const lineColor  = isPositive ? '#6C63FF' : '#FF4D6D';
    const glowColor  = isPositive ? 'rgba(108,99,255,' : 'rgba(255,77,109,';

    new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data: values,
          borderColor: lineColor,
          borderWidth: 2.5,
          fill: true,
          backgroundColor: (ctx) => {
            const chart = ctx.chart;
            const { ctx: c, chartArea } = chart;
            if (!chartArea) return 'transparent';
            const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0,   glowColor + '0.3)');
            gradient.addColorStop(0.5, glowColor + '0.08)');
            gradient.addColorStop(1,   glowColor + '0)');
            return gradient;
          },
          tension: 0.45,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: lineColor,
          pointHoverBorderColor: '#0D0F14',
          pointHoverBorderWidth: 3,
          cubicInterpolationMode: 'monotone'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        layout: { padding: { top: 10, right: 10, bottom: 0, left: 0 } },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: {
              maxTicksLimit: 8,
              maxRotation: 0,
              font: { size: 11 }
            }
          },
          y: {
            position: 'right',
            grid: {
              color: 'rgba(255,255,255,0.04)',
              drawBorder: false
            },
            border: { display: false, dash: [4, 4] },
            ticks: {
              font: { size: 11, family: "'JetBrains Mono', monospace" },
              callback: v => '$' + v.toLocaleString(),
              maxTicksLimit: 6
            }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => items[0].label,
              label: (ctx) => {
                const v = ctx.parsed.y;
                return (v >= 0 ? ' +$' : ' -$') + Math.abs(v).toLocaleString();
              }
            }
          }
        }
      }
    });
  };

  /* ══════════════════════════════════════
     WIN/LOSS DONUT
  ══════════════════════════════════════ */
  window.renderWinLossChart = function (canvasId, tradesData) {
    const canvas = prepCanvas(canvasId);
    if (!canvas) return;
    destroyChart(canvasId);

    let wins = 32, losses = 15, be = 0;

    if (typeof TradesDB !== 'undefined') {
      const stats = TradesDB.getStats(tradesData || TradesDB.getAll());
      wins    = stats.wins;
      losses  = stats.losses;
      be      = stats.closedTrades - stats.wins - stats.losses;
    }

    new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Wins', 'Losses', 'Break Even'],
        datasets: [{
          data: [wins, losses, be],
          backgroundColor: [
            'rgba(0,212,170,0.85)',
            'rgba(255,77,109,0.85)',
            'rgba(136,136,170,0.4)'
          ],
          borderColor: '#13161E',
          borderWidth: 4,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        layout: { padding: 10 },
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              padding: 16,
              usePointStyle: true,
              pointStyleWidth: 8,
              font: { size: 12 },
              color: '#8B90A7'
            }
          },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.label}: ${ctx.parsed} trades`
            }
          }
        }
      }
    });
  };

  /* ══════════════════════════════════════
     MONTHLY P&L BAR
  ══════════════════════════════════════ */
  window.renderMonthlyChart = function (canvasId, tradesData) {
    const canvas = prepCanvas(canvasId);
    if (!canvas) return;
    destroyChart(canvasId);

    /* Demo monthly data */
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const values = [1240, -320, 890, 2100, -180, 1650];

    if (typeof TradesDB !== 'undefined') {
      const trades = tradesData || TradesDB.getAll();
      const closed = trades.filter(t => t.status === 'closed' && t.exitDate);
      if (closed.length > 0) {
        const monthly = {};
        closed.forEach(t => {
          const m = t.exitDate.slice(0, 7);
          if (!monthly[m]) monthly[m] = 0;
          monthly[m] += TradesDB.calcPnL(t) || 0;
        });
        const keys = Object.keys(monthly).sort();
        if (keys.length > 0) {
          labels.length = 0;
          values.length = 0;
          keys.forEach(k => {
            const d = new Date(k + '-01');
            labels.push(d.toLocaleDateString('en-US', { month: 'short' }));
            values.push(+monthly[k].toFixed(2));
          });
        }
      }
    }

    new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: values.map(v =>
            v >= 0 ? 'rgba(0,212,170,0.7)' : 'rgba(255,77,109,0.7)'
          ),
          borderColor: values.map(v =>
            v >= 0 ? '#00D4AA' : '#FF4D6D'
          ),
          borderWidth: 1.5,
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 10 } },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { font: { size: 11 } }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            border: { display: false },
            ticks: {
              font: { size: 11, family: "'JetBrains Mono', monospace" },
              callback: v => '$' + v.toLocaleString(),
              maxTicksLimit: 5
            }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => {
                const v = ctx.parsed.y;
                return (v >= 0 ? ' +$' : ' -$') + Math.abs(v).toFixed(2);
              }
            }
          }
        }
      }
    });
  };

  /* ══════════════════════════════════════
     STRATEGY PIE
  ══════════════════════════════════════ */
  window.renderStrategyChart = function (canvasId, tradesData) {
    const canvas = prepCanvas(canvasId);
    if (!canvas) return;
    destroyChart(canvasId);

    let labels = ['Breakout', 'Trend', 'Momentum', 'Swing', 'Reversion'];
    let values = [3240, 2100, 1580, 890, 740];

    if (typeof TradesDB !== 'undefined') {
      const stats = TradesDB.getStrategyStats(tradesData || TradesDB.getAll());
      if (stats.length > 0) {
        labels = stats.map(s => s.name);
        values = stats.map(s => Math.abs(s.pnl));
      }
    }

    const COLORS = ['#6C63FF', '#00D4AA', '#FFB347', '#FF4D6D', '#4DACFF', '#9B8FFF', '#FF8C69'];

    new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: COLORS.slice(0, labels.length),
          borderColor: '#13161E',
          borderWidth: 3,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '55%',
        layout: { padding: 10 },
        plugins: {
          legend: {
            display: true,
            position: 'right',
            labels: {
              padding: 12,
              usePointStyle: true,
              pointStyleWidth: 8,
              font: { size: 11 },
              color: '#8B90A7'
            }
          }
        }
      }
    });
  };

  /* ══════════════════════════════════════
     AUTO-INIT
  ══════════════════════════════════════ */
  function initCharts() {
    /* Give DOM time to paint */
    requestAnimationFrame(() => {
      setTimeout(() => {
        renderEquityChart('equityChart', null, 'all');
        renderWinLossChart('winLossChart', null);
        renderMonthlyChart('monthlyChart', null);
        renderStrategyChart('strategyChart', null);
      }, 100);
    });
  }

  /* ── Tab switching for equity chart ── */
  window.switchEquityPeriod = function (btn, period) {
    const parent = btn.closest('.tabs');
    if (parent) {
      parent.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
    }
    renderEquityChart('equityChart', null, period);
  };

  /* ── Init on DOM ready ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => waitForChartJS(initCharts));
  } else {
    waitForChartJS(initCharts);
  }

})();