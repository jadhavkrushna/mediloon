/**
 * Admin Dashboard — Compact Teal & White Redesign
 * Consolidated from 6 tabs → 3 tabs: Overview, Supply Chain, Intelligence
 * All features preserved, more visual and compact layout
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Zap, BarChart2, ShoppingCart, RefreshCw, Package, Activity,
  Phone, Brain, Loader2, ThumbsUp, ThumbsDown, CheckCircle,
  X, Search, MessageSquare, TrendingUp, Truck, Users, AlertTriangle,
  ChevronDown, ChevronUp, Eye, Plus, ArrowRight, Grid, Filter, Layers, Trash2
} from 'lucide-react';

import { API_BASE } from '../config/api';

function parsePackageSize(packageSize) {
  if (!packageSize) return { count: null, unit: 'unit' };
  const match = String(packageSize).match(/(\d+)\s*(st|stk|stück|tab|tablets?|caps?|capsules?|ml|mg|g|pcs?|pieces?|units?)?/i);
  if (!match) return { count: null, unit: 'unit' };
  return { count: parseInt(match[1], 10), unit: match[2]?.toLowerCase() || 'unit' };
}

function suggestedReorderForMed(med) {
  const parsed = parsePackageSize(med.package_size);
  const unitsPerPack = parsed.count || 1;
  const avgDaily = med.avg_daily_consumption || null;
  if (avgDaily && avgDaily > 0) {
    const daysOfStock = med.stock_quantity / avgDaily;
    const threshold = Math.max(Math.ceil(avgDaily * 7), 5);
    const reorderQty = Math.max(Math.ceil(avgDaily * 30 / unitsPerPack), 2) * unitsPerPack;
    return { threshold, reorderQty, daysOfStock: Math.round(daysOfStock) };
  }
  const threshold = Math.max(Math.ceil(unitsPerPack * 0.3), 5);
  const reorderQty = unitsPerPack * 3;
  return { threshold, reorderQty, daysOfStock: null };
}

/* ─── SVG Progress Ring for Admin ─── */
function AdminRing({ pct, size = 56, strokeWidth = 5, color = '#14B8A6', children }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  // Safeguard against NaN/invalid values
  const safePct = isNaN(pct) || pct == null ? 0 : Math.min(100, Math.max(0, pct));
  const offset = circ - (safePct / 100) * circ;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F3F4F6" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-1000" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

/* ─── Mini Horizontal Bar for inline visuals ─── */
function MiniBar({ value, max, color = 'teal', showLabel = true }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const colorMap = { teal: 'bg-teal-500', red: 'bg-red-500', amber: 'bg-amber-400', blue: 'bg-blue-500', green: 'bg-green-500', purple: 'bg-purple-500' };
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${colorMap[color] || colorMap.teal} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      {showLabel && <span className="text-[9px] font-mono text-gray-400 w-8 text-right">{Math.round(pct)}%</span>}
    </div>
  );
}

/* ─── Stat Card Component (Enhanced with Ring Visual) ─── */
function StatCard({ icon, label, value, sub, color = 'teal', ringPct, ringMax }) {
  const colorMap = {
    teal: { text: 'text-teal-600', ring: '#14B8A6', glow: 'from-blue-600 to-cyan-400' },
    red: { text: 'text-red-500', ring: '#ef4444', glow: 'from-red-600 to-orange-400' },
    amber: { text: 'text-amber-500', ring: '#f59e0b', glow: 'from-orange-500 to-yellow-400' },
    blue: { text: 'text-blue-500', ring: '#3B82F6', glow: 'from-blue-600 to-indigo-400' },
    purple: { text: 'text-purple-500', ring: '#8B5CF6', glow: 'from-purple-700 to-pink-500' },
  };
  const c = colorMap[color] || colorMap.teal;
  // Calculate percentage with safeguards against NaN
  let pct = null;
  if (ringPct != null) {
    pct = isNaN(ringPct) ? 0 : ringPct;
  } else if (ringMax) {
    const numValue = Number(value);
    pct = isNaN(numValue) || ringMax === 0 ? 0 : Math.min(100, (numValue / ringMax) * 100);
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-soft-ui relative overflow-hidden flex flex-col h-full">
      <div className="flex items-start justify-between relative z-10 w-full mb-2">
        <div className="flex-1 min-w-0 pr-2">
          <div className="text-xs font-bold uppercase tracking-wide text-[#67748e] mb-1">{label}</div>
          {pct == null && <div className="text-xl font-bold text-[#344767]">{value}</div>}
          {sub && <div className="text-sm font-medium text-[#67748e] mt-1 flex items-center gap-1">
            {pct == null && <span className={c.text}>{sub.split(' ')[0]}</span>}
            <span>{sub.substring(sub.indexOf(' ') + 1)}</span>
          </div>}
        </div>
        {pct != null ? (
          <AdminRing pct={pct} size={48} strokeWidth={4} color={c.ring}>
            <span className={`text-sm font-bold ${c.text}`}>{typeof value === 'number' ? value : '—'}</span>
          </AdminRing>
        ) : (
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-tl ${c.glow} text-white flex items-center justify-center flex-shrink-0 shadow-md`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Collapsible Section Wrapper ─── */
function Section({ id, title, icon, badge, children, actions, isExpanded, onToggle }) {
  return (
    <div className="bg-white rounded-2xl shadow-soft-ui overflow-hidden mb-4">
      <div className="w-full flex items-center justify-between px-4 py-4 border-b border-gray-50">
        <button onClick={() => onToggle(id)} className="flex items-center gap-3 flex-1 text-left">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tl from-[#141727] to-[#3A416F] text-white flex items-center justify-center shadow-md">
            {icon}
          </div>
          <span className="font-bold text-base text-[#344767] tracking-tight">{title}</span>
          {badge != null && <span className="px-2 py-0.5 bg-gray-100 text-[#67748e] text-xs font-bold rounded-lg ml-2">{badge}</span>}
        </button>
        <div className="flex items-center gap-3">
          {actions && <div className="mr-1">{actions}</div>}
          <button onClick={() => onToggle(id)} className="text-[#67748e] hover:text-[#344767] transition-colors p-1">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>
      {isExpanded && <div className="bg-white">{children}</div>}
    </div>
  );
}

export default function AdminDashboard({ onSwitchToUser, user }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [medications, setMedications] = useState([]);
  const [lowStockPredictions, setLowStockPredictions] = useState([]);
  const [procurementQueue, setProcurementQueue] = useState([]);
  const [refillAlerts, setRefillAlerts] = useState([]);
  const [events, setEvents] = useState([]);
  const [webhookLogs, setWebhookLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const setScopedMessage = useCallback((next) => {
    const payload = typeof next === 'string' ? { type: 'success', text: next } : next;
    setMessage({ ...payload, tab: payload.tab ?? activeTab });
  }, [activeTab]);

  const [observabilityStatus, setObservabilityStatus] = useState(null);
  const [executionLogs, setExecutionLogs] = useState([]);
  const [safetyDecisions, setSafetyDecisions] = useState([]);
  const [workflowTraces, setWorkflowTraces] = useState([]);
  const [traces, setTraces] = useState([]);
  const [ragMetrics, setRagMetrics] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showAddMedModal, setShowAddMedModal] = useState(false);
  const [newMed, setNewMed] = useState({ brand_name: '', generic_name: '', dosage: '', stock_quantity: 0, rx_required: false, active_ingredient: '', base_price_eur: '', form: 'tablet', unit_type: 'tablet' });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRx, setFilterRx] = useState('all'); // all | rx | otc
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [showPatientDataModal, setShowPatientDataModal] = useState(false);
  const [patientData, setPatientData] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [expandedSections, setExpandedSections] = useState({ events: true, webhook: false, inventory: true, forecast: true, procurement: true, refills: true, logs: false });

  const toggleSection = (key) => setExpandedSections(p => ({ ...p, [key]: !p[key] }));

  // ═══ Data Fetchers ═══
  const fetchMedications = async () => { try { const r = await fetch(`${API_BASE}/admin/medications`); const d = await r.json(); setMedications(d.medications || []); } catch (e) { console.error(e); } };
  const fetchLowStockPredictions = async () => { try { const r = await fetch(`${API_BASE}/refill/predictions`); const d = await r.json(); setLowStockPredictions(d.predictions || []); } catch (e) { console.error(e); } };
  const fetchProcurementQueue = async () => { try { const r = await fetch(`${API_BASE}/procurement/queue`); const d = await r.json(); setProcurementQueue(d.orders || []); } catch (e) { console.error(e); } };
  const fetchRefillAlerts = async () => { try { const r = await fetch(`${API_BASE}/refill/alerts?days=14`); const d = await r.json(); setRefillAlerts(d.alerts || []); } catch (e) { console.error(e); } };
  const fetchEvents = async () => { try { const r = await fetch(`${API_BASE}/events?limit=30`); const d = await r.json(); setEvents(d.events || []); } catch (e) { console.error(e); } };
  const fetchWebhookLogs = async () => { try { const r = await fetch(`${API_BASE}/webhooks/logs?limit=10`); const d = await r.json(); setWebhookLogs(d.logs || []); } catch (e) { console.error(e); } };
  const fetchObservabilityData = async () => {
    try {
      const [s, l, sf, w, t] = await Promise.all([
        fetch(`${API_BASE}/observability/status`),
        fetch(`${API_BASE}/observability/execution-logs?limit=30`),
        fetch(`${API_BASE}/observability/safety-decisions?limit=20`),
        fetch(`${API_BASE}/observability/workflow-traces?limit=20`),
        fetch(`${API_BASE}/observability/traces?limit=20`),
      ]);
      const [status, logs, safety, workflows, traceList] = await Promise.all([s.json(), l.json(), sf.json(), w.json(), t.json()]);
      setObservabilityStatus(status);
      setExecutionLogs(logs.logs || []);
      setSafetyDecisions(safety.decisions || []);
      setWorkflowTraces(workflows.traces || []);
      setTraces(traceList.traces || []);
    } catch (e) { console.error(e); }
  };
  const fetchRagMetrics = async () => { try { const r = await fetch(`${API_BASE}/observability/rag-metrics`); const d = await r.json(); setRagMetrics(d); } catch (e) { console.error(e); } };
  const fetchPatientData = async () => { setLoadingPatients(true); try { const r = await fetch(`${API_BASE}/data/export/orders`); const d = await r.json(); setPatientData(d.orders || []); } catch (e) { console.error(e); } finally { setLoadingPatients(false); } };

  // ═══ Actions ═══
  const refreshAllData = useCallback(async () => {
    setLoading(true);
    try { await Promise.all([fetchMedications(), fetchLowStockPredictions(), fetchProcurementQueue(), fetchRefillAlerts(), fetchEvents(), fetchWebhookLogs()]); if (activeTab === 'intelligence') await Promise.all([fetchObservabilityData(), fetchRagMetrics()]); } finally { setLoading(false); }
  }, [activeTab]);

  useEffect(() => {
    refreshAllData();
    const i = setInterval(() => {
      fetchEvents();
      fetchWebhookLogs();
      fetchMedications();
      if (activeTab === 'supply') { fetchLowStockPredictions(); fetchProcurementQueue(); }
      if (activeTab === 'intelligence') { fetchObservabilityData(); fetchRagMetrics(); }
    }, 5000);
    return () => clearInterval(i);
  }, [activeTab]);

  const generateProcurementOrders = async (force = false) => { setLoading(true); try { const urgency = force ? 'healthy' : 'attention'; const r = await fetch(`${API_BASE}/procurement/generate?urgency=${urgency}`, { method: 'POST' }); const d = await r.json(); setScopedMessage({ type: d.orders?.length > 0 ? 'success' : 'success', text: d.message || 'Procurement orders generated.' }); await Promise.all([fetchProcurementQueue(), fetchEvents()]); } catch { setScopedMessage({ type: 'error', text: 'Failed to generate orders' }); } finally { setLoading(false); } };
  const sendOrderToSupplier = async (orderId) => { try { const r = await fetch(`${API_BASE}/procurement/${orderId}/send`, { method: 'POST' }); const d = await r.json(); if (!r.ok) throw new Error(d.detail || d.error || 'Failed to send order'); setScopedMessage({ type: 'success', text: `Order sent to supplier. Status updated to ordered.` }); await Promise.all([fetchProcurementQueue(), fetchEvents(), fetchWebhookLogs()]); } catch (e) { setScopedMessage({ type: 'error', text: e.message || 'Failed to send order' }); } };
  const markOrderReceived = async (orderId) => { try { const r = await fetch(`${API_BASE}/procurement/${orderId}/receive`, { method: 'POST' }); const d = await r.json(); if (!r.ok) throw new Error(d.detail || d.error || 'Failed to mark received'); setScopedMessage({ type: 'success', text: `Stock updated: +${d.quantity_received ?? ''} units received. Inventory refreshed.` }); await refreshAllData(); } catch (e) { setScopedMessage({ type: 'error', text: e.message || 'Failed to mark received' }); } };
  const handleRunEval = async () => {
    setIsEvaluating(true);
    try {
      const r = await fetch(`${API_BASE}/observability/run-eval`, { method: 'POST' });
      const d = await r.json();
      if (d.status === 'complete' && d.metrics) {
        // Evaluation returned results directly — update UI immediately
        setRagMetrics(prev => ({
          ...prev,
          latest: d.metrics,
          history: [d.metrics, ...(prev?.history || [])].slice(0, 10),
          count: (prev?.count || 0) + 1
        }));
        setScopedMessage({ type: 'success', text: d.message, tab: 'intelligence' });
      } else if (d.status === 'error') {
        setScopedMessage({ type: 'error', text: d.message || 'Evaluation failed', tab: 'intelligence' });
      } else {
        setScopedMessage({ type: 'success', text: d.message || 'Evaluation started', tab: 'intelligence' });
        // Fallback: poll for results
        await fetchRagMetrics();
      }
    } catch {
      setScopedMessage({ type: 'error', text: 'Failed to trigger evaluation', tab: 'intelligence' });
    } finally {
      setIsEvaluating(false);
    }
  };
  const submitFeedback = async (traceId, rating) => { try { await fetch(`${API_BASE}/observability/feedback`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trace_id: traceId, rating }) }); setScopedMessage({ type: 'success', text: 'Feedback recorded', tab: 'intelligence' }); } catch { setScopedMessage({ type: 'error', text: 'Failed to submit feedback', tab: 'intelligence' }); } };
  const handleCreateMedication = async (e) => {
    e.preventDefault();
    try {
      const descParts = [];
      if (newMed.generic_name) descParts.push(`Generic: ${newMed.generic_name}`);
      if (newMed.active_ingredient) descParts.push(`Active: ${newMed.active_ingredient}`);
      const r = await fetch(`${API_BASE}/admin/medications`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_name: newMed.brand_name, package_size: newMed.dosage, description: descParts.join('; ') || undefined, base_price_eur: newMed.base_price_eur ? parseFloat(newMed.base_price_eur) : undefined, rx_required: newMed.rx_required }) });
      if (!r.ok) throw new Error('Failed');
      const d = await r.json();
      if (newMed.stock_quantity > 0) await fetch(`${API_BASE}/admin/inventory/${d.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stock_quantity: parseInt(newMed.stock_quantity) }) });
      setScopedMessage({ type: 'success', text: 'Medication added', tab: 'supply' });
      setShowAddMedModal(false); setNewMed({ brand_name: '', generic_name: '', dosage: '', stock_quantity: 0, rx_required: false, active_ingredient: '', base_price_eur: '', form: 'tablet', unit_type: 'tablet' });
      fetchMedications(); fetchLowStockPredictions();
    } catch { setScopedMessage({ type: 'error', text: 'Failed to add medication', tab: 'supply' }); }
  };

  const handleDeleteMedication = async (medId) => {
    if (!confirm('Delete this medication? This will remove it from the catalog.')) return;
    try {
      const r = await fetch(`${API_BASE}/admin/medications/${medId}`, { method: 'DELETE' });
      if (!r.ok) throw new Error('Delete failed');
      setScopedMessage({ type: 'success', text: 'Medication deleted', tab: 'inventory' });
      await fetchMedications();
    } catch (e) { setScopedMessage({ type: 'error', text: e.message || 'Failed to delete medication', tab: 'inventory' }); }
  };
  const handleUpdateStock = async (id, qty) => { try { await fetch(`${API_BASE}/admin/inventory/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stock_quantity: parseInt(qty) }) }); setScopedMessage({ type: 'success', text: 'Stock updated', tab: 'supply' }); fetchMedications(); } catch { setScopedMessage({ type: 'error', text: 'Failed to update stock', tab: 'supply' }); } };

  const getUrgencyColor = (u) => ({ critical: 'bg-red-100 text-red-700 border-red-200', warning: 'bg-amber-100 text-amber-700 border-amber-200', attention: 'bg-blue-100 text-blue-700 border-blue-200' }[u] || 'bg-green-100 text-green-700 border-green-200');
  const getStatusColor = (s) => ({ pending: 'bg-amber-100 text-amber-800', ordered: 'bg-blue-100 text-blue-800', received: 'bg-green-100 text-green-800', cancelled: 'bg-red-100 text-red-800' }[s] || 'bg-gray-100 text-gray-800');

  const lowStockCount = medications.filter(m => m.stock_quantity <= 10).length;
  const criticalPreds = lowStockPredictions.filter(p => p.urgency === 'critical').length;
  const pendingOrders = procurementQueue.filter(o => o.status === 'pending').length;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Activity size={18} /> },
    { id: 'inventory', label: 'Inventory', icon: <Grid size={18} /> },
    { id: 'supply', label: 'Supply Chain', icon: <Package size={18} /> },
    { id: 'intelligence', label: 'Intelligence', icon: <Brain size={18} /> },
  ];



  return (
    <div className="flex h-screen bg-[#f8f9fa] font-sans relative overflow-hidden">

      {/* ═══ Slim Sidebar ═══ */}
      <aside className="w-64 bg-transparent flex flex-col relative z-10 m-4 rounded-2xl">
        <div className="p-6 flex items-center justify-center mb-2">
          <div className="font-bold text-lg tracking-tight text-[#344767] flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tl from-purple-700 to-pink-500 rounded-lg flex justify-center items-center">
              <span className="text-white font-bold leading-none">M</span>
            </div>
            Mediloon Admin
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5">
          {tabs.map(t => (
            <button key={t.id} onClick={() => { setActiveTab(t.id); setMessage(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${activeTab === t.id
                ? 'bg-white text-[#344767] shadow-soft-ui'
                : 'text-[#67748e] hover:bg-white/50 hover:text-[#344767]'
                }`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm ${activeTab === t.id
                ? 'bg-gradient-to-tl from-purple-700 to-pink-500 text-white shadow-md'
                : 'bg-white text-[#344767] shadow-soft-ui'
                }`}>
                {t.icon}
              </div>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        <div className="px-4 pb-4">
          <div className="bg-gradient-to-tl from-purple-700 to-pink-500 rounded-2xl p-4 shadow-soft-ui text-white">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mb-3">
              <div className="text-white font-bold text-sm">{user?.name?.[0] || 'A'}</div>
            </div>
            <h6 className="text-sm font-bold mb-0.5">{user?.name || 'Admin'}</h6>
            <p className="text-xs text-white/80 mb-4 opacity-80">Logged in</p>
            <button onClick={onSwitchToUser} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white text-[#344767] rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors shadow-sm uppercase tracking-wide">
              User View
            </button>
          </div>
        </div>
      </aside>

      {/* ═══ Main Content ═══ */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Header */}
        <header className="h-20 px-6 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h6 className="text-base font-bold text-[#344767] capitalize m-0">{tabs.find(t => t.id === activeTab)?.label}</h6>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={refreshAllData} className={`text-[#67748e] hover:text-[#344767] transition-all ${loading ? 'animate-spin' : ''}`}>
              <RefreshCw size={18} />
            </button>
            <span className="text-xs font-bold text-[#67748e]">{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          </div>
        </header>

        {/* Toast */}
        {message && (
          <div className={`mx-6 mt-3 p-3 rounded-xl flex items-center justify-between text-sm shadow-sm animate-fade-in-up ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            <span className="font-medium">{message.text}</span>
            <button onClick={() => setMessage(null)} className="opacity-60 hover:opacity-100"><X size={16} /></button>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* ═══════════ OVERVIEW TAB ═══════════ */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in-up px-2 pb-6">
              {/* ★ Priority Procurement Section (High Visibility) */}
              <div className="bg-white rounded-2xl p-6 shadow-soft-ui relative overflow-hidden mb-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between relative z-10 gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-tl from-[#141727] to-[#3A416F] text-white flex items-center justify-center shadow-md flex-shrink-0">
                      <Truck size={28} />
                    </div>
                    <div>
                      <h5 className="font-bold text-lg text-[#344767] tracking-tight m-0">Priority Procurement</h5>
                      <p className="text-[#67748e] text-sm font-medium leading-relaxed mt-1">
                        AI-driven restocking. <span className="text-[#344767] font-bold">{procurementQueue.filter(o => o.status === 'pending').length} pending</span> · <span className="text-[#344767] font-bold">{procurementQueue.filter(o => o.status === 'ordered').length} ordered</span>.
                        {lowStockPredictions.length === 0 && <span className="text-green-500 font-bold ml-2 text-xs">✓ All stock healthy</span>}
                        {lowStockPredictions.length > 0 && <span className="text-amber-500 font-bold ml-2 text-xs">Action required</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <h4 className="text-2xl font-bold text-[#344767] m-0">{procurementQueue.filter(o => o.status === 'ordered').length}</h4>
                      <div className="text-xs text-[#67748e] font-bold uppercase tracking-wider mt-0.5">On Order</div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => generateProcurementOrders(false)}
                        disabled={loading}
                        className="px-5 py-2.5 bg-gradient-to-tl from-purple-700 to-pink-500 text-white rounded-lg font-bold text-xs uppercase tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 min-w-[140px]"
                      >
                        {loading ? <Loader2 className="animate-spin" size={14} /> : <Zap size={14} />}
                        Auto-Generate
                      </button>
                      <button
                        onClick={() => generateProcurementOrders(true)}
                        disabled={loading}
                        title="Force generate orders for all items regardless of stock level"
                        className="px-5 py-2.5 bg-white text-[#344767] border border-[#d2d6da] rounded-lg font-bold text-xs uppercase tracking-wide shadow-sm hover:shadow-soft-ui transition-all flex items-center justify-center gap-2 min-w-[140px]"
                      >
                        {loading ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
                        Force Generate
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stat Cards Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard icon={<Package size={16} />} label="Total Products" value={medications.length} sub={`${lowStockCount} low stock`} ringMax={Math.max(medications.length, 50)} />
                <StatCard icon={<AlertTriangle size={16} />} label="Critical Forecasts" value={criticalPreds} sub={`of ${lowStockPredictions.length} predictions`} color={criticalPreds > 0 ? 'red' : 'teal'} ringMax={Math.max(lowStockPredictions.length, 1)} />
                <StatCard icon={<Truck size={16} />} label="Pending Orders" value={pendingOrders} sub={`${procurementQueue.length} total`} color={pendingOrders > 0 ? 'amber' : 'teal'} ringMax={Math.max(procurementQueue.length, 1)} />
                <StatCard icon={<RefreshCw size={16} />} label="Refill Alerts" value={refillAlerts.length} sub="Upcoming depletions" color={refillAlerts.length > 0 ? 'blue' : 'teal'} ringMax={20} />
              </div>

              {/* Two-column: Events + Forecast */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Live Events */}
                <Section id="events" title="Live Events" icon={<Zap size={16} />} badge={events.length} isExpanded={expandedSections.events} onToggle={toggleSection}>
                  <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-100/50">
                    {events.length === 0 ? <div className="py-10 text-center text-gray-400 text-sm">No events yet</div> : events.slice(0, 15).map((ev, i) => (
                      <div key={i} className="flex gap-4 px-6 py-4 hover:bg-teal-50/30 transition-colors text-sm group">
                        <span className="text-[10px] font-mono text-gray-400 whitespace-nowrap pt-0.5">{new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-teal-50 text-teal-700 text-[9px] font-bold uppercase rounded-md border border-teal-100/50">{ev.agent}</span>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{ev.event_type}</span>
                          </div>
                          <p className="text-xs text-[#6B6B6B] font-medium leading-relaxed group-hover:text-gray-900 transition-colors">{ev.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>

                {/* Stock Forecast Preview */}
                <Section id="forecast" title="Stock Forecasts" icon={<TrendingUp size={16} />} badge={lowStockPredictions.length} isExpanded={expandedSections.forecast} onToggle={toggleSection}>
                  <div className="max-h-[400px] overflow-y-auto p-4 space-y-3">
                    {lowStockPredictions.length === 0 ? (
                      <div className="py-8 text-center"><CheckCircle size={32} className="mx-auto text-green-400/50 mb-3" /><p className="text-sm font-bold text-[#6B6B6B]">All stocks healthy</p></div>
                    ) : lowStockPredictions.slice(0, 8).map((pred, i) => {
                      const uc = getUrgencyColor(pred.urgency);
                      const daysLeft = pred.days_until_stockout || 0;
                      const ringColor = daysLeft <= 3 ? '#DC2626' : daysLeft <= 7 ? '#F59E0B' : '#14B8A6';
                      const pct = Math.max(0, Math.min(100, ((30 - Math.max(0, daysLeft)) / 30) * 100));
                      return (
                        <div key={i} className="flex items-start gap-4 p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                          <AdminRing pct={pct} size={48} strokeWidth={4} color={ringColor}>
                            <span className="text-xs font-bold" style={{ color: ringColor }}>{daysLeft}d</span>
                          </AdminRing>
                          <div className="flex-1 min-w-0">
                            <h6 className="font-bold text-sm text-[#344767] truncate mb-0.5" title={pred.brand_name}>{pred.brand_name}</h6>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-medium text-[#67748e]">Stock: <span className="font-bold text-[#344767]">{pred.current_stock}</span></span>
                              <span className="w-1 h-1 rounded-full bg-[#d2d6da]" />
                              <span className="text-xs font-medium text-[#67748e]"><span className="font-bold text-[#344767]">{pred.units_per_day}</span>/day</span>
                            </div>
                            <div className="mt-2"><MiniBar value={30 - daysLeft} max={30} color={daysLeft <= 3 ? 'red' : daysLeft <= 7 ? 'amber' : 'teal'} showLabel={false} /></div>
                          </div>
                          <span className={`text-[9px] font-bold tracking-wider uppercase px-2 py-1 rounded border ${uc}`}>{pred.urgency}</span>
                        </div>
                      );
                    })}
                  </div>
                </Section>
              </div>

              {/* Webhook Logs */}
              <Section id="webhook" title="Webhook Traffic" icon={<MessageSquare size={16} />} badge={webhookLogs.length} isExpanded={expandedSections.webhook} onToggle={toggleSection}>
                <div className="max-h-[300px] overflow-y-auto">
                  {webhookLogs.length === 0 ? <div className="py-8 text-center text-gray-400 text-sm">No logs</div> : (
                    <table className="w-full text-xs text-left">
                      <thead className="bg-gray-50/50 text-gray-500 font-bold uppercase tracking-wider sticky top-0 backdrop-blur-md"><tr><th className="px-6 py-3">Time</th><th className="px-6 py-3">Method</th><th className="px-6 py-3">Endpoint</th><th className="px-6 py-3 text-right">Payload</th></tr></thead>
                      <tbody className="divide-y divide-gray-100/50">{webhookLogs.map((log, i) => (
                        <tr key={i} className="hover:bg-teal-50/30 font-mono transition-colors">
                          <td className="px-6 py-3 text-gray-400 text-[10px] whitespace-nowrap">{new Date(log.created_at).toLocaleTimeString()}</td>
                          <td className="px-6 py-3"><span className={`px-2 py-1 rounded-md text-[9px] font-bold tracking-widest uppercase border ${log.direction === 'outgoing' ? 'bg-purple-50 text-purple-700 border-purple-100/50' : 'bg-green-50 text-green-700 border-green-100/50'}`}>{log.direction === 'outgoing' ? 'POST' : 'RECV'}</span></td>
                          <td className="px-6 py-3 text-[#6B6B6B] truncate max-w-[200px] font-medium">{log.endpoint}</td>
                          <td className="px-6 py-3 text-right"><details className="inline-block relative"><summary className="text-teal-600 hover:text-teal-800 cursor-pointer font-bold bg-teal-50 px-2 py-1 rounded-md border border-teal-100/50 transition-colors">JSON</summary><div className="absolute right-0 mt-2 w-80 bg-gray-900/95 backdrop-blur-xl border border-white/10 text-green-400 p-4 rounded-xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] z-50 text-[10px] overflow-auto max-h-72 custom-scrollbar"><pre>{JSON.stringify(log.payload, null, 2)}</pre></div></details></td>
                        </tr>
                      ))}</tbody>
                    </table>
                  )}
                </div>
              </Section>
            </div>
          )}

          {/* ═══════════ INVENTORY TAB ═══════════ */}
          {activeTab === 'inventory' && (
            <div className="space-y-6 animate-fade-in-up px-2 pb-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative max-w-sm w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#67748e]" size={14} />
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} type="text" placeholder="Search medications..." className="w-full bg-white border border-[#d2d6da] shadow-sm rounded-lg pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 focus:shadow-soft-ui transition-all placeholder:text-[#67748e] text-[#495057]" />
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative">
                    <button onClick={() => setShowFilterOptions(s => !s)} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white rounded-lg text-sm font-bold text-[#67748e] shadow-sm hover:shadow-soft-ui border border-[#d2d6da] transition-all"><Filter size={14} /> Filter</button>
                    {showFilterOptions && (
                      <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl border border-[#d2d6da] shadow-soft-ui p-2 z-20">
                        <button onClick={() => { setFilterRx('all'); setShowFilterOptions(false); }} className={`w-full text-left px-3 py-2 rounded-md text-sm text-[#495057] ${filterRx === 'all' ? 'bg-gray-50 font-bold' : ''}`}>All</button>
                        <button onClick={() => { setFilterRx('rx'); setShowFilterOptions(false); }} className={`w-full text-left px-3 py-2 rounded-md text-sm text-[#495057] ${filterRx === 'rx' ? 'bg-gray-50 font-bold' : ''}`}>Prescription only</button>
                        <button onClick={() => { setFilterRx('otc'); setShowFilterOptions(false); }} className={`w-full text-left px-3 py-2 rounded-md text-sm text-[#495057] ${filterRx === 'otc' ? 'bg-gray-50 font-bold' : ''}`}>OTC only</button>
                      </div>
                    )}
                  </div>
                  <button onClick={() => setShowAddMedModal(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-tl from-purple-700 to-pink-500 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all uppercase tracking-wide"><Plus size={14} /> Add Medication</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {medications.filter(med => {
                  const q = searchQuery.trim().toLowerCase();
                  if (q) {
                    const hay = `${med.product_name || ''} ${med.description || ''} ${med.package_size || ''}`.toLowerCase();
                    if (!hay.includes(q)) return false;
                  }
                  if (filterRx === 'rx' && !med.rx_required) return false;
                  if (filterRx === 'otc' && med.rx_required) return false;
                  return true;
                }).map(med => {
                  const sg = suggestedReorderForMed(med);
                  const threshold = med.reorder_threshold > 0 ? med.reorder_threshold : sg.threshold;
                  const isLow = med.stock_quantity <= threshold;
                  const isCritical = med.stock_quantity <= 10;
                  const ringColor = isCritical ? '#EF4444' : isLow ? '#F59E0B' : '#14B8A6';
                  const maxDisplay = Math.max(med.stock_quantity, threshold * 2);
                  const pct = maxDisplay > 0 ? Math.min(100, (med.stock_quantity / maxDisplay) * 100) : 0;

                  return (
                    <div key={med.id} className="bg-white rounded-2xl p-5 shadow-soft-ui relative group overflow-hidden flex flex-col min-h-[190px]">
                      {isCritical && <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none before:absolute before:inset-0 before:bg-red-500/5 before:rounded-bl-3xl before:transition-all group-hover:before:bg-red-500/10 transition-colors" />}

                      <div className="flex justify-between items-start mb-5 relative z-10">
                        <div className="flex-1 min-w-0 pr-3">
                          <h4 className="text-base font-bold text-[#344767] truncate mb-0.5" title={med.product_name}>{med.product_name}</h4>
                          <p className="text-[#67748e] text-[11px] font-bold tracking-wide uppercase">{med.package_size || 'N/A'} • {med.form || 'UNIT'}</p>
                          {med.description && <div className="text-[11px] text-[#67748e] mt-1 truncate">{med.description}</div>}
                          {med.base_price_eur != null && <div className="text-sm font-bold text-[#344767] mt-1">€{Number(med.base_price_eur).toFixed(2)}</div>}
                        </div>
                        <div className="flex items-start gap-2">
                          {med.rx_required ? <span className="px-2 py-1 bg-[#FEF3C7] text-[#B45309] text-[9px] font-bold uppercase tracking-wider rounded-md border border-[#FDE68A] shadow-[0_2px_4px_-1px_rgba(245,158,11,0.1)] flex-shrink-0">RX</span> : <span className="px-2 py-1 bg-green-50 text-green-700 text-[9px] font-bold uppercase tracking-wider rounded-md border border-green-100 flex-shrink-0">OTC</span>}
                          <button onClick={() => handleDeleteMedication(med.id)} title="Delete" className="w-8 h-8 rounded-md bg-white/50 hover:bg-red-50 text-red-600 flex items-center justify-center border border-gray-100 ml-1"><Trash2 size={14} /></button>
                        </div>
                      </div>

                      <div className="flex items-end gap-4 mt-auto">
                        <AdminRing pct={pct} size={52} strokeWidth={4.5} color={ringColor}>
                          <span className="text-sm font-bold" style={{ color: ringColor }}>{med.stock_quantity}</span>
                        </AdminRing>

                        <div className="flex-1">
                          <div className="text-[9px] font-bold uppercase tracking-wider text-[#67748e] mb-1.5 flex justify-between">
                            <span>Balance</span>
                            <span>Min {threshold}</span>
                          </div>
                          <div className="flex items-center gap-1 bg-[#f8f9fa] rounded-lg p-1 border border-[#d2d6da] transition-colors">
                            <button onClick={() => handleUpdateStock(med.id, Math.max(0, med.stock_quantity - 1))} className="w-8 h-8 flex items-center justify-center rounded-md text-[#67748e] hover:bg-white hover:text-red-500 hover:shadow-sm transition-all cursor-pointer">-</button>
                            <input
                              type="number"
                              className="flex-1 w-full min-w-0 bg-transparent text-center text-sm font-bold text-[#344767] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors"
                              value={med.stock_quantity}
                              onChange={e => {
                                const val = parseInt(e.target.value);
                                if (!isNaN(val)) handleUpdateStock(med.id, val);
                              }}
                            />
                            <button onClick={() => handleUpdateStock(med.id, med.stock_quantity + 1)} className="w-8 h-8 flex items-center justify-center rounded-md text-[#67748e] hover:bg-white hover:text-teal-500 hover:shadow-sm transition-all cursor-pointer">+</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══════════ SUPPLY CHAIN TAB ═══════════ */}
          {activeTab === 'supply' && (
            <div className="space-y-4 animate-fade-in-up">
              {/* Stat Row */}
              <div className="grid grid-cols-3 gap-3">
                <StatCard icon={<Package size={16} />} label="Products" value={medications.length} sub={`${lowStockCount} need attention`} />
                <StatCard icon={<ShoppingCart size={16} />} label="Orders" value={procurementQueue.length} sub={`${pendingOrders} pending`} color={pendingOrders > 0 ? 'amber' : 'teal'} />
                <StatCard icon={<RefreshCw size={16} />} label="Customer Refills" value={refillAlerts.length} sub="Due within 14 days" color={refillAlerts.length > 0 ? 'blue' : 'teal'} />
              </div>

              {/* Procurement */}
              <Section id="procurement" title="Procurement Orders" icon={<Truck size={16} />} badge={procurementQueue.length}
                isExpanded={expandedSections.procurement} onToggle={toggleSection}
                actions={<div role="button" tabIndex={0} onClick={() => !loading && generateProcurementOrders()} onKeyDown={e => e.key === 'Enter' && !loading && generateProcurementOrders()} className={`px-3 py-1.5 bg-gradient-to-tl from-purple-700 to-pink-500 text-white rounded-lg text-[11px] font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1 cursor-pointer select-none uppercase tracking-wide ${loading ? 'opacity-50 pointer-events-none' : ''}`}>{loading ? <Loader2 className="animate-spin" size={12} /> : <Zap size={12} />} Auto-Generate</div>}>
                <div className="max-h-[350px] overflow-auto">
                  {procurementQueue.length === 0 ? <div className="py-8 text-center text-gray-400 text-sm">No active orders</div> : (
                    <table className="w-full text-xs text-left">
                      <thead className="bg-gray-50/50 text-[#67748e] uppercase font-bold text-[10px] tracking-wider sticky top-0"><tr><th className="px-4 py-3 border-b border-[#f0f2f5]">Status</th><th className="px-4 py-3 border-b border-[#f0f2f5]">Item</th><th className="px-4 py-3 border-b border-[#f0f2f5]">Supplier</th><th className="px-4 py-3 text-right border-b border-[#f0f2f5]">Actions</th></tr></thead>
                      <tbody className="divide-y divide-gray-50">{procurementQueue.map(order => (
                        <tr key={order.order_id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${getStatusColor(order.status)}`}>{order.status}</span></td>
                          <td className="px-4 py-3"><div className="font-bold text-sm text-[#344767]">{order.brand_name}</div><div className="text-xs text-[#67748e] font-medium">{order.quantity || order.order_quantity} units</div></td>
                          <td className="px-4 py-3 text-sm font-medium text-[#67748e]">{order.supplier_name || order.supplier?.name}</td>
                          <td className="px-4 py-3 text-right relative">
                            {order.status === 'pending' && <button onClick={() => sendOrderToSupplier(order.order_id)} className="relative z-10 px-3 py-1.5 bg-gradient-to-tl from-blue-600 to-indigo-400 text-white rounded-lg text-[10px] uppercase tracking-wide font-bold shadow-sm hover:shadow-md transition-all cursor-pointer">Send</button>}
                            {order.status === 'ordered' && <button onClick={() => markOrderReceived(order.order_id)} className="relative z-10 px-3 py-1.5 bg-gradient-to-tl from-green-500 to-emerald-400 text-white rounded-lg text-[10px] uppercase tracking-wide font-bold shadow-sm hover:shadow-md transition-all cursor-pointer">Received</button>}
                            {order.status === 'received' && <span className="text-xs font-bold text-[#67748e]">Done</span>}
                          </td>
                        </tr>
                      ))}</tbody>
                    </table>
                  )}
                </div>
              </Section>

              {/* Customer Refills */}
              <Section id="refills" title="Customer Refills" icon={<RefreshCw size={16} />} badge={refillAlerts.length}
                isExpanded={expandedSections.refills} onToggle={toggleSection}
                actions={<div role="button" tabIndex={0} onClick={() => { setShowPatientDataModal(true); fetchPatientData(); }} onKeyDown={e => { if (e.key === 'Enter') { setShowPatientDataModal(true); fetchPatientData(); } }} className="px-3 py-1.5 bg-[#f8f9fa] text-[#344767] rounded-lg text-[11px] font-bold hover:bg-white border border-[#d2d6da] shadow-sm hover:shadow-soft-ui transition-all flex items-center gap-1 cursor-pointer select-none uppercase tracking-wide"><Users size={12} /> Patients</div>}>
                <div className="max-h-[350px] overflow-y-auto p-3">
                  {refillAlerts.length === 0 ? <div className="py-8 text-center text-gray-400 text-sm">No refills due</div> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {refillAlerts.map((alert, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-teal-200 transition-all">
                          <div className={`w-1.5 h-10 rounded-full flex-shrink-0 ${alert.days_until_depletion <= 3 ? 'bg-red-500' : 'bg-amber-400'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-800 truncate">{alert.customer_name}</div>
                            <div className="text-[10px] text-gray-400">{alert.brand_name} · {alert.dosage}</div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${alert.days_until_depletion <= 3 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                              {alert.days_until_depletion <= 0 ? 'EMPTY' : `${alert.days_until_depletion}d`}
                            </span>
                          </div>
                          <a href={`tel:${alert.customer_phone}`} className="w-7 h-7 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center hover:bg-teal-100 flex-shrink-0"><Phone size={12} /></a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Section>
            </div>
          )}

          {/* ═══════════ INTELLIGENCE TAB ═══════════ */}
          {activeTab === 'intelligence' && (
            <div className="space-y-4 animate-fade-in-up">
              {/* Status + RAG Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <div className="bg-white rounded-2xl p-6 shadow-soft-ui relative overflow-hidden flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-5">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Observability</span>
                    <div className="w-8 h-8 rounded-full bg-blue-50/50 flex items-center justify-center"><Activity size={14} className="text-blue-500" /></div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl border border-gray-100/50">
                      <div className={`w-2.5 h-2.5 rounded-full ${observabilityStatus?.langfuse_enabled ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-gray-300'}`} />
                      <span className="text-sm font-bold text-[#2C2C2C]">{observabilityStatus?.langfuse_enabled ? 'Langfuse Active' : 'Local Only'}</span>
                    </div>
                    <div className="px-1 text-[11px] font-medium text-gray-500 flex flex-col gap-2">
                      <span className="flex justify-between"><span>Traces</span> <span className="font-bold text-gray-700">{traces.length}</span></span>
                      <span className="flex justify-between"><span>Events</span> <span className="font-bold text-gray-700">{executionLogs.length}</span></span>
                      <span className="flex justify-between"><span>Safety Logs</span> <span className="font-bold text-gray-700">{safetyDecisions.length}</span></span>
                    </div>
                  </div>
                </div>

                {/* RAG Quality */}
                <div className="bg-white rounded-2xl p-6 shadow-soft-ui lg:col-span-2 relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shadow-inner"><Brain size={18} className="text-purple-600" /></div>
                      <div>
                        <span className="text-sm font-bold text-[#2C2C2C]">RAG Quality</span>
                        <div className="text-[10px] text-gray-400 font-medium">Auto-evaluations powered by React Framework</div>
                      </div>
                    </div>
                    <button onClick={handleRunEval} disabled={loading || isEvaluating} className="px-5 py-2.5 bg-gradient-to-tl from-purple-700 to-pink-500 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-wide min-w-[120px]">
                      {isEvaluating ? <Loader2 className="animate-spin" size={14} /> : <Zap size={14} className="fill-white/20 transition-colors" />}
                      {isEvaluating ? 'Evaluating...' : 'Run Evaluation'}
                    </button>
                  </div>
                  {isEvaluating ? (
                    <div className="text-center py-8 space-y-3">
                      <Loader2 className="animate-spin mx-auto text-indigo-600" size={40} />
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-gray-700">Evaluating RAG Quality...</div>
                        <div className="text-xs text-gray-500">Running 3 metrics on samples (~15-30 seconds)</div>
                        <div className="text-xs text-gray-400">Check backend terminal for progress</div>
                      </div>
                      <div className="flex justify-center gap-2 pt-2">
                        <div className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-[10px] font-medium">Faithfulness</div>
                        <div className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-[10px] font-medium">Precision</div>
                        <div className="px-2 py-1 bg-green-50 text-green-700 rounded text-[10px] font-medium">Relevancy</div>
                      </div>
                    </div>
                  ) : ragMetrics?.latest ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      {[{ name: 'Faithfulness', score: ragMetrics.latest.faithfulness_score, ring: '#22C55E' }, { name: 'Precision', score: ragMetrics.latest.context_precision_score, ring: '#3B82F6' }, { name: 'Relevancy', score: ragMetrics.latest.answer_relevancy_score, ring: '#8B5CF6' }].map(m => (
                        <div key={m.name} className="flex flex-col items-center justify-center p-4 bg-white/50 rounded-2xl border border-gray-100/50 hover:bg-white transition-colors">
                          <AdminRing pct={m.score * 100} size={70} strokeWidth={5.5} color={m.ring}>
                            <span className="text-lg font-bold" style={{ color: m.ring }}>{(m.score * 100).toFixed(0)}%</span>
                          </AdminRing>
                          <span className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider mt-4 text-center">{m.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : <div className="text-center py-10 bg-white/50 rounded-2xl border border-transparent border-dashed hover:border-gray-200 transition-colors flex flex-col items-center"><Brain size={32} className="text-gray-300 mb-3" /><p className="text-sm font-semibold text-[#6B6B6B]">No metrics yet</p><p className="text-xs font-medium text-gray-400 mt-1 max-w-xs">Chat with the assistant first to generate samples. Current trace count: {ragMetrics?.history?.length || 0}</p></div>}
                </div>
              </div>

              {/* Chain of Thought (CoT) */}
              <Section id="logs" title="Chain of Thought (CoT)" icon={<Activity size={16} />} badge={traces.length || executionLogs.length} isExpanded={expandedSections.logs} onToggle={toggleSection}>
                <div className="max-h-[500px] overflow-y-auto divide-y divide-gray-100/50">
                  {traces.map((trace, i) => (
                    <div key={`trace-${i}`} className="px-6 py-4 hover:bg-teal-50/30 transition-colors group">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-mono text-gray-400">{new Date(trace.created_at || trace.timestamp || Date.now()).toLocaleTimeString()}</span>
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 font-bold text-[9px] tracking-wider uppercase rounded-md border border-purple-100/50">TRACE</span>
                          {trace.latency_ms != null && <span className="text-[10px] text-gray-400 font-medium">{trace.latency_ms} ms</span>}
                        </div>
                        {trace.public_url && <a href={trace.public_url} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 hover:underline px-2 py-1 bg-indigo-50 rounded-md transition-colors">Open Trace</a>}
                      </div>
                      <p className="text-sm text-[#2C2C2C] font-bold truncate mb-1">{trace.name || 'Agent Turn'}</p>
                      <p className="text-xs text-[#6B6B6B] font-medium truncate">{trace.input_text || trace.metadata_json || ''}</p>
                    </div>
                  ))}
                  {executionLogs.map((log, i) => (
                    <div key={i} className="px-6 py-4 hover:bg-teal-50/30 transition-colors group">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-mono text-gray-400">{new Date(log.created_at).toLocaleTimeString()}</span>
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold text-[9px] tracking-wider uppercase rounded-md border border-blue-100/50">{log.agent}</span>
                        </div>
                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => submitFeedback(log.trace_id || log.id, 'positive')} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-gray-100 text-gray-400 hover:text-green-600 hover:bg-green-50 hover:border-green-200 transition-colors shadow-sm"><ThumbsUp size={12} /></button>
                          <button onClick={() => submitFeedback(log.trace_id || log.id, 'negative')} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-gray-100 text-gray-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors shadow-sm"><ThumbsDown size={12} /></button>
                        </div>
                      </div>
                      <p className="text-sm text-[#6B6B6B] font-medium leading-relaxed group-hover:text-gray-900 transition-colors">{log.message}</p>
                      {log.metadata && (
                        <details className="mt-2 text-[10px] text-gray-500"><summary className="cursor-pointer font-bold hover:text-teal-600 inline-block px-2 py-1 bg-gray-50 rounded-md border border-gray-100 transition-colors">View Metadata</summary><pre className="mt-2 bg-gray-900/95 backdrop-blur-xl border border-white/10 text-gray-300 p-4 rounded-xl overflow-x-auto text-[10px] custom-scrollbar shadow-inner">{JSON.stringify(log.metadata, null, 2)}</pre></details>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          )}
        </div>
      </main>

      {/* ═══ Add Medication Modal ═══ */}
      {showAddMedModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-soft-ui p-6 w-full max-w-md border-0 animate-zoom-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Add Medication</h3>
              <button onClick={() => setShowAddMedModal(false)} className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center"><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateMedication} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] font-bold text-gray-500 uppercase">Brand</label><input type="text" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none" value={newMed.brand_name} onChange={e => setNewMed({ ...newMed, brand_name: e.target.value })} /></div>
                <div><label className="text-[10px] font-bold text-gray-500 uppercase">Generic</label><input type="text" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none" value={newMed.generic_name} onChange={e => setNewMed({ ...newMed, generic_name: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] font-bold text-gray-500 uppercase">Dosage</label><input type="text" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none" value={newMed.dosage} onChange={e => setNewMed({ ...newMed, dosage: e.target.value })} /></div>
                <div><label className="text-[10px] font-bold text-gray-500 uppercase">Stock</label><input type="number" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none" value={newMed.stock_quantity} onChange={e => setNewMed({ ...newMed, stock_quantity: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] font-bold text-gray-500 uppercase">Active Ingredient</label><input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none" value={newMed.active_ingredient} onChange={e => setNewMed({ ...newMed, active_ingredient: e.target.value })} /></div>
                <div><label className="text-[10px] font-bold text-gray-500 uppercase">Price (EUR)</label><input type="number" step="0.01" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none" value={newMed.base_price_eur} onChange={e => setNewMed({ ...newMed, base_price_eur: e.target.value })} /></div>
              </div>
              <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl">
                <input type="checkbox" id="rx" className="w-4 h-4 rounded text-teal-600" checked={newMed.rx_required} onChange={e => setNewMed({ ...newMed, rx_required: e.target.checked })} />
                <label htmlFor="rx" className="text-sm font-medium text-gray-700 cursor-pointer">Prescription Required</label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddMedModal(false)} className="px-4 py-2.5 text-gray-500 text-sm font-semibold hover:bg-gray-50 rounded-xl">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-teal-600 text-white text-sm font-bold rounded-xl shadow-lg hover:bg-teal-700 transition-all active:scale-95">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ Patient Data Modal ═══ */}
      {showPatientDataModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-soft-ui w-full max-w-5xl border-0 animate-zoom-in" style={{ maxHeight: '85vh' }}>
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center"><Users size={16} /></div>
                <div><h3 className="text-base font-bold text-gray-800">Patient Orders</h3><p className="text-xs text-gray-400">{patientData.length} records</p></div>
              </div>
              <button onClick={() => setShowPatientDataModal(false)} className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center"><X size={16} /></button>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 80px)' }}>
              {loadingPatients ? <div className="flex items-center justify-center py-16"><Loader2 className="animate-spin text-teal-600" size={32} /></div> : patientData.length === 0 ? (
                <div className="text-center py-16"><Users size={28} className="mx-auto text-gray-300 mb-2" /><p className="text-sm font-semibold text-gray-600">No data</p></div>
              ) : (
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-500 uppercase font-semibold sticky top-0">
                    <tr>
                      <th className="px-5 py-3 rounded-tl-xl">Customer</th>
                      <th className="px-5 py-3">Contact & Address</th>
                      <th className="px-5 py-3">Date & Time</th>
                      <th className="px-5 py-3">Product</th>
                      <th className="px-5 py-3 text-right">Qty / Total</th>
                      <th className="px-5 py-3 rounded-tr-xl">RX & Freq</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {patientData.map((row, idx) => (
                      <tr key={row.order_id + '-' + idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-bold text-gray-800 text-sm whitespace-nowrap">{row.customer_name || 'Anonymous'}</div>
                          <div className="font-mono text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded inline-block mt-1">ID: {row.customer_id || '-'}</div>
                          {row.customer_age && <div className="text-[10px] text-gray-400 mt-0.5">{row.customer_age} y/o • {row.customer_gender}</div>}
                        </td>
                        <td className="px-5 py-4 text-[11px] text-gray-600 min-w-[150px]">
                          {row.customer_email && <div className="font-medium">{row.customer_email}</div>}
                          {row.phone && <div>{row.phone}</div>}
                          {row.address && <div className="text-gray-400 truncate max-w-[180px] mt-0.5" title={`${row.address}, ${row.city || ''}`}>{row.address}{row.city ? `, ${row.city}` : ''}</div>}
                        </td>
                        <td className="px-5 py-4 text-[11px] text-gray-600 whitespace-nowrap">
                          {row.purchase_date && <div><span className="font-semibold text-gray-700">Date:</span> {new Date(row.purchase_date).toLocaleDateString()}</div>}
                          {row.order_created_at && <div className="mt-0.5 text-gray-400">Time: {new Date(row.order_created_at).toLocaleTimeString()}</div>}
                        </td>
                        <td className="px-5 py-4 font-bold text-[#2C2C2C] text-sm max-w-[200px]" title={row.product_name}>
                          <div className="line-clamp-2">{row.product_name || '-'}</div>
                        </td>
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <div className="font-bold text-gray-800 text-sm">{row.quantity ?? '-'} items</div>
                          <div className="text-[11px] text-gray-500 mt-0.5">Item: €{row.line_total_eur != null ? Number(row.line_total_eur).toFixed(2) : '-'}</div>
                          {row.order_total_eur != null && <div className="text-[10px] text-gray-400">Order: €{Number(row.order_total_eur).toFixed(2)}</div>}
                        </td>
                        <td className="px-5 py-4 text-[11px]">
                          {row.prescription_required ? <span className="px-1.5 py-0.5 bg-red-50 text-red-600 font-bold uppercase tracking-wider rounded border border-red-100/50 text-[9px] mb-1 inline-block">RX REQ</span> : <span className="px-1.5 py-0.5 bg-green-50 text-green-600 font-bold uppercase tracking-wider rounded border border-green-100/50 text-[9px] mb-1 inline-block">OTC</span>}
                          <div className="text-gray-600 font-medium capitalize">{row.dosage_frequency || '-'}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
