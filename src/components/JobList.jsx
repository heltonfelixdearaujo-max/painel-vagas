import { useState } from 'react';
import { Search, MapPin, Pencil, Trash2, Users, Plus, Eye, Copy, ExternalLink, Check } from 'lucide-react';
import { jobStatuses } from '../data/mockData';
import { storeJobAndGetLink } from '../utils/jobStorage';

const statusBadge = (s) => {
  const map = { 'Aberta': 'badge-Aberta', 'Em Seleção': 'badge-Em Seleção', 'Encerrada': 'badge-Encerrada' };
  return 'badge ' + (map[s] || '');
};

export default function JobList({ jobs, onNew, onEdit, onDelete, onCandidates }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [copied, setCopied] = useState(null);
  const [linkModal, setLinkModal] = useState(null);

  const depts = [...new Set(jobs.map(j => j.department))].sort();

  const filtered = jobs.filter(j => {
    const q = search.toLowerCase();
    const matchSearch = !q || j.title.toLowerCase().includes(q) || j.department.toLowerCase().includes(q) || j.location.toLowerCase().includes(q);
    const matchStatus = !filterStatus || j.status === filterStatus;
    const matchDept = !filterDept || j.department === filterDept;
    return matchSearch && matchStatus && matchDept;
  });

  const copyLink = async (job) => {
    setCopied(job.id);
    const link = await storeJobAndGetLink(job);
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(link).catch(() => setLinkModal(link));
    } else {
      setLinkModal(link);
    }
    setTimeout(() => setCopied(null), 2500);
  };

  return (
    <><div className="card">
      <div className="card-header">
        <div className="card-title">Vagas Cadastradas</div>
        <button className="btn btn-primary" onClick={onNew}><Plus size={14} /> Nova Vaga</button>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <Search size={14} className="search-icon" />
          <input placeholder="Buscar vaga, área ou local..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Todos os status</option>
          {jobStatuses.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="filter-select" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
          <option value="">Todos os departamentos</option>
          {depts.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>

      <div className="table-wrap">
        {filtered.length === 0 ? (
          <div className="empty"><p>Nenhuma vaga encontrada com os filtros selecionados.</p></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Vaga</th>
                <th>Local</th>
                <th>Tipo</th>
                <th>Status</th>
                <th>Candidatos</th>
                <th>Abertura</th>
                <th>Link Público</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(job => (
                <tr key={job.id}>
                  <td>
                    <div className="job-title">{job.title}</div>
                    <div className="job-dept">{job.department}</div>
                  </td>
                  <td>
                    <div className="td-loc"><MapPin size={12} />{job.location}</div>
                    {job.modality && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2, paddingLeft: 16 }}>{job.modality}</div>}
                  </td>
                  <td><span className="badge badge-type">{job.type}</span></td>
                  <td><span className={statusBadge(job.status)}>{job.status}</span></td>
                  <td>
                    <button className="cand-count" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }} onClick={() => onCandidates(job)}>
                      <Users size={13} /> {job.candidates?.length || 0}
                    </button>
                  </td>
                  <td style={{ color: 'var(--gray-500)', whiteSpace: 'nowrap' }}>
                    {job.openDate ? new Date(job.openDate + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn-icon" title={copied === job.id ? 'Copiado!' : 'Copiar link'} onClick={() => copyLink(job)} style={{ color: copied === job.id ? '#16A34A' : undefined }}>
                        {copied === job.id ? <Check size={13} /> : <Copy size={13} />}
                      </button>
                      <button className="btn-icon" title="Abrir página pública" style={{ display: 'inline-flex', alignItems: 'center' }} onClick={async () => { const l = await storeJobAndGetLink(job); window.open(l, '_blank'); }}>
                        <ExternalLink size={13} />
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="td-actions">
                      <button className="btn-icon" title="Ver candidatos" onClick={() => onCandidates(job)}><Eye size={14} /></button>
                      <button className="btn-icon" title="Editar" onClick={() => onEdit(job)}><Pencil size={14} /></button>
                      <button className="btn-icon" title="Excluir" style={{ color: '#dc2626', borderColor: '#fee2e2' }} onClick={() => onDelete(job.id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>

    {/* Link modal fallback */}
    {linkModal && (
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={() => setLinkModal(null)}>
        <div style={{ background:'white', borderRadius:12, padding:24, width:440, maxWidth:'90vw' }} onClick={e => e.stopPropagation()}>
          <div style={{ fontWeight:700, marginBottom:12 }}>Link da vaga</div>
          <input readOnly value={linkModal} onFocus={e => e.target.select()} style={{ width:'100%', padding:'8px 10px', border:'1px solid #E5E7EB', borderRadius:7, fontSize:12, fontFamily:'monospace', boxSizing:'border-box' }} />
          <div style={{ display:'flex', gap:8, marginTop:12, justifyContent:'flex-end' }}>
            <button onClick={() => { navigator.clipboard?.writeText(linkModal); setLinkModal(null); }} style={{ padding:'8px 16px', background:'#1B5299', color:'white', border:'none', borderRadius:7, cursor:'pointer', fontWeight:600 }}>Copiar e fechar</button>
            <button onClick={() => setLinkModal(null)} style={{ padding:'8px 16px', background:'#F3F4F6', border:'none', borderRadius:7, cursor:'pointer' }}>Fechar</button>
          </div>
        </div>
      </div>
    )}
  </>);
}
