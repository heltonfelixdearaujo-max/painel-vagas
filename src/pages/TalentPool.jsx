import { useState } from 'react';
import { Search, Users, MessageCircle, Eye, Filter } from 'lucide-react';
import { whatsAppLink } from '../utils/whatsapp';
import { discProfiles } from '../data/discQuestions';
import { candidateStatuses } from '../data/mockData';
import CandidateDetail from '../components/CandidateDetail';

const recColors = { recommended: '#16A34A', recommended_with_caveats: '#D97706', not_recommended: '#DC2626' };
const statusColors = { Inscrito: '#0891B2', Triagem: '#7C3AED', Entrevista: '#D97706', Aprovado: '#16A34A', Reprovado: '#DC2626' };

export default function TalentPool({ pool, jobs, onUpdatePool }) {
  const [search, setSearch] = useState('');
  const [filterDisc, setFilterDisc] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [selected, setSelected] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);

  // Build enriched pool: deduplicated by email, with all job history
  const byEmail = {};
  pool.forEach(entry => {
    const key = entry.email?.toLowerCase() || entry.id;
    if (!byEmail[key]) {
      byEmail[key] = { ...entry, jobHistory: [] };
    }
    byEmail[key].jobHistory.push({ jobId: entry.jobId, jobTitle: entry.jobTitle, status: entry.status, appliedDate: entry.appliedDate, aiAnalysis: entry.aiAnalysis });
    // Keep best AI score
    if ((entry.aiAnalysis?.adherenceScore || 0) > (byEmail[key].aiAnalysis?.adherenceScore || 0)) {
      byEmail[key] = { ...byEmail[key], ...entry, jobHistory: byEmail[key].jobHistory };
    }
  });
  const uniquePool = Object.values(byEmail);

  const filtered = uniquePool.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.city?.toLowerCase().includes(q);
    const matchDisc = !filterDisc || c.disc?.profile === filterDisc;
    const matchStatus = !filterStatus || c.status === filterStatus;
    return matchSearch && matchDisc && matchStatus;
  }).sort((a, b) => {
    if (sortBy === 'score') return (b.aiAnalysis?.adherenceScore || 0) - (a.aiAnalysis?.adherenceScore || 0);
    if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
    return new Date(b.appliedDate || 0) - new Date(a.appliedDate || 0);
  });

  const initials = (name) => (name || '').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

  const handleView = (c) => {
    const job = jobs.find(j => (j.candidates || []).some(cand => cand.id === c.id)) || { title: c.jobTitle, candidates: [] };
    setSelected(c);
    setSelectedJob(job);
  };

  const handleUpdateCandidate = (updated) => {
    onUpdatePool(pool.map(p => p.id === updated.id ? { ...p, ...updated } : p));
    setSelected(updated);
  };

  if (selected && selectedJob) {
    return (
      <CandidateDetail
        candidate={selected}
        job={selectedJob}
        onClose={() => { setSelected(null); setSelectedJob(null); }}
        onUpdate={handleUpdateCandidate}
      />
    );
  }

  const discKeys = ['D', 'I', 'S', 'C'];

  return (
    <div>
      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total no Pool', value: uniquePool.length, color: '#4F46E5', bg: '#EEF2FF' },
          { label: 'Com DISC', value: uniquePool.filter(c => c.disc?.profile).length, color: '#0891B2', bg: '#E0F2FE' },
          { label: 'Recomendados', value: uniquePool.filter(c => c.aiAnalysis?.recommendation === 'recommended').length, color: '#16A34A', bg: '#DCFCE7' },
          { label: 'Score Médio', value: uniquePool.filter(c => c.aiAnalysis?.adherenceScore).length ? Math.round(uniquePool.reduce((s, c) => s + (c.aiAnalysis?.adherenceScore || 0), 0) / uniquePool.filter(c => c.aiAnalysis?.adherenceScore).length) + '%' : '—', color: '#D97706', bg: '#FEF3C7' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Users size={18} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#111827', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* DISC distribution */}
      {uniquePool.some(c => c.disc?.profile) && (
        <div style={{ background: 'white', borderRadius: 10, padding: '14px 20px', marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,.06)', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', flexShrink: 0 }}>Perfis DISC:</span>
          {discKeys.map(k => {
            const count = uniquePool.filter(c => c.disc?.profile === k).length;
            const p = discProfiles[k];
            return count > 0 ? (
              <button key={k} onClick={() => setFilterDisc(filterDisc === k ? '' : k)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 99, border: `1.5px solid ${filterDisc === k ? p.color : p.color + '40'}`, background: filterDisc === k ? p.bg : 'white', cursor: 'pointer', transition: 'all .15s' }}>
                <span style={{ fontSize: 13 }}>{p.emoji}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: p.color }}>{k}</span>
                <span style={{ fontSize: 11, color: p.color, fontWeight: 600 }}>{count}</span>
              </button>
            ) : null;
          })}
          {filterDisc && <button onClick={() => setFilterDisc('')} style={{ fontSize: 11, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer' }}>✕ limpar</button>}
        </div>
      )}

      {/* Filters */}
      <div style={{ background: 'white', borderRadius: 10, padding: '12px 16px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,.06)', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-box" style={{ maxWidth: 320 }}>
          <Search size={14} className="search-icon" />
          <input placeholder="Buscar nome, e-mail ou cidade..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Todos os status</option>
          {candidateStatuses.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="filter-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="date">Mais recentes</option>
          <option value="score">Maior score IA</option>
          <option value="name">Ordem alfabética</option>
        </select>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#9CA3AF' }}>{filtered.length} pessoa{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Pool list */}
      {filtered.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 10, padding: '60px 20px', textAlign: 'center', color: '#9CA3AF', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
          <Users size={40} style={{ margin: '0 auto 12px', opacity: .3 }} />
          <p style={{ fontSize: 14 }}>O pool de talentos está vazio.</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>Candidatos aparecerão aqui assim que se inscreverem em qualquer vaga.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(c => {
            const profile = c.disc?.profile ? discProfiles[c.disc.profile] : null;
            const ai = c.aiAnalysis || {};
            const waLink = whatsAppLink(c.whatsapp || '', c.name, c.jobTitle || 'vaga');
            const history = c.jobHistory || [];

            return (
              <div key={c.id} style={{ background: 'white', borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,.06)', border: '1px solid #F3F4F6', transition: 'border-color .15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#C7D2FE'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#F3F4F6'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Avatar */}
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: profile?.bg || '#EEF2FF', color: profile?.color || '#4F46E5', fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `2px solid ${profile?.color || '#C7D2FE'}` }}>
                    {initials(c.name)}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{c.name}</span>
                      {profile && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: profile.bg, color: profile.color, fontWeight: 700 }}>{profile.emoji} {c.disc.profile} — {profile.title}</span>}
                      {ai.recommendation && (
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: ai.recommendation === 'recommended' ? '#DCFCE7' : ai.recommendation === 'recommended_with_caveats' ? '#FEF3C7' : '#FEE2E2', color: recColors[ai.recommendation], fontWeight: 700 }}>
                          {ai.recommendation === 'recommended' ? '✓ Rec.' : ai.recommendation === 'recommended_with_caveats' ? '⚠ Ressalvas' : '✕ Não Rec.'}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#9CA3AF', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <span>📧 {c.email}</span>
                      {c.city && <span>📍 {c.city}</span>}
                      {c.salaryClaim && <span>💰 {c.salaryClaim}</span>}
                    </div>
                    {/* Job history pills */}
                    {history.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                        {history.slice(0, 4).map((h, i) => (
                          <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: '#F3F4F6', color: '#374151', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColors[h.status] || '#9CA3AF', display: 'inline-block' }} />
                            {h.jobTitle}
                          </span>
                        ))}
                        {history.length > 4 && <span style={{ fontSize: 11, color: '#9CA3AF' }}>+{history.length - 4} mais</span>}
                      </div>
                    )}
                  </div>

                  {/* Score */}
                  {ai.adherenceScore && (
                    <div style={{ textAlign: 'center', flexShrink: 0, paddingRight: 8 }}>
                      <div style={{ fontSize: 20, fontWeight: 900, color: recColors[ai.recommendation] || '#6B7280' }}>{ai.adherenceScore}%</div>
                      <div style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600 }}>score IA</div>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {c.whatsapp && (
                      <a href={waLink} target="_blank" rel="noreferrer" className="btn-icon" title="WhatsApp" style={{ color: '#16A34A', borderColor: '#BBF7D0' }}>
                        <MessageCircle size={14} />
                      </a>
                    )}
                    <button className="btn-icon" onClick={() => handleView(c)} title="Ver perfil completo" style={{ color: '#4F46E5', borderColor: '#C7D2FE' }}>
                      <Eye size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
