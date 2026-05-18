import { useState } from 'react';
import { X, MessageCircle, Eye, Users, Trash2 } from 'lucide-react';
import { whatsAppLink } from '../utils/whatsapp';
import { discProfiles } from '../data/discQuestions';
import { candidateStatuses } from '../data/mockData';
import CandidateDetail from './CandidateDetail';

const statusColors = { Inscrito: '#0891B2', Triagem: '#7C3AED', Entrevista: '#D97706', Aprovado: '#16A34A', Reprovado: '#DC2626' };
const recColors = { recommended: '#16A34A', recommended_with_caveats: '#D97706', not_recommended: '#DC2626' };

export default function CandidatesModal({ job, onClose, onUpdate, onDeleteCandidate }) {
  const [selected, setSelected] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [sort, setSort] = useState('date');

  const updateCandidate = (updated) => {
    const candidates = job.candidates.map(c => c.id === updated.id ? updated : c);
    onUpdate({ ...job, candidates });
    setSelected(updated);
  };

  const sorted = [...job.candidates]
    .filter(c => !filterStatus || c.status === filterStatus)
    .sort((a, b) => {
      if (sort === 'score') return (b.aiAnalysis?.adherenceScore || 0) - (a.aiAnalysis?.adherenceScore || 0);
      if (sort === 'status') return (a.status || '').localeCompare(b.status || '');
      return new Date(b.appliedDate) - new Date(a.appliedDate);
    });

  if (selected) {
    return (
      <CandidateDetail
        candidate={selected}
        job={job}
        onClose={() => setSelected(null)}
        onUpdate={updateCandidate}
      />
    );
  }

  const initials = (name) => name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 720 }}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Candidatos — {job.title}</div>
            <div className="modal-sub">{job.department} · {job.location} · {job.candidates.length} candidato{job.candidates.length !== 1 ? 's' : ''}</div>
          </div>
          <button className="close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Filters */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', gap: 10, alignItems: 'center' }}>
          <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Todos os status</option>
            {candidateStatuses.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="filter-select" value={sort} onChange={e => setSort(e.target.value)}>
            <option value="date">Mais recentes</option>
            <option value="score">Maior score IA</option>
            <option value="status">Por status</option>
          </select>
          <div style={{ marginLeft: 'auto', fontSize: 12, color: '#9CA3AF' }}>
            <Users size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
            {sorted.length} encontrado{sorted.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="modal-body" style={{ padding: '12px 20px' }}>
          {sorted.length === 0 ? (
            <div className="empty"><p>Nenhum candidato inscrito ainda.</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sorted.map(c => {
                const ai = c.aiAnalysis || {};
                const disc = c.disc;
                const profile = disc?.profile ? discProfiles[disc.profile] : null;
                const waLink = whatsAppLink(c.whatsapp || '', c.name, job.title);

                return (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: '1px solid #E5E7EB', borderRadius: 10, transition: 'border-color .15s, box-shadow .15s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#C7D2FE'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#E5E7EB'}>
                    {/* Avatar */}
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: profile ? profile.bg : '#EEF2FF', color: profile ? profile.color : '#4F46E5', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `2px solid ${profile?.color || '#C7D2FE'}` }}>
                      {initials(c.name)}
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                        {profile && (
                          <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 99, background: profile.bg, color: profile.color, fontWeight: 700, flexShrink: 0 }}>
                            {profile.emoji} {disc.profile}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>{c.city} · {c.salaryClaim}</div>
                    </div>
                    {/* Score */}
                    {ai.adherenceScore && (
                      <div style={{ textAlign: 'center', flexShrink: 0 }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: recColors[ai.recommendation] || '#6B7280' }}>{ai.adherenceScore}%</div>
                        <div style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600 }}>aderência</div>
                      </div>
                    )}
                    {/* Status */}
                    <select value={c.status} onChange={e => updateCandidate({ ...c, status: e.target.value })}
                      onClick={e => e.stopPropagation()}
                      style={{ padding: '4px 8px', borderRadius: 6, border: `1.5px solid ${statusColors[c.status] || '#E5E7EB'}`, fontSize: 11, fontWeight: 700, color: statusColors[c.status] || '#374151', background: 'white', cursor: 'pointer', flexShrink: 0 }}>
                      {candidateStatuses.map(s => <option key={s}>{s}</option>)}
                    </select>
                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <a href={waLink} target="_blank" rel="noreferrer" className="btn-icon" title="WhatsApp" style={{ color: '#16A34A', borderColor: '#BBF7D0' }}>
                        <MessageCircle size={14} />
                      </a>
                      <button className="btn-icon" title="Ver detalhes" onClick={() => setSelected(c)} style={{ color: '#4F46E5', borderColor: '#C7D2FE' }}>
                        <Eye size={14} />
                      </button>
                      {onDeleteCandidate && (
                        <button className="btn-icon" title="Excluir candidato" style={{ color: '#DC2626', borderColor: '#FCA5A5' }}
                          onClick={() => { if (window.confirm(`Excluir ${c.name}? Recuperável nas Configurações.`)) onDeleteCandidate(job.id, c.id); }}>
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}
