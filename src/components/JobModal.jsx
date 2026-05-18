import { useState } from 'react';
import { X, Plus, Trash2, Copy, ExternalLink } from 'lucide-react';
import { departments, jobTypes, modalities, jobStatuses, salaryRangesBRL, salaryRangesUSD, locationOptions } from '../data/mockData';
import { shortenUrl } from '../utils/shortenUrl';

const empty = { title: '', department: '', location: '', type: 'CLT', salary: '', modality: 'Remoto', status: 'Aberta', description: '', openDate: '' };

function buildApplyLink(job) {
  const { candidates, ...jobData } = job;
  const encoded = encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(jobData)))));
  return `${window.location.origin}${window.location.pathname}#/candidatar/${job.id}?j=${encoded}`;
}

export default function JobModal({ job, onClose, onSave }) {
  const isEdit = Boolean(job?.id);
  const [form, setForm] = useState(job ? { ...job } : { ...empty, openDate: new Date().toISOString().slice(0, 10) });
  const [questions, setQuestions] = useState(job?.screeningQuestions || []);
  const [newQ, setNewQ] = useState({ text: '', required: true, type: 'text' });
  const [addingQ, setAddingQ] = useState(false);
  const [copied, setCopied] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addQuestion = () => {
    if (!newQ.text.trim()) return;
    setQuestions(qs => [...qs, { id: Date.now(), ...newQ }]);
    setNewQ({ text: '', required: true, type: 'text' });
    setAddingQ(false);
  };

  const removeQ = (id) => setQuestions(qs => qs.filter(q => q.id !== id));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.department || !form.location) return;
    onSave({ ...form, screeningQuestions: questions });
  };

  const copyLink = () => {
    if (!job?.id) return;
    setCopied(true);
    shortenUrl(buildApplyLink(job)).then(short => {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(short).catch(() => {});
      }
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 680 }}>
        <div className="modal-header">
          <div>
            <div className="modal-title">{isEdit ? 'Editar Vaga' : 'Nova Vaga'}</div>
            {isEdit && (
              <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'monospace', background: '#F3F4F6', padding: '2px 8px', borderRadius: 6, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {buildApplyLink(job).slice(0, 60)}…
                </span>
                <button className="btn-icon" style={{ padding: 4 }} onClick={copyLink} title={copied ? 'Copiado!' : 'Copiar link'}>
                  <Copy size={13} color={copied ? '#16A34A' : undefined} />
                </button>
                <a href={buildApplyLink(job)} target="_blank" rel="noreferrer" className="btn-icon" style={{ padding: 4 }} title="Abrir página pública">
                  <ExternalLink size={13} />
                </a>
              </div>
            )}
          </div>
          <button className="close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '65vh' }}>
            <div className="form-grid">
              <div className="form-group full">
                <label className="form-label">Título da Vaga *</label>
                <input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ex: Desenvolvedor Frontend Senior" required />
              </div>
              <div className="form-group">
                <label className="form-label">Departamento *</label>
                <select className="form-select" value={form.department} onChange={e => set('department', e.target.value)} required>
                  <option value="">Selecione...</option>
                  {departments.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Localização *</label>
                <select className="form-select" value={form.location} onChange={e => set('location', e.target.value)} required>
                  <option value="">Selecione cidade / estado...</option>
                  {locationOptions.map(({ state, cities }) => (
                    <optgroup key={state} label={state}>
                      {cities.map(c => <option key={c} value={c}>{c}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Tipo de Contrato</label>
                <select className="form-select" value={form.type} onChange={e => { set('type', e.target.value); set('salary', ''); }}>
                  {jobTypes.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Faixa Salarial</label>
                <select className="form-select" value={form.salary} onChange={e => set('salary', e.target.value)}>
                  <option value="">Selecione...</option>
                  {(form.type === 'USD' ? salaryRangesUSD : salaryRangesBRL).map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Modalidade</label>
                <select className="form-select" value={form.modality || 'Remoto'} onChange={e => set('modality', e.target.value)}>
                  {modalities.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                  {jobStatuses.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Data de Abertura</label>
                <input className="form-input" type="date" value={form.openDate} onChange={e => set('openDate', e.target.value)} />
              </div>
              <div className="form-group full">
                <label className="form-label">Descrição da Vaga</label>
                <textarea className="form-textarea" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Descreva responsabilidades, requisitos e diferenciais..." style={{ minHeight: 100 }} />
              </div>
            </div>

            {/* Screening Questions */}
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #F3F4F6' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1F2937' }}>Perguntas de Triagem</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>As respostas alimentam o score de aderência automaticamente</div>
                </div>
                {!addingQ && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAddingQ(true)}>
                    <Plus size={13} /> Adicionar
                  </button>
                )}
              </div>

              {questions.map((q, i) => (
                <div key={q.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', background: '#F9FAFB', borderRadius: 8, marginBottom: 8, border: '1px solid #E5E7EB' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: '#1F2937', fontWeight: 500 }}>{i + 1}. {q.text}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 99, background: '#EEF2FF', color: '#4F46E5', fontWeight: 600 }}>{q.type === 'yesno' ? 'Sim/Não' : 'Texto'}</span>
                      {q.required && <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 99, background: '#FEF2F2', color: '#DC2626', fontWeight: 600 }}>Obrigatória</span>}
                    </div>
                  </div>
                  <button type="button" onClick={() => removeQ(q.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', padding: 2 }}><Trash2 size={13} /></button>
                </div>
              ))}

              {addingQ && (
                <div style={{ padding: 14, border: '1.5px dashed #C7D2FE', borderRadius: 10, background: '#FAFBFF' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10, marginBottom: 10 }}>
                    <div className="form-group">
                      <label className="form-label">Pergunta</label>
                      <input className="form-input" value={newQ.text} onChange={e => setNewQ(q => ({ ...q, text: e.target.value }))} placeholder="Ex: Você tem experiência com..." autoFocus />
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Tipo de Resposta</label>
                        <select className="form-select" value={newQ.type} onChange={e => setNewQ(q => ({ ...q, type: e.target.value }))}>
                          <option value="text">Texto Livre</option>
                          <option value="yesno">Sim / Não</option>
                        </select>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 18 }}>
                        <input type="checkbox" id="req" checked={newQ.required} onChange={e => setNewQ(q => ({ ...q, required: e.target.checked }))} style={{ width: 15, height: 15, cursor: 'pointer' }} />
                        <label htmlFor="req" style={{ fontSize: 12, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>Obrigatória</label>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" className="btn btn-primary btn-sm" onClick={addQuestion}>Adicionar</button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setAddingQ(false); setNewQ({ text: '', required: true, type: 'text' }); }}>Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">{isEdit ? 'Salvar Alterações' : 'Criar Vaga'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
