import { useState } from 'react';
import { Search, MapPin, Pencil, Trash2, Users, Plus, Eye, Copy, ExternalLink, Check } from 'lucide-react';
import { jobStatuses } from '../data/mockData';
import { shortenUrl } from '../utils/shortenUrl';

const statusBadge = (s) => {
  const map = { 'Aberta': 'badge-Aberta', 'Em Seleção': 'badge-Em Seleção', 'Encerrada': 'badge-Encerrada' };
  return 'badge ' + (map[s] || '');
};

function buildApplyLink(job) {
  const { candidates, ...jobData } = job;
  const encoded = encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(jobData)))));
  return `${window.location.origin}${window.location.pathname}#/candidatar/${job.id}?j=${encoded}`;
}

export default function JobList({ jobs, onNew, onEdit, onDelete, onCandidates }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [copied, setCopied] = useState(null);

  const depts = [...new Set(jobs.map(j => j.department))].sort();

  const filtered = jobs.filter(j => {
    const q = search.toLowerCase();
    const matchSearch = !q || j.title.toLowerCase().includes(q) || j.department.toLowerCase().includes(q) || j.location.toLowerCase().includes(q);
    const matchStatus = !filterStatus || j.status === filterStatus;
    const matchDept = !filterDept || j.department === filterDept;
    return matchSearch && matchStatus && matchDept;
  });

  const copyLink = (job) => {
    const long = buildApplyLink(job);
    setCopied(job.id);
    shortenUrl(long).then(short => {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(short).catch(() => {});
      }
      setTimeout(() => setCopied(null), 2500);
    });
  };

  return (
    <div className="card">
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
                      <a href={buildApplyLink(job)} target="_blank" rel="noreferrer" className="btn-icon" title="Abrir página pública" style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <ExternalLink size={13} />
                      </a>
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
  );
}
