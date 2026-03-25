/* ═══════════════════════════════════════
   TRADELOG — APP UI CONTROLLER
═══════════════════════════════════════ */

/* ── SIDEBAR COLLAPSE ── */
const sidebar    = document.getElementById('sidebar');
const collapseBtn= document.getElementById('collapseBtn');

if (collapseBtn) {
  collapseBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    localStorage.setItem('sidebar_collapsed', sidebar.classList.contains('collapsed'));
  });
}

/* Restore sidebar state */
if (sidebar && localStorage.getItem('sidebar_collapsed') === 'true') {
  sidebar.classList.add('collapsed');
}

/* ── MODAL HELPERS ── */
function openModal(id)  { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

/* Close modal on overlay click */
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

/* Close on Escape */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
    closeDrawer();
  }
});

/* ── DRAWER ── */
function openTradeDrawer(idOrSymbol) {
  const drawer  = document.getElementById('tradeDrawer');
  const overlay = document.getElementById('drawerOverlay');
  const titleEl = document.getElementById('drawerTitle');
  const bodyEl  = document.getElementById('drawerBody');

  if (!drawer) return;

  /* Find trade */
  const trades = TradesDB?.getAll() || [];
  const trade  = trades.find(t => t.id === idOrSymbol || t.symbol === idOrSymbol);

  if (titleEl) {
    titleEl.textContent = trade ? `${trade.symbol} — Trade Detail` : idOrSymbol;
  }

  if (bodyEl && trade) {
    const pnl    = TradesDB.calcPnL(trade);
    const r      = TradesDB.calcR(trade);
    const pct    = TradesDB.calcPct(trade);
    const result = TradesDB.getResult(trade);

    const pnlColor = pnl > 0 ? 'var(--clr-profit)' : pnl < 0 ? 'var(--clr-loss)' : 'var(--clr-text-muted)';
    const pnlSign  = pnl > 0 ? '+' : '';

    bodyEl.innerHTML = `
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px">
        <span class="badge ${result === 'win' ? 'badge-profit' : result === 'loss' ? 'badge-loss' : 'badge-neutral'}">
          ${result.toUpperCase()}
        </span>
        <span class="badge ${trade.direction === 'long' ? 'badge-profit' : 'badge-loss'}">
          ${trade.direction === 'long' ? '▲ LONG' : '▼ SHORT'}
        </span>
        <span class="badge badge-neutral">${trade.asset}</span>
        ${trade.strategy ? `<span class="badge badge-accent">${trade.strategy}</span>` : ''}
      </div>

      <!-- P&L Hero -->
      <div style="background:var(--clr-bg-elevated);border:1px solid var(--clr-border);border-radius:var(--r-lg);padding:20px;text-align:center;margin-bottom:20px">
        <div style="font-size:var(--fs-3xl);font-weight:800;font-family:var(--font-mono);color:${pnlColor}">
          ${pnl !== null ? pnlSign + '$' + Math.abs(pnl).toFixed(2) : '—'}
        </div>
        <div style="font-size:var(--fs-sm);color:var(--clr-text-muted);margin-top:4px">
          ${r !== null ? (r > 0 ? '+' : '') + r + 'R' : ''}
          ${pct !== null ? ' · ' + (pct > 0 ? '+' : '') + pct + '%' : ''}
        </div>
      </div>

      <!-- Trade Info -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
        ${infoBox('Entry', '$' + trade.entryPrice)}
        ${infoBox('Exit', trade.exitPrice ? '$' + trade.exitPrice : 'Open')}
        ${infoBox('Stop Loss', trade.stopLoss ? '$' + trade.stopLoss : '—')}
        ${infoBox('Size', trade.size + ' shares')}
        ${infoBox('Entry Date', trade.entryDate)}
        ${infoBox('Exit Date', trade.exitDate || 'Open')}
      </div>

      ${trade.notes ? `
      <div style="background:var(--clr-bg-elevated);border:1px solid var(--clr-border);border-radius:var(--r-lg);padding:16px;margin-bottom:20px">
        <div style="font-size:var(--fs-xs);font-weight:600;color:var(--clr-text-muted);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px">Notes</div>
        <p style="font-size:var(--fs-sm);color:var(--clr-text-secondary);line-height:1.7">${trade.notes}</p>
      </div>` : ''}

      ${trade.tags?.length ? `
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:20px">
        ${trade.tags.map(tag => `<span class="badge badge-accent">${tag}</span>`).join('')}
      </div>` : ''}

      ${trade.emotion ? `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:20px;padding:12px;background:var(--clr-bg-elevated);border-radius:var(--r-md)">
        <span style="font-size:1.4rem">${trade.emotion.split(' ')[0]}</span>
        <span style="font-size:var(--fs-sm);color:var(--clr-text-secondary)">${trade.emotion}</span>
      </div>` : ''}

      <div style="display:flex;gap:8px;margin-top:24px">
        <button class="btn btn-secondary w-full" onclick="editTrade('${trade.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Edit
        </button>
        <button class="btn btn-loss" onclick="deleteTrade('${trade.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14H6L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/>
          </svg>
        </button>
      </div>
    `;
  }

  drawer.classList.add('open');
  if (overlay) overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function infoBox(label, value) {
  return `
    <div style="background:var(--clr-bg-elevated);border-radius:var(--r-md);padding:12px;border:1px solid var(--clr-border)">
      <div style="font-size:var(--fs-xs);color:var(--clr-text-muted);margin-bottom:4px">${label}</div>
      <div style="font-size:var(--fs-sm);font-weight:600;font-family:var(--font-mono)">${value}</div>
    </div>
  `;
}

function closeDrawer() {
  document.getElementById('tradeDrawer')?.classList.remove('open');
  document.getElementById('drawerOverlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

/* ── TOAST ── */
function showToast(type, title, message, duration = 3500) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
    error:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    info:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || icons.info}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      ${message ? `<div class="toast-msg">${message}</div>` : ''}
    </div>
    <button onclick="this.parentElement.remove()" style="background:none;border:none;color:var(--clr-text-muted);cursor:pointer;padding:4px;font-size:16px;line-height:1">✕</button>
  `;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

/* ── TABS ── */
function switchTab(btn, group) {
  const parent = btn.closest('.tabs');
  if (!parent) return;
  parent.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
}

/* ── TAGS ── */
function addTag(e, input) {
  if (e.key === 'Enter' && input.value.trim()) {
    e.preventDefault();
    const val  = input.value.trim().toLowerCase().replace(/\s+/g, '-');
    const wrap = input.closest('.tags-input-wrap') || document.getElementById('tagsWrap');
    const tag  = document.createElement('span');
    tag.className = 'tag-item';
    tag.innerHTML = `${val} <span class="tag-remove" onclick="removeTag(this)">×</span>`;
    wrap.insertBefore(tag, input);
    input.value = '';
  }
}

function removeTag(btn) {
  btn.closest('.tag-item')?.remove();
}

/* ── SAVE TRADE (journal.html) ── */
function saveTrade() {
  const direction = document.querySelector('input[name="dir2"]:checked')?.value || 'long';
  const symbol    = document.getElementById('jSymbol')?.value.trim().toUpperCase();
  const asset     = document.getElementById('jAsset')?.value;
  const entry     = parseFloat(document.getElementById('jEntry')?.value);
  const exit      = parseFloat(document.getElementById('jExit')?.value) || null;
  const size      = parseFloat(document.getElementById('jSize')?.value);
  const stop      = parseFloat(document.getElementById('jStop')?.value) || null;
  const entryDate = document.getElementById('jEntryDate')?.value;
  const exitDate  = document.getElementById('jExitDate')?.value || null;
  const strategy  = document.getElementById('jStrategy')?.value || '';
  const emotion   = document.getElementById('jEmotion')?.value || '';
  const notes     = document.getElementById('jNotes')?.value || '';

  /* Validation */
  if (!symbol) return showToast('error', 'Symbol required', 'Please enter a trading symbol.');
  if (!entry || isNaN(entry)) return showToast('error', 'Entry price required', 'Please enter a valid entry price.');
  if (!size  || isNaN(size))  return showToast('error', 'Size required', 'Please enter position size.');
  if (!entryDate) return showToast('error', 'Entry date required', 'Please select an entry date.');

  const trade = {
    symbol, asset, direction, strategy, emotion, notes, tags: [],
    entryPrice: entry, exitPrice: exit, stopLoss: stop, size,
    entryDate, exitDate,
    status: exit ? 'closed' : 'open',
    quality: 3
  };

  TradesDB.add(trade);
  closeModal('addTradeModal');
  showToast('success', 'Trade saved!', `${symbol} trade has been added to your journal.`);

  /* Refresh table if on journal page */
  if (typeof renderTradesTable === 'function') renderTradesTable();
}

/* ── DELETE TRADE ── */
function deleteTrade(id) {
  if (!confirm('Delete this trade? This cannot be undone.')) return;
  TradesDB.remove(id);
  closeDrawer();
  showToast('info', 'Trade deleted', 'The trade has been removed from your journal.');
  if (typeof renderTradesTable === 'function') renderTradesTable();
}

/* ── EDIT TRADE ── */
function editTrade(id) {
  showToast('info', 'Edit mode', 'Edit functionality coming soon.');
}

/* ── RATING STARS ── */
document.querySelectorAll('.rating-input').forEach(container => {
  const stars = container.querySelectorAll('.rating-star');
  stars.forEach((star, idx) => {
    star.addEventListener('click', () => {
      const val = parseInt(star.dataset.val);
      stars.forEach((s, i) => {
        s.classList.toggle('active', i < val);
      });
      container.dataset.value = val;
    });
  });
});

/* ── RENDER TRADES TABLE (journal.html) ── */
function renderTradesTable(filtersOverride = {}) {
  const tbody = document.getElementById('tradesBody');
  const emptyState = document.getElementById('emptyState');
  if (!tbody) return;

  const allTrades = TradesDB.getAll();
  const filtered  = TradesDB.filter(allTrades, filtersOverride);

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    if (emptyState) emptyState.style.display = 'flex';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  tbody.innerHTML = filtered.map(trade => {
    const pnl    = TradesDB.calcPnL(trade);
    const r      = TradesDB.calcR(trade);
    const pct    = TradesDB.calcPct(trade);
    const result = TradesDB.getResult(trade);

    const pnlStr   = pnl !== null ? (pnl >= 0 ? '+' : '') + '$' + Math.abs(pnl).toFixed(2) : '—';
    const pnlColor = pnl > 0 ? 'var(--clr-profit)' : pnl < 0 ? 'var(--clr-loss)' : 'var(--clr-text-muted)';
    const rStr     = r !== null ? (r >= 0 ? '+' : '') + r + 'R' : '—';
    const rColor   = r > 0 ? 'var(--clr-profit)' : r < 0 ? 'var(--clr-loss)' : 'var(--clr-text-muted)';

    const resultBadge = {
      win:  '<span class="badge badge-profit">Win</span>',
      loss: '<span class="badge badge-loss">Loss</span>',
      be:   '<span class="badge badge-neutral">B/E</span>',
      open: '<span class="badge badge-accent">Open</span>'
    }[result] || '';

    const dirBadge = trade.direction === 'long'
      ? '<span class="badge badge-profit">▲ Long</span>'
      : '<span class="badge badge-loss">▼ Short</span>';

    const stars = trade.quality
      ? '★'.repeat(trade.quality) + '☆'.repeat(5 - trade.quality)
      : '—';

    const initials = trade.symbol.slice(0, 2).toUpperCase();

    return `
      <tr onclick="openTradeDrawer('${trade.id}')">
        <td>
          <div class="td-symbol">
            <div class="symbol-icon">${initials}</div>
            <div>
              <div class="td-symbol-name">${trade.symbol}</div>
              <div class="td-symbol-type">${trade.asset}</div>
            </div>
          </div>
        </td>
        <td>${dirBadge}</td>
        <td><span class="badge badge-neutral">${trade.strategy || '—'}</span></td>
        <td class="mono">$${trade.entryPrice}</td>
        <td class="mono">${trade.exitPrice ? '$' + trade.exitPrice : '—'}</td>
        <td class="mono">${trade.size}</td>
        <td class="mono" style="color:var(--clr-loss)">${trade.stopLoss ? '$' + trade.stopLoss : '—'}</td>
        <td class="mono" style="color:${pnlColor};font-weight:600">${pnlStr}</td>
        <td class="mono" style="color:${pnlColor}">${pct !== null ? (pct >= 0 ? '+' : '') + pct + '%' : '—'}</td>
        <td class="mono" style="color:${rColor};font-weight:600">${rStr}</td>
        <td style="color:var(--clr-warning);font-size:12px">${stars}</td>
        <td style="color:var(--clr-text-muted);font-size:var(--fs-sm)">${trade.entryDate}</td>
        <td>${resultBadge}</td>
        <td>
          <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();deleteTrade('${trade.id}')">🗑</button>
        </td>
      </tr>
    `;
  }).join('');
}

/* ── INIT JOURNAL PAGE ── */
if (document.getElementById('tradesBody')) {
  renderTradesTable();

  /* Search */
  document.getElementById('tradeSearch')?.addEventListener('input', e => {
    renderTradesTable({ search: e.target.value });
  });
}
