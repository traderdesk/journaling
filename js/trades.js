/* ═══════════════════════════════════════
   TRADELOG — TRADES DATA MANAGER
   Handles all trade CRUD + localStorage
═══════════════════════════════════════ */

const TradesDB = (() => {

  const KEY = 'tradelog_trades';

  /* ── SAMPLE DATA (first load) ── */
  const sampleTrades = [
    {
      id: 'T001',
      symbol: 'AAPL',
      asset: 'Equity',
      direction: 'long',
      strategy: 'Breakout',
      entryPrice: 182.40,
      exitPrice: 188.75,
      stopLoss: 179.80,
      size: 50,
      entryDate: '2025-06-12',
      exitDate: '2025-06-12',
      emotion: '😤 Disciplined',
      notes: 'Clean breakout above daily resistance. Strong volume. Entered on retest.',
      tags: ['breakout', 'gap-up'],
      quality: 4,
      status: 'closed'
    },
    {
      id: 'T002',
      symbol: 'TSLA',
      asset: 'Equity',
      direction: 'short',
      strategy: 'Trend Following',
      entryPrice: 248.20,
      exitPrice: 255.80,
      stopLoss: 253.40,
      size: 20,
      entryDate: '2025-06-11',
      exitDate: '2025-06-11',
      emotion: '😰 Anxious',
      notes: 'Shorted into resistance but got stopped out. Did not follow plan.',
      tags: ['reversal'],
      quality: 2,
      status: 'closed'
    },
    {
      id: 'T003',
      symbol: 'SPY',
      asset: 'ETF',
      direction: 'long',
      strategy: 'Momentum',
      entryPrice: 441.50,
      exitPrice: 448.20,
      stopLoss: 438.20,
      size: 30,
      entryDate: '2025-06-10',
      exitDate: '2025-06-10',
      emotion: '😌 Calm',
      notes: 'Momentum continuation trade. Clean setup, followed the plan.',
      tags: ['momentum', 'trend'],
      quality: 5,
      status: 'closed'
    },
    {
      id: 'T004',
      symbol: 'NVDA',
      asset: 'Equity',
      direction: 'long',
      strategy: 'Breakout',
      entryPrice: 892.30,
      exitPrice: 921.70,
      stopLoss: 881.80,
      size: 10,
      entryDate: '2025-06-09',
      exitDate: '2025-06-09',
      emotion: '😤 Disciplined',
      notes: 'AI sector momentum. Strong earnings catalyst. Perfect setup.',
      tags: ['breakout', 'earnings'],
      quality: 5,
      status: 'closed'
    },
    {
      id: 'T005',
      symbol: 'QQQ',
      asset: 'ETF',
      direction: 'short',
      strategy: 'Mean Reversion',
      entryPrice: 378.90,
      exitPrice: 380.10,
      stopLoss: 381.50,
      size: 25,
      entryDate: '2025-06-09',
      exitDate: '2025-06-09',
      emotion: '😡 Revenge Trade',
      notes: 'Revenge trade after TSLA loss. Should not have taken this.',
      tags: ['revenge', 'mistake'],
      quality: 1,
      status: 'closed'
    },
    {
      id: 'T006',
      symbol: 'MSFT',
      asset: 'Equity',
      direction: 'long',
      strategy: 'Swing Trade',
      entryPrice: 415.60,
      exitPrice: null,
      stopLoss: 408.00,
      size: 15,
      entryDate: '2025-06-13',
      exitDate: null,
      emotion: '😌 Calm',
      notes: 'Swing trade, holding overnight. Cloud segment strong.',
      tags: ['swing', 'cloud'],
      quality: 4,
      status: 'open'
    }
  ];

  /* ── INIT ── */
  function init() {
    if (!localStorage.getItem(KEY)) {
      localStorage.setItem(KEY, JSON.stringify(sampleTrades));
    }
  }

  /* ── GET ALL ── */
  function getAll() {
    init();
    return JSON.parse(localStorage.getItem(KEY)) || [];
  }

  /* ── GET BY ID ── */
  function getById(id) {
    return getAll().find(t => t.id === id) || null;
  }

  /* ── ADD ── */
  function add(trade) {
    const trades = getAll();
    trade.id = 'T' + Date.now();
    trades.unshift(trade);
    localStorage.setItem(KEY, JSON.stringify(trades));
    return trade;
  }

  /* ── UPDATE ── */
  function update(id, data) {
    const trades = getAll();
    const idx = trades.findIndex(t => t.id === id);
    if (idx === -1) return null;
    trades[idx] = { ...trades[idx], ...data };
    localStorage.setItem(KEY, JSON.stringify(trades));
    return trades[idx];
  }

  /* ── DELETE ── */
  function remove(id) {
    const trades = getAll().filter(t => t.id !== id);
    localStorage.setItem(KEY, JSON.stringify(trades));
  }

  /* ── CALCULATE P&L ── */
  function calcPnL(trade) {
    if (!trade.exitPrice || !trade.entryPrice || !trade.size) return null;
    const diff = trade.direction === 'long'
      ? trade.exitPrice - trade.entryPrice
      : trade.entryPrice - trade.exitPrice;
    return +(diff * trade.size).toFixed(2);
  }

  /* ── CALCULATE R MULTIPLE ── */
  function calcR(trade) {
    if (!trade.stopLoss || !trade.exitPrice) return null;
    const risk = Math.abs(trade.entryPrice - trade.stopLoss);
    if (risk === 0) return null;
    const pnl = calcPnL(trade);
    return +(pnl / (risk * trade.size)).toFixed(2);
  }

  /* ── CALCULATE % RETURN ── */
  function calcPct(trade) {
    if (!trade.exitPrice) return null;
    const diff = trade.direction === 'long'
      ? trade.exitPrice - trade.entryPrice
      : trade.entryPrice - trade.exitPrice;
    return +((diff / trade.entryPrice) * 100).toFixed(2);
  }

  /* ── GET RESULT ── */
  function getResult(trade) {
    const pnl = calcPnL(trade);
    if (pnl === null || trade.status === 'open') return 'open';
    if (pnl > 0)  return 'win';
    if (pnl < 0)  return 'loss';
    return 'be';
  }

  /* ── STATS ── */
  function getStats(trades) {
    const closed = trades.filter(t => t.status === 'closed' && calcPnL(t) !== null);
    const wins   = closed.filter(t => calcPnL(t) > 0);
    const losses = closed.filter(t => calcPnL(t) < 0);

    const totalPnL     = closed.reduce((s, t) => s + calcPnL(t), 0);
    const grossProfit  = wins.reduce((s, t) => s + calcPnL(t), 0);
    const grossLoss    = Math.abs(losses.reduce((s, t) => s + calcPnL(t), 0));
    const winRate      = closed.length ? (wins.length / closed.length) * 100 : 0;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
    const avgWin       = wins.length ? grossProfit / wins.length : 0;
    const avgLoss      = losses.length ? grossLoss / losses.length : 0;

    const rValues = closed.map(t => calcR(t)).filter(r => r !== null);
    const avgR    = rValues.length ? rValues.reduce((a, b) => a + b, 0) / rValues.length : 0;

    const pnlValues = closed.map(t => calcPnL(t));
    let maxDD = 0, peak = 0, running = 0;
    pnlValues.forEach(p => {
      running += p;
      if (running > peak) peak = running;
      const dd = peak - running;
      if (dd > maxDD) maxDD = dd;
    });

    return {
      totalTrades:  trades.length,
      closedTrades: closed.length,
      wins:         wins.length,
      losses:       losses.length,
      openTrades:   trades.filter(t => t.status === 'open').length,
      totalPnL:     +totalPnL.toFixed(2),
      grossProfit:  +grossProfit.toFixed(2),
      grossLoss:    +grossLoss.toFixed(2),
      winRate:      +winRate.toFixed(1),
      profitFactor: +profitFactor.toFixed(2),
      avgWin:       +avgWin.toFixed(2),
      avgLoss:      +avgLoss.toFixed(2),
      avgR:         +avgR.toFixed(2),
      maxDrawdown:  +maxDD.toFixed(2)
    };
  }

  /* ── EQUITY CURVE ── */
  function getEquityCurve(trades) {
    const closed = trades
      .filter(t => t.status === 'closed' && t.exitDate)
      .sort((a, b) => new Date(a.exitDate) - new Date(b.exitDate));

    let running = 0;
    return closed.map(t => {
      running += calcPnL(t) || 0;
      return { date: t.exitDate, value: +running.toFixed(2), symbol: t.symbol };
    });
  }

  /* ── STRATEGY BREAKDOWN ── */
  function getStrategyStats(trades) {
    const closed = trades.filter(t => t.status === 'closed');
    const map = {};
    closed.forEach(t => {
      const s = t.strategy || 'Unknown';
      if (!map[s]) map[s] = { trades: 0, pnl: 0, wins: 0 };
      map[s].trades++;
      map[s].pnl += calcPnL(t) || 0;
      if ((calcPnL(t) || 0) > 0) map[s].wins++;
    });
    return Object.entries(map).map(([name, d]) => ({
      name,
      trades:  d.trades,
      pnl:     +d.pnl.toFixed(2),
      winRate: d.trades ? +((d.wins / d.trades) * 100).toFixed(1) : 0
    })).sort((a, b) => b.pnl - a.pnl);
  }

  /* ── FILTER ── */
  /* 
    Dropdown values jo HTML mein hain:
    Direction  → 'long' | 'short'         (ya '' for all)
    Result     → 'win' | 'loss' | 'be' | 'open'  (ya '' for all)
    Strategy   → exact string             (ya '' for all)
    Asset      → exact string             (ya '' for all)
    Search     → free text
    dateFrom   → 'YYYY-MM-DD'
    dateTo     → 'YYYY-MM-DD'
  */
  function filter(trades, filters = {}) {
    return trades.filter(t => {

      /* Direction — skip if empty or placeholder */
      if (filters.direction && filters.direction !== '') {
        if (t.direction !== filters.direction) return false;
      }

      /* Asset */
      if (filters.asset && filters.asset !== '') {
        if (t.asset !== filters.asset) return false;
      }

      /* Strategy */
      if (filters.strategy && filters.strategy !== '') {
        if (t.strategy !== filters.strategy) return false;
      }

      /* Result */
      if (filters.result && filters.result !== '') {
        const r = getResult(t);
        if (r !== filters.result) return false;
      }

      /* Search — symbol, strategy, notes */
      if (filters.search && filters.search.trim() !== '') {
        const q = filters.search.toLowerCase().trim();
        const inSymbol   = t.symbol.toLowerCase().includes(q);
        const inStrategy = (t.strategy || '').toLowerCase().includes(q);
        const inNotes    = (t.notes || '').toLowerCase().includes(q);
        const inTags     = (t.tags || []).some(tag => tag.toLowerCase().includes(q));
        if (!inSymbol && !inStrategy && !inNotes && !inTags) return false;
      }

      /* Date range */
      if (filters.dateFrom && filters.dateFrom !== '') {
        if (t.entryDate < filters.dateFrom) return false;
      }
      if (filters.dateTo && filters.dateTo !== '') {
        if (t.entryDate > filters.dateTo) return false;
      }

      return true;
    });
  }

  return {
    getAll, getById, add, update, remove,
    calcPnL, calcR, calcPct, getResult,
    getStats, getEquityCurve, getStrategyStats,
    filter
  };

})();
