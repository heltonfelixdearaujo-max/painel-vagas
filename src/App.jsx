import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import { initialJobs } from './data/mockData';
import { useLocalStorage } from './hooks/useLocalStorage';
import { getSession } from './utils/auth';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import JobList from './components/JobList';
import KanbanBoard from './components/KanbanBoard';
import JobModal from './components/JobModal';
import CandidatesModal from './components/CandidatesModal';
import LoginPage from './pages/LoginPage';
import PublicApplication from './pages/PublicApplication';
import SharedReport from './pages/SharedReport';
import TalentPool from './pages/TalentPool';
import SettingsPage from './pages/SettingsPage';
import { getGhToken, setGhToken, syncAllJobs } from './utils/jobStorage';

window.React = React;

const viewMeta = {
  dashboard: { title: 'Dashboard', sub: 'Visão geral do processo seletivo' },
  vagas: { title: 'Vagas', sub: 'Gerencie todas as vagas cadastradas' },
  kanban: { title: 'Kanban', sub: 'Visualize as vagas por status de seleção' },
  pool: { title: 'Pool de Talentos', sub: 'Todos os candidatos que já interagiram com a Wayzim' },
  settings: { title: 'Configurações', sub: 'Área administrativa — recuperação de dados e lixeira' },
};

// ─── Recruiter Dashboard ───────────────────────────────────────────────────────
function TokenBanner({ jobs }) {
  const [token, setToken] = useState(getGhToken);
  const [input, setInput] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [done, setDone] = useState(false);

  if (token) return null;

  const save = async () => {
    if (!input.trim()) return;
    setGhToken(input);
    setToken(input);
    setSyncing(true);
    await syncAllJobs(jobs);
    setSyncing(false);
    setDone(true);
  };

  return (
    <div style={{ background:'#FFF7ED', border:'1px solid #FED7AA', borderRadius:10, padding:'12px 18px', marginBottom:16, display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
      <span style={{ fontSize:13, color:'#92400E', fontWeight:600, flex:'0 0 auto' }}>⚡ Para links curtos no WhatsApp:</span>
      <input
        value={input} onChange={e => setInput(e.target.value)}
        placeholder="Cole aqui o token do GitHub (ghp_…)"
        style={{ flex:1, minWidth:220, padding:'7px 10px', border:'1.5px solid #FED7AA', borderRadius:7, fontSize:12, fontFamily:'monospace', outline:'none' }}
      />
      <button onClick={save} disabled={syncing}
        style={{ padding:'7px 16px', background:'#EA580C', color:'white', border:'none', borderRadius:7, cursor:'pointer', fontWeight:700, fontSize:13, flexShrink:0 }}>
        {syncing ? 'Sincronizando…' : done ? '✓ Pronto!' : 'Ativar'}
      </button>
    </div>
  );
}

function RecruiterDashboard({ jobs, setJobs, pool, setPool, trash, setTrash, session, onLogout }) {
  const [view, setView] = useState('dashboard');
  const [jobModal, setJobModal] = useState(null);
  const [candidatesModal, setCandidatesModal] = useState(null);

  // Auto-sync jobs when token is already set
  useEffect(() => {
    const token = getGhToken();
    if (token && jobs?.length) syncAllJobs(jobs);
  }, []);

  const openJobs = jobs.filter(j => j.status === 'Aberta').length;
  const meta = viewMeta[view] || viewMeta.dashboard;

  // ── Job CRUD ──
  const handleSaveJob = (form) => {
    if (form.id) {
      setJobs(js => js.map(j => j.id === form.id ? { ...form } : j));
    } else {
      setJobs(js => [...js, { ...form, id: Date.now(), candidates: [] }]);
    }
    setJobModal(null);
  };

  const handleDeleteJob = (id) => {
    if (!window.confirm('Excluir esta vaga? Ela poderá ser recuperada nas Configurações.')) return;
    const job = jobs.find(j => j.id === id);
    if (job) setTrash(t => ({ ...t, jobs: [...(t.jobs || []), { ...job, deletedAt: Date.now() }] }));
    setJobs(js => js.filter(j => j.id !== id));
  };

  // ── Candidate soft-delete (from CandidatesModal) ──
  const handleDeleteCandidate = (jobId, candidateId) => {
    const job = jobs.find(j => j.id === jobId);
    const cand = job?.candidates.find(c => c.id === candidateId);
    if (cand && job) {
      setTrash(t => ({
        ...t,
        candidates: [...(t.candidates || []), { ...cand, jobId, jobTitle: job.title, deletedAt: Date.now() }],
      }));
    }
    setJobs(js => js.map(j => j.id === jobId ? { ...j, candidates: j.candidates.filter(c => c.id !== candidateId) } : j));
  };

  const handleUpdateJob = (updated) => {
    setJobs(js => js.map(j => j.id === updated.id ? updated : j));
    setCandidatesModal(updated);
  };

  // ── Trash restore ──
  const handleRestore = (type, id, jobId) => {
    if (type === 'jobs') {
      const job = trash.jobs.find(j => j.id === id);
      if (job) {
        const { deletedAt, ...clean } = job;
        setJobs(js => [...js, clean]);
        setTrash(t => ({ ...t, jobs: t.jobs.filter(j => j.id !== id) }));
      }
    } else {
      const cand = trash.candidates.find(c => c.id === id && c.jobId === jobId);
      if (cand) {
        const { deletedAt, jobTitle, ...clean } = cand;
        setJobs(js => js.map(j => j.id === jobId ? { ...j, candidates: [...(j.candidates || []), clean] } : j));
        setTrash(t => ({ ...t, candidates: t.candidates.filter(c => !(c.id === id && c.jobId === jobId)) }));
      }
    }
  };

  const handlePermanentDelete = (type, id, jobId) => {
    if (!window.confirm('Excluir permanentemente? Esta ação não pode ser desfeita.')) return;
    if (type === 'jobs') setTrash(t => ({ ...t, jobs: t.jobs.filter(j => j.id !== id) }));
    else setTrash(t => ({ ...t, candidates: t.candidates.filter(c => !(c.id === id && c.jobId === jobId)) }));
  };

  const handleClearTrash = (type) => {
    setTrash(t => ({ ...t, [type]: [] }));
  };

  // ── Pool update ──
  const handleUpdatePool = (updatedPool) => setPool(updatedPool);

  return (
    <div className="app">
      <Sidebar view={view} setView={setView} totalOpen={openJobs} session={session} onLogout={onLogout} />

      <div className="main">
        <div className="topbar">
          <div>
            <h1>{meta.title}</h1>
            <div className="topbar-sub">{meta.sub}</div>
          </div>
          {view === 'vagas' && (
            <div className="topbar-right">
              <button className="btn btn-primary" onClick={() => setJobModal('new')}>+ Nova Vaga</button>
            </div>
          )}
        </div>

        <div className="content">
          <TokenBanner jobs={jobs} />

          {view === 'dashboard' && <Dashboard jobs={jobs} onViewChange={setView} />}

          {view === 'vagas' && (
            <JobList
              jobs={jobs}
              onNew={() => setJobModal('new')}
              onEdit={job => setJobModal(job)}
              onDelete={handleDeleteJob}
              onCandidates={job => setCandidatesModal(job)}
            />
          )}

          {view === 'kanban' && (
            <KanbanBoard
              jobs={jobs}
              onCardClick={job => setJobModal(job)}
              onCandidates={job => setCandidatesModal(job)}
            />
          )}

          {view === 'pool' && (
            <TalentPool pool={pool} jobs={jobs} onUpdatePool={handleUpdatePool} />
          )}

          {view === 'settings' && session?.role === 'admin' && (
            <SettingsPage
              trash={trash}
              session={session}
              onRestore={handleRestore}
              onPermanentDelete={handlePermanentDelete}
              onClearTrash={handleClearTrash}
            />
          )}
        </div>
      </div>

      {jobModal && (
        <JobModal
          job={jobModal === 'new' ? null : jobModal}
          onClose={() => setJobModal(null)}
          onSave={handleSaveJob}
        />
      )}

      {candidatesModal && (
        <CandidatesModal
          job={jobs.find(j => j.id === candidatesModal.id) || candidatesModal}
          onClose={() => setCandidatesModal(null)}
          onUpdate={handleUpdateJob}
          onDeleteCandidate={handleDeleteCandidate}
        />
      )}
    </div>
  );
}

// ─── Public Application Wrapper ───────────────────────────────────────────────
function PublicWrapper({ jobs, setJobs, pool, setPool }) {
  const handleApply = (jobId, candidate) => {
    const job = jobs.find(j => j.id === jobId);
    // Add to job candidates
    setJobs(js => js.map(j => j.id === jobId ? { ...j, candidates: [...(j.candidates || []), candidate] } : j));
    // Add to talent pool
    const poolEntry = {
      ...candidate,
      jobId,
      jobTitle: job?.title || '',
    };
    setPool(p => {
      // Avoid exact duplicate (same person, same job)
      const exists = p.some(e => e.id === candidate.id);
      return exists ? p : [...p, poolEntry];
    });
  };

  return <PublicApplication jobs={jobs} onApply={handleApply} />;
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [jobs, setJobs] = useLocalStorage('wayzim-jobs', initialJobs);
  const [pool, setPool] = useLocalStorage('wayzim-pool', []);
  const [trash, setTrash] = useLocalStorage('wayzim-trash', { jobs: [], candidates: [] });
  const [session, setSession] = useState(() => getSession());

  const handleLogin = (s) => setSession(s);
  const handleLogout = () => setSession(null);

  return (
    <HashRouter>
      <Routes>
        {/* Public application page — no auth required */}
        <Route path="/candidatar/:jobId" element={
          <PublicWrapper jobs={jobs} setJobs={setJobs} pool={pool} setPool={setPool} />
        } />

        {/* Public shared report page — no auth required */}
        <Route path="/relatorio" element={<SharedReport />} />

        {/* All recruiter routes — require auth */}
        <Route path="*" element={
          !session
            ? <LoginPage onLogin={handleLogin} />
            : <RecruiterDashboard
                jobs={jobs} setJobs={setJobs}
                pool={pool} setPool={setPool}
                trash={trash} setTrash={setTrash}
                session={session} onLogout={handleLogout}
              />
        } />
      </Routes>
    </HashRouter>
  );
}
