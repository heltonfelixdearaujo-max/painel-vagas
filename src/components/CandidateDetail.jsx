import { useState } from 'react';
import { X, MessageCircle, FileText, Plus, Trash2, Globe, ChevronDown, Download, Pencil, Share2, Bell } from 'lucide-react';
import { whatsAppLink } from '../utils/whatsapp';
import { generatePDF } from '../utils/pdfExport';
import { discProfiles } from '../data/discQuestions';
import { languages, languageLevels, processStages, candidateStatuses } from '../data/mockData';
import DiscChart from './DiscChart';
import { shortenUrl } from '../utils/shortenUrl';

const recStyle = {
  recommended: { bg: '#DCFCE7', color: '#16A34A', label: 'Recomendado ✓' },
  recommended_with_caveats: { bg: '#FEF3C7', color: '#D97706', label: 'Recomendado com Ressalvas' },
  not_recommended: { bg: '#FEE2E2', color: '#DC2626', label: 'Não Recomendado' },
};

const statusColors = { Inscrito: '#0891B2', Triagem: '#7C3AED', Entrevista: '#D97706', Aprovado: '#16A34A', Reprovado: '#DC2626' };

export default function CandidateDetail({ candidate, job, onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [newComment, setNewComment] = useState({ interviewer: '', stage: processStages[0], observation: '', observationEn: '', observationZh: '' });
  const [addingComment, setAddingComment] = useState(false);
  const [commentFormLang, setCommentFormLang] = useState('pt');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentForm, setEditCommentForm] = useState(null);
  const [editCommentLang, setEditCommentLang] = useState('pt');
  const [newLang, setNewLang] = useState({ language: 'Inglês', level: 'Intermediário', notes: '', notesEn: '', notesZh: '' });
  const [addingLang, setAddingLang] = useState(false);
  const [langFormLang, setLangFormLang] = useState('pt');
  const [showPdfMenu, setShowPdfMenu] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareToast, setShareToast] = useState('');
  const [shareLinkModal, setShareLinkModal] = useState(null);
  const [editingAnalysis, setEditingAnalysis] = useState(false);
  const [analysisForm, setAnalysisForm] = useState(null);
  const [formLang, setFormLang] = useState('pt');

  const disc = candidate.disc || {};
  const ai = candidate.aiAnalysis || {};
  const profile = discProfiles[disc.profile];
  const rec = recStyle[ai.recommendation] || recStyle.recommended_with_caveats;
  const waLink = whatsAppLink(candidate.whatsapp || '', candidate.name, job?.title || '');

  const update = (patch) => onUpdate({ ...candidate, ...patch });

  // ── Share report link ──
  const generateShareLink = (lang) => {
    const shareId = `share-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    // Compact payload for URL (no resumeFile binary)
    const { resumeFile, ...candidateCompact } = candidate;
    const urlPayload = { shareId, candidate: candidateCompact, job: { title: job?.title, department: job?.department }, lang };

    // btoa safe for Unicode (accents, special chars)
    const encoded = encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(urlPayload)))));
    const url = `${window.location.origin}${window.location.pathname}#/relatorio?d=${encoded}&l=${lang}`;

    // Full record for localStorage (with resume for same-device download)
    const shareRecord = {
      id: shareId, candidateId: candidate.id, candidateName: candidate.name,
      jobTitle: job?.title, sharedAt: new Date().toISOString(), lang,
      resumeFile: candidate.resumeFile || null, resumeFileName: candidate.resumeFileName || null,
      feedbacks: [],
    };
    try {
      const existing = JSON.parse(localStorage.getItem('wayzim-shares') || '[]');
      localStorage.setItem('wayzim-shares', JSON.stringify([...existing, shareRecord]));
    } catch {}

    setShowShareMenu(false);
    setShareToast('Encurtando link…');

    shortenUrl(url).then(shortUrl => {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(shortUrl).then(() => {
          setShareToast('Link copiado! ✓');
          setTimeout(() => setShareToast(''), 3500);
        }).catch(() => {
          setShareLinkModal(shortUrl);
          setShareToast('');
        });
      } else {
        setShareLinkModal(shortUrl);
        setShareToast('');
      }
    });
  };

  // ── Get unread feedbacks for this candidate ──
  const getUnreadFeedbacks = () => {
    try {
      const shares = JSON.parse(localStorage.getItem('wayzim-shares') || '[]');
      const mine = shares.filter(s => s.candidateId === candidate.id);
      return mine.flatMap(s => (s.feedbacks || []).filter(f => !f.read));
    } catch { return []; }
  };

  const markFeedbacksRead = () => {
    try {
      const shares = JSON.parse(localStorage.getItem('wayzim-shares') || '[]');
      const updated = shares.map(s => s.candidateId === candidate.id
        ? { ...s, feedbacks: (s.feedbacks || []).map(f => ({ ...f, read: true })) }
        : s);
      localStorage.setItem('wayzim-shares', JSON.stringify(updated));
    } catch {}
  };

  const openEditForm = () => {
    setAnalysisForm({
      technicalScore: ai.technicalScore ?? '',
      behavioralScore: ai.behavioralScore ?? '',
      seniority: ai.seniority || 'Pleno',
      recommendation: ai.recommendation || 'recommended_with_caveats',
      qualitativeSummary: ai.qualitativeSummary || '',
      strengths: (ai.strengths || []).join('\n'),
      gaps: (ai.gaps || []).join('\n'),
      risks: (ai.risks || []).join('\n'),
      qualitativeSummaryEn: ai.qualitativeSummaryEn || '',
      strengthsEn: (ai.strengthsEn || []).join('\n'),
      gapsEn: (ai.gapsEn || []).join('\n'),
      risksEn: (ai.risksEn || []).join('\n'),
      qualitativeSummaryZh: ai.qualitativeSummaryZh || '',
      strengthsZh: (ai.strengthsZh || []).join('\n'),
      gapsZh: (ai.gapsZh || []).join('\n'),
      risksZh: (ai.risksZh || []).join('\n'),
    });
    setFormLang('pt');
    setEditingAnalysis(true);
  };

  const saveAnalysis = () => {
    const tech = Math.min(100, Math.max(0, parseInt(analysisForm.technicalScore) || 0));
    const beh  = Math.min(100, Math.max(0, parseInt(analysisForm.behavioralScore) || 0));
    const lines = t => (t || '').split('\n').map(s => s.trim()).filter(Boolean);
    update({
      aiAnalysis: {
        technicalScore: tech,
        behavioralScore: beh,
        adherenceScore: Math.round(tech * 0.6 + beh * 0.4),
        seniority: analysisForm.seniority,
        recommendation: analysisForm.recommendation,
        qualitativeSummary: analysisForm.qualitativeSummary.trim(),
        strengths: lines(analysisForm.strengths),
        gaps:      lines(analysisForm.gaps),
        risks:     lines(analysisForm.risks),
        qualitativeSummaryEn: analysisForm.qualitativeSummaryEn.trim(),
        strengthsEn: lines(analysisForm.strengthsEn),
        gapsEn:      lines(analysisForm.gapsEn),
        risksEn:     lines(analysisForm.risksEn),
        qualitativeSummaryZh: analysisForm.qualitativeSummaryZh.trim(),
        strengthsZh: lines(analysisForm.strengthsZh),
        gapsZh:      lines(analysisForm.gapsZh),
        risksZh:     lines(analysisForm.risksZh),
        analyzedAt: new Date().toISOString(),
        source: 'manual',
      },
    });
    setEditingAnalysis(false);
  };

  const setField = (k, v) => setAnalysisForm(f => ({ ...f, [k]: v }));

  const addComment = () => {
    if (!newComment.interviewer || !newComment.observation) return;
    const comment = { id: Date.now(), ...newComment, date: new Date().toLocaleDateString('pt-BR') };
    update({ interviewComments: [...(candidate.interviewComments || []), comment] });
    setNewComment({ interviewer: '', stage: processStages[0], observation: '', observationEn: '', observationZh: '' });
    setCommentFormLang('pt');
    setAddingComment(false);
  };

  const removeComment = (id) => update({ interviewComments: (candidate.interviewComments || []).filter(c => c.id !== id) });

  const startEditComment = (c) => {
    setEditingCommentId(c.id);
    setEditCommentForm({ interviewer: c.interviewer, stage: c.stage, observation: c.observation || '', observationEn: c.observationEn || '', observationZh: c.observationZh || '' });
    setEditCommentLang('pt');
  };

  const saveEditComment = () => {
    if (!editCommentForm.interviewer || !editCommentForm.observation) return;
    update({ interviewComments: (candidate.interviewComments || []).map(c => c.id === editingCommentId ? { ...c, ...editCommentForm } : c) });
    setEditingCommentId(null);
    setEditCommentForm(null);
  };

  const addLanguage = () => {
    update({ languages: [...(candidate.languages || []), { ...newLang }] });
    setNewLang({ language: 'Inglês', level: 'Intermediário', notes: '', notesEn: '', notesZh: '' });
    setLangFormLang('pt');
    setAddingLang(false);
  };

  const removeLang = (i) => update({ languages: (candidate.languages || []).filter((_, idx) => idx !== i) });

  const unreadFeedbacks = getUnreadFeedbacks();
  const tabs = [
    { id: 'overview', label: 'Visão Geral' },
    { id: 'disc', label: 'DISC' },
    { id: 'screening', label: 'Triagem' },
    { id: 'comments', label: `Entrevistas (${(candidate.interviewComments || []).length})` },
    { id: 'languages', label: 'Idiomas' },
    { id: 'feedbacks', label: `Feedbacks${unreadFeedbacks.length > 0 ? ` 🔴${unreadFeedbacks.length}` : ''}` },
  ];

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 820, maxHeight: '92vh' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#EEF2FF', color: '#4F46E5', fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {candidate.name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>{candidate.name}</h2>
              {ai.recommendation && (
                <span style={{ padding: '3px 10px', background: rec.bg, color: rec.color, borderRadius: 99, fontSize: 11, fontWeight: 700 }}>{rec.label}</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#6B7280' }}>📍 {candidate.city}</span>
              <span style={{ fontSize: 12, color: '#6B7280' }}>💼 {candidate.salaryClaim}</span>
              <span style={{ fontSize: 12, color: '#6B7280' }}>📅 {candidate.startAvailability}</span>
              {candidate.currentlyWorking && <span style={{ fontSize: 12, color: '#6B7280' }}>🏢 {candidate.currentlyWorking === 'Sim' ? 'Empregado' : 'Disponível'}</span>}
              {candidate.linkedin && candidate.linkedin !== 'https://www.linkedin.com/in/' && (
                <a href={candidate.linkedin} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#0A66C2', fontWeight: 600, textDecoration: 'none', background: '#EFF6FF', padding: '2px 8px', borderRadius: 99 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  LinkedIn
                </a>
              )}
            </div>
          </div>
          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <select value={candidate.status} onChange={e => update({ status: e.target.value })} style={{ padding: '6px 10px', borderRadius: 8, border: `2px solid ${statusColors[candidate.status] || '#E5E7EB'}`, fontSize: 12, fontWeight: 700, color: statusColors[candidate.status] || '#374151', background: 'white', cursor: 'pointer' }}>
              {candidateStatuses.map(s => <option key={s}>{s}</option>)}
            </select>
            <a href={waLink} target="_blank" rel="noreferrer" title="WhatsApp" className="btn-icon" style={{ color: '#16A34A', borderColor: '#BBF7D0' }}>
              <MessageCircle size={15} />
            </a>
            {candidate.resumeFileName && (
              candidate.resumeFile
                ? (
                  <a
                    href={candidate.resumeFile}
                    download={candidate.resumeFileName}
                    title={`Baixar currículo — ${candidate.resumeFileName}`}
                    className="btn-icon"
                    style={{ color: '#4F46E5', borderColor: '#C7D2FE', display: 'inline-flex', alignItems: 'center' }}
                  >
                    <FileText size={15} />
                  </a>
                ) : (
                  <span
                    title={`Currículo: ${candidate.resumeFileName} (arquivo não disponível para download — candidato do período anterior)`}
                    className="btn-icon"
                    style={{ color: '#9CA3AF', borderColor: '#E5E7EB', cursor: 'default', display: 'inline-flex', alignItems: 'center' }}
                  >
                    <FileText size={15} />
                  </span>
                )
            )}
            {/* Share button */}
            <div style={{ position: 'relative' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => { setShowShareMenu(s => !s); setShowPdfMenu(false); }} style={{ gap: 4, color: '#059669', borderColor: '#D1FAE5' }}>
                <Share2 size={13} /> Compartilhar <ChevronDown size={11} />
              </button>
              {showShareMenu && (
                <div style={{ position: 'absolute', right: 0, top: '110%', background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, boxShadow: '0 10px 25px rgba(0,0,0,.1)', zIndex: 100, minWidth: 200, overflow: 'hidden' }}>
                  <div style={{ padding: '8px 14px 4px', fontSize: 10, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>Idioma do Relatório</div>
                  {[{ code: 'pt', flag: '🇧🇷', label: 'Português' }, { code: 'en', flag: '🇺🇸', label: 'English' }, { code: 'zh', flag: '🇨🇳', label: '中文' }].map(l => (
                    <button key={l.code} onClick={() => generateShareLink(l.code)} style={{ width: '100%', padding: '10px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, display: 'flex', gap: 8, color: '#374151' }}>
                      {l.flag} {l.label} — <span style={{ color: '#6B7280', fontSize: 12 }}>Copiar link</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* PDF button */}
            <div style={{ position: 'relative' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => { setShowPdfMenu(s => !s); setShowShareMenu(false); }} style={{ gap: 4 }}>
                <Download size={13} /> PDF <ChevronDown size={11} />
              </button>
              {showPdfMenu && (
                <div style={{ position: 'absolute', right: 0, top: '110%', background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, boxShadow: '0 10px 25px rgba(0,0,0,.1)', zIndex: 100, minWidth: 160, overflow: 'hidden' }}>
                  {[{ code: 'pt', flag: '🇧🇷', label: 'Português' }, { code: 'en', flag: '🇺🇸', label: 'English' }, { code: 'zh', flag: '🇨🇳', label: '中文' }].map(l => (
                    <button key={l.code} onClick={() => { generatePDF(candidate, job, l.code); setShowPdfMenu(false); }} style={{ width: '100%', padding: '10px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, display: 'flex', gap: 8, color: '#374151' }}>
                      {l.flag} {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Share toast */}
            {shareToast && (
              <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#059669', color: 'white', padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, boxShadow: '0 4px 14px rgba(0,0,0,.2)', zIndex: 9999 }}>
                🔗 {shareToast}
              </div>
            )}

            {/* Share link modal */}
            {shareLinkModal && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShareLinkModal(null)}>
                <div style={{ background: 'white', borderRadius: 16, padding: '28px 28px 24px', maxWidth: 520, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,.25)' }} onClick={e => e.stopPropagation()}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 6 }}>🔗 Link do relatório gerado</div>
                  <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>Copie o link abaixo e envie para quem vai avaliar o candidato.</p>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      readOnly
                      value={shareLinkModal}
                      onFocus={e => e.target.select()}
                      style={{ flex: 1, padding: '9px 12px', border: '1.5px solid #C7D2FE', borderRadius: 8, fontSize: 11, color: '#374151', fontFamily: 'monospace', background: '#F5F3FF', outline: 'none', wordBreak: 'break-all' }}
                    />
                    <button
                      onClick={() => {
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText(shareLinkModal).then(() => {
                            setShareToast('Link copiado! ✓');
                            setShareLinkModal(null);
                            setTimeout(() => setShareToast(''), 3000);
                          });
                        } else {
                          document.execCommand('copy');
                        }
                      }}
                      style={{ padding: '9px 18px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
                    >
                      Copiar
                    </button>
                  </div>
                  <button onClick={() => setShareLinkModal(null)} style={{ marginTop: 16, fontSize: 12, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Fechar</button>
                </div>
              </div>
            )}

            <button className="close-btn" onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', padding: '0 16px' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: '10px 11px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: activeTab === t.id ? 700 : 500, color: activeTab === t.id ? '#4F46E5' : '#6B7280', borderBottom: `2px solid ${activeTab === t.id ? '#4F46E5' : 'transparent'}`, whiteSpace: 'nowrap', transition: 'all .15s', flexShrink: 0 }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>

          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div>

              {/* Edit button + last updated */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                  {ai.analyzedAt ? `Última atualização: ${new Date(ai.analyzedAt).toLocaleString('pt-BR')}` : 'Nenhuma avaliação registrada ainda'}
                </div>
                <button onClick={openEditForm} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#374151', cursor: 'pointer' }}>
                  <Pencil size={13} /> {ai.technicalScore != null ? 'Editar Avaliação' : 'Preencher Avaliação'}
                </button>
              </div>

              {/* Manual edit form */}
              {editingAnalysis && analysisForm && (
                <div style={{ background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 12, padding: 20, marginBottom: 20 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: '#111827', marginBottom: 16 }}>Preencher Avaliação do Candidato</div>

                  {/* Scores */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                    <div className="form-group">
                      <label className="form-label">Score Técnico (0–100)</label>
                      <input className="form-input" type="number" min="0" max="100" value={analysisForm.technicalScore} onChange={e => setField('technicalScore', e.target.value)} placeholder="Ex: 72" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Score Comportamental (0–100)</label>
                      <input className="form-input" type="number" min="0" max="100" value={analysisForm.behavioralScore} onChange={e => setField('behavioralScore', e.target.value)} placeholder="Ex: 85" />
                    </div>
                  </div>

                  {/* Seniority + Recommendation */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                    <div className="form-group">
                      <label className="form-label">Senioridade</label>
                      <select className="form-select" value={analysisForm.seniority} onChange={e => setField('seniority', e.target.value)}>
                        {['Estágio/Trainee', 'Júnior', 'Pleno', 'Sênior'].map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Recomendação</label>
                      <select className="form-select" value={analysisForm.recommendation} onChange={e => setField('recommendation', e.target.value)}>
                        <option value="recommended">Recomendado</option>
                        <option value="recommended_with_caveats">Recomendado com ressalvas</option>
                        <option value="not_recommended">Não recomendado</option>
                      </select>
                    </div>
                  </div>

                  {/* Language tabs for text fields */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', gap: 3, padding: 3, background: '#F3F4F6', borderRadius: 8, width: 'fit-content', marginBottom: 10 }}>
                      {[{ code: 'pt', flag: '🇧🇷', label: 'Português' }, { code: 'en', flag: '🇺🇸', label: 'English' }, { code: 'zh', flag: '🇨🇳', label: '中文' }].map(l => (
                        <button key={l.code} onClick={() => setFormLang(l.code)} style={{ padding: '5px 12px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700, background: formLang === l.code ? 'white' : 'transparent', color: formLang === l.code ? '#4F46E5' : '#6B7280', boxShadow: formLang === l.code ? '0 1px 3px rgba(0,0,0,.1)' : 'none', transition: 'all .15s' }}>
                          {l.flag} {l.label}
                        </button>
                      ))}
                    </div>
                    {formLang !== 'pt' && (
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                        ✏️ Opcional — se preenchido, será usado na exportação em {formLang === 'en' ? 'inglês' : 'chinês'}. Se vazio, o conteúdo em português será usado como fallback.
                      </div>
                    )}
                  </div>

                  {/* Qualitative Summary — language-aware */}
                  {formLang === 'pt' && (
                    <div className="form-group" style={{ marginBottom: 14 }}>
                      <label className="form-label">Parecer Qualitativo</label>
                      <textarea className="form-textarea" rows={4} value={analysisForm.qualitativeSummary} onChange={e => setField('qualitativeSummary', e.target.value)} placeholder="Descreva a avaliação técnica do candidato em relação à vaga..." />
                    </div>
                  )}
                  {formLang === 'en' && (
                    <div className="form-group" style={{ marginBottom: 14 }}>
                      <label className="form-label">Qualitative Summary</label>
                      <textarea className="form-textarea" rows={4} value={analysisForm.qualitativeSummaryEn} onChange={e => setField('qualitativeSummaryEn', e.target.value)} placeholder="Describe the candidate's technical assessment for this role..." />
                    </div>
                  )}
                  {formLang === 'zh' && (
                    <div className="form-group" style={{ marginBottom: 14 }}>
                      <label className="form-label">定性总结</label>
                      <textarea className="form-textarea" rows={4} value={analysisForm.qualitativeSummaryZh} onChange={e => setField('qualitativeSummaryZh', e.target.value)} placeholder="描述候选人与职位的技术匹配度..." />
                    </div>
                  )}

                  {/* Strengths / Gaps / Risks — language-aware */}
                  {formLang === 'pt' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
                      <div className="form-group">
                        <label className="form-label">Pontos Fortes <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(um por linha)</span></label>
                        <textarea className="form-textarea" rows={4} value={analysisForm.strengths} onChange={e => setField('strengths', e.target.value)} placeholder={"Experiência em X\nAtuou como Y\nConhecimento em Z"} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Gaps <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(um por linha)</span></label>
                        <textarea className="form-textarea" rows={4} value={analysisForm.gaps} onChange={e => setField('gaps', e.target.value)} placeholder={"Sem experiência em X\nNão evidenciou Y\nNível abaixo em Z"} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Alertas <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(um por linha)</span></label>
                        <textarea className="form-textarea" rows={4} value={analysisForm.risks} onChange={e => setField('risks', e.target.value)} placeholder={"Pretensão acima da faixa\nSenioridade abaixo\nRequisito crítico ausente"} />
                      </div>
                    </div>
                  )}
                  {formLang === 'en' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
                      <div className="form-group">
                        <label className="form-label">Strengths <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(one per line)</span></label>
                        <textarea className="form-textarea" rows={4} value={analysisForm.strengthsEn} onChange={e => setField('strengthsEn', e.target.value)} placeholder={"Experience in X\nWorked as Y\nKnowledge of Z"} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Gaps <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(one per line)</span></label>
                        <textarea className="form-textarea" rows={4} value={analysisForm.gapsEn} onChange={e => setField('gapsEn', e.target.value)} placeholder={"No experience in X\nDid not demonstrate Y\nBelow level in Z"} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Risk Points <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(one per line)</span></label>
                        <textarea className="form-textarea" rows={4} value={analysisForm.risksEn} onChange={e => setField('risksEn', e.target.value)} placeholder={"Salary above budget\nBelow required seniority\nMissing critical requirement"} />
                      </div>
                    </div>
                  )}
                  {formLang === 'zh' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
                      <div className="form-group">
                        <label className="form-label">优势 <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(每行一项)</span></label>
                        <textarea className="form-textarea" rows={4} value={analysisForm.strengthsZh} onChange={e => setField('strengthsZh', e.target.value)} placeholder={"X方面的经验\n担任Y职位\nZ领域知识"} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">差距 <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(每行一项)</span></label>
                        <textarea className="form-textarea" rows={4} value={analysisForm.gapsZh} onChange={e => setField('gapsZh', e.target.value)} placeholder={"无X经验\n未展示Y\nZ水平不足"} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">风险点 <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(每行一项)</span></label>
                        <textarea className="form-textarea" rows={4} value={analysisForm.risksZh} onChange={e => setField('risksZh', e.target.value)} placeholder={"薪资超出预算\n资历不足\n缺少关键要求"} />
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary btn-sm" onClick={saveAnalysis}>Salvar Avaliação</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditingAnalysis(false)}>Cancelar</button>
                  </div>
                </div>
              )}

              {!editingAnalysis && (
                <>
                  {/* Scores */}
                  {(ai.technicalScore != null || ai.behavioralScore != null) && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                      {[
                        { label: 'Score Técnico', sub: 'Cobertura real dos requisitos da vaga', value: ai.technicalScore, color: '#0891B2' },
                        { label: 'Score Comportamental', sub: 'Alinhamento DISC × perfil esperado', value: ai.behavioralScore, color: '#10B981' },
                      ].map(s => (
                        <div key={s.label} style={{ background: '#F9FAFB', borderRadius: 12, padding: '18px 20px', textAlign: 'center', border: '1px solid #E5E7EB' }}>
                          <div style={{ fontSize: 42, fontWeight: 900, color: s.value >= 70 ? s.color : s.value >= 50 ? '#D97706' : '#DC2626', lineHeight: 1 }}>{s.value ?? '—'}%</div>
                          <div style={{ fontSize: 12, color: '#374151', fontWeight: 700, marginTop: 6 }}>{s.label}</div>
                          <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>{s.sub}</div>
                          <div style={{ height: 5, background: '#E5E7EB', borderRadius: 99, marginTop: 10, overflow: 'hidden' }}>
                            <div style={{ width: `${s.value ?? 0}%`, height: '100%', background: s.value >= 70 ? s.color : s.value >= 50 ? '#F59E0B' : '#EF4444', borderRadius: 99, transition: 'width .6s ease' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Qualitative summary */}
                  {ai.qualitativeSummary && (
                    <div style={{ padding: '14px 16px', background: '#EEF2FF', borderRadius: 10, marginBottom: 16, fontSize: 13, color: '#374151', lineHeight: 1.7, borderLeft: '3px solid #4F46E5' }}>
                      <div style={{ fontWeight: 700, fontSize: 11, color: '#4F46E5', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>📋 Resumo Qualitativo</div>
                      {ai.qualitativeSummary}
                    </div>
                  )}

                  {/* Strengths */}
                  {ai.strengths?.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#16A34A', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.06em' }}>✅ Pontos Fortes — evidências do currículo</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {ai.strengths.map((s, i) => (
                          <div key={i} style={{ padding: '10px 14px', background: '#F0FDF4', borderRadius: 8, borderLeft: '3px solid #16A34A', fontSize: 13, color: '#14532D', lineHeight: 1.6 }}>{s}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Gaps */}
                  {ai.gaps?.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#D97706', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.06em' }}>⚠️ Gaps — requisitos não evidenciados no currículo</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {ai.gaps.map((g, i) => (
                          <div key={i} style={{ padding: '10px 14px', background: '#FFFBEB', borderRadius: 8, borderLeft: '3px solid #F59E0B', fontSize: 13, color: '#78350F', lineHeight: 1.6 }}>{g}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Risks */}
                  {ai.risks?.length > 0 && (
                    <div style={{ background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#DC2626', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.05em' }}>🚨 Alertas</div>
                      {ai.risks.map((r, i) => (
                        <div key={i} style={{ fontSize: 12, color: '#7F1D1D', marginBottom: 4, paddingLeft: 12, borderLeft: '2px solid #FCA5A5', lineHeight: 1.5 }}>{r}</div>
                      ))}
                    </div>
                  )}


                  {/* Empty state */}
                  {ai.technicalScore == null && !ai.qualitativeSummary && (
                    <div style={{ textAlign: 'center', padding: '32px 20px', color: '#9CA3AF' }}>
                      <Pencil size={32} style={{ margin: '0 auto 10px', opacity: .3 }} />
                      <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Nenhuma avaliação registrada</p>
                      <p style={{ fontSize: 12 }}>Clique em "Preencher Avaliação" para registrar scores, parecer e gaps deste candidato.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* DISC */}
          {activeTab === 'disc' && (
            <div>
              {disc.profile ? (() => {
                const secondaryKey = Object.entries(disc.scores || {})
                  .filter(([k]) => k !== disc.profile)
                  .sort(([,a],[,b]) => b - a)[0]?.[0];
                const secondary = secondaryKey ? discProfiles[secondaryKey] : null;
                return (
                  <div>
                    {/* Header: chart + profile card + score bars */}
                    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 20 }}>
                      <DiscChart scores={disc.scores} profile={disc.profile} size={170} />
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ padding: '14px 16px', background: profile?.bg, borderRadius: 10, borderLeft: `4px solid ${profile?.color}`, marginBottom: 12 }}>
                          <div style={{ fontSize: 22 }}>{profile?.emoji}</div>
                          <div style={{ fontWeight: 800, fontSize: 20, color: profile?.color }}>{profile?.title}</div>
                          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{profile?.subtitle}</div>
                        </div>
                        <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, marginBottom: 12 }}>{profile?.summary}</p>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                          {profile?.strengths?.map(s => <span key={s} style={{ padding: '3px 10px', background: profile.bg, color: profile.color, borderRadius: 99, fontSize: 11, fontWeight: 700 }}>{s}</span>)}
                        </div>
                        {Object.entries(disc.scores || {}).map(([k, v]) => {
                          const p = discProfiles[k];
                          return (
                            <div key={k} style={{ marginBottom: 8 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                <span style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>{p?.label} ({k})</span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: p?.color }}>{v}%</span>
                              </div>
                              <div style={{ height: 7, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
                                <div style={{ width: `${v}%`, height: '100%', background: p?.color, borderRadius: 99, transition: 'width .6s ease' }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Situational behaviors */}
                    <div style={{ marginBottom: 24 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>Como este perfil se comporta no dia a dia</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {profile?.behaviors?.map((b, i) => (
                          <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 14px', background: profile.bg, borderRadius: 10, borderLeft: `3px solid ${profile.color}` }}>
                            <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1.4 }}>{b.icon}</span>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: profile.color, marginBottom: 3 }}>{b.title}</div>
                              <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7 }}>{b.text}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Communication style */}
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Estilo de Comunicação</div>
                      <div style={{ padding: '14px 16px', background: '#F9FAFB', borderRadius: 10, border: '1px solid #E5E7EB' }}>
                        <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, marginBottom: 10 }}>{profile?.communication?.style}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {profile?.communication?.tips?.map((tip, i) => (
                            <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: '#4B5563', lineHeight: 1.6 }}>
                              <span style={{ color: profile.color, fontWeight: 700, flexShrink: 0 }}>→</span>
                              {tip}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Leadership + Conflict grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                      <div style={{ padding: '14px 16px', background: '#F9FAFB', borderRadius: 10, border: '1px solid #E5E7EB' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>👑 Estilo de Liderança</div>
                        <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7 }}>{profile?.leadership}</div>
                      </div>
                      <div style={{ padding: '14px 16px', background: '#F9FAFB', borderRadius: 10, border: '1px solid #E5E7EB' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>⚖️ Gestão de Conflito</div>
                        <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7 }}>{profile?.conflict}</div>
                      </div>
                    </div>

                    {/* Motivators + Demotivators */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#16A34A', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>✅ O que energiza este perfil</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {profile?.motivators?.map((m, i) => (
                            <div key={i} style={{ padding: '8px 12px', background: '#F0FDF4', borderRadius: 8, borderLeft: '3px solid #16A34A', fontSize: 12, color: '#14532D', lineHeight: 1.5 }}>{m}</div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>🚫 O que drena este perfil</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {profile?.demotivators?.map((d, i) => (
                            <div key={i} style={{ padding: '8px 12px', background: '#FEF2F2', borderRadius: 8, borderLeft: '3px solid #DC2626', fontSize: 12, color: '#7F1D1D', lineHeight: 1.5 }}>{d}</div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Blind spots */}
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#D97706', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>⚠️ Pontos Cegos — onde este perfil pode falhar</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                        {profile?.blindSpots?.map((b, i) => (
                          <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 14px', background: '#FFFBEB', borderRadius: 8, borderLeft: '3px solid #F59E0B' }}>
                            <span style={{ color: '#D97706', fontWeight: 700, flexShrink: 0 }}>!</span>
                            <span style={{ fontSize: 13, color: '#78350F', lineHeight: 1.6 }}>{b}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Secondary profile influence */}
                    {secondary && disc.scores[secondaryKey] >= 25 && (
                      <div style={{ padding: '14px 16px', background: secondary.bg, borderRadius: 10, borderLeft: `3px solid ${secondary.color}` }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: secondary.color, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
                          {secondary.emoji} Influência do Perfil Secundário — {secondary.label} ({secondaryKey}: {disc.scores[secondaryKey]}%)
                        </div>
                        <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7 }}>
                          Com {disc.scores[secondaryKey]}% de {secondary.label}, este candidato também carrega traços de <strong>{secondary.title}</strong>: {secondary.summary.split('.')[0].toLowerCase()}.
                          {' '}Essa combinação {disc.profile}{secondaryKey} tende a {
                            disc.profile === 'D' && secondaryKey === 'I' ? 'unir força de execução com capacidade de influenciar e engajar — liderança de alto impacto.' :
                            disc.profile === 'D' && secondaryKey === 'C' ? 'combinar velocidade de decisão com rigor analítico — exigente consigo e com o time.' :
                            disc.profile === 'D' && secondaryKey === 'S' ? 'equilibrar assertividade com sensibilidade às relações — liderança mais humana.' :
                            disc.profile === 'I' && secondaryKey === 'D' ? 'combinar entusiasmo com orientação a resultados — perfil de vendas e liderança.' :
                            disc.profile === 'I' && secondaryKey === 'S' ? 'unir comunicação com cuidado genuíno com as pessoas — muito eficaz em RH, CS e cultura.' :
                            disc.profile === 'I' && secondaryKey === 'C' ? 'equilibrar criatividade com rigor — o perfil mais raro e versátil do DISC.' :
                            disc.profile === 'S' && secondaryKey === 'I' ? 'unir estabilidade com comunicação — perfil naturalmente harmonioso e empático.' :
                            disc.profile === 'S' && secondaryKey === 'C' ? 'combinar consistência com precisão — entrega metódica e confiável.' :
                            disc.profile === 'S' && secondaryKey === 'D' ? 'equilibrar paciência com assertividade quando necessário — resiliência com resultado.' :
                            disc.profile === 'C' && secondaryKey === 'D' ? 'combinar análise profunda com orientação à ação — evita a paralisia por análise.' :
                            disc.profile === 'C' && secondaryKey === 'S' ? 'unir precisão com cuidado interpessoal — analista que também sabe ouvir.' :
                            disc.profile === 'C' && secondaryKey === 'I' ? 'equilibrar rigor com comunicação — transforma análise complexa em mensagem acessível.' :
                            'gerar um perfil com características complementares às do perfil dominante.'
                          }
                        </div>
                      </div>
                    )}
                  </div>
                );
              })() : (
                <div className="empty"><p>DISC ainda não realizado</p></div>
              )}
            </div>
          )}

          {/* SCREENING */}
          {activeTab === 'screening' && (
            <div>
              {job?.screeningQuestions?.length > 0 ? (
                job.screeningQuestions.map(q => {
                  const ans = candidate.screeningAnswers?.find(a => a.questionId === q.id);
                  return (
                    <div key={q.id} style={{ marginBottom: 16, padding: '14px 16px', background: '#F9FAFB', borderRadius: 10, borderLeft: '3px solid #C7D2FE' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1F2937', marginBottom: 6 }}>{q.text}</div>
                      <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{ans?.answer || <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>Sem resposta</span>}</div>
                    </div>
                  );
                })
              ) : (
                <div className="empty"><p>Sem perguntas de triagem nesta vaga</p></div>
              )}
            </div>
          )}

          {/* COMMENTS */}
          {activeTab === 'comments' && (
            <div>
              {(candidate.interviewComments || []).map(c => (
                <div key={c.id} style={{ padding: '14px 16px', background: '#F9FAFB', borderRadius: 10, marginBottom: 10, borderLeft: '3px solid #4F46E5' }}>
                  {editingCommentId === c.id ? (
                    /* ── Edit form ── */
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                        <div className="form-group">
                          <label className="form-label">Entrevistador</label>
                          <input className="form-input" value={editCommentForm.interviewer} onChange={e => setEditCommentForm(f => ({ ...f, interviewer: e.target.value }))} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Etapa</label>
                          <select className="form-select" value={editCommentForm.stage} onChange={e => setEditCommentForm(f => ({ ...f, stage: e.target.value }))}>
                            {processStages.map(s => <option key={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', gap: 3, padding: 3, background: '#F3F4F6', borderRadius: 8, width: 'fit-content', marginBottom: 8 }}>
                          {[{ code: 'pt', flag: '🇧🇷', label: 'PT' }, { code: 'en', flag: '🇺🇸', label: 'EN' }, { code: 'zh', flag: '🇨🇳', label: 'ZH' }].map(l => (
                            <button key={l.code} onClick={() => setEditCommentLang(l.code)} style={{ padding: '4px 10px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700, background: editCommentLang === l.code ? 'white' : 'transparent', color: editCommentLang === l.code ? '#4F46E5' : '#6B7280', boxShadow: editCommentLang === l.code ? '0 1px 3px rgba(0,0,0,.1)' : 'none', transition: 'all .15s' }}>
                              {l.flag} {l.label}
                            </button>
                          ))}
                        </div>
                        {editCommentLang === 'pt' && <div className="form-group"><label className="form-label">Observação</label><textarea className="form-textarea" value={editCommentForm.observation} onChange={e => setEditCommentForm(f => ({ ...f, observation: e.target.value }))} /></div>}
                        {editCommentLang === 'en' && <div className="form-group"><label className="form-label">Observation (English)</label><textarea className="form-textarea" value={editCommentForm.observationEn} onChange={e => setEditCommentForm(f => ({ ...f, observationEn: e.target.value }))} /></div>}
                        {editCommentLang === 'zh' && <div className="form-group"><label className="form-label">备注 (中文)</label><textarea className="form-textarea" value={editCommentForm.observationZh} onChange={e => setEditCommentForm(f => ({ ...f, observationZh: e.target.value }))} /></div>}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-primary btn-sm" onClick={saveEditComment}>Salvar</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditingCommentId(null)}>Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    /* ── View mode ── */
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 6 }}>
                          <strong style={{ color: '#374151' }}>{c.interviewer}</strong> · {c.stage} · {c.date}
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => startEditComment(c)} title="Editar" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 2, borderRadius: 4, transition: 'color .15s' }} onMouseEnter={e => e.currentTarget.style.color = '#4F46E5'} onMouseLeave={e => e.currentTarget.style.color = '#9CA3AF'}><Pencil size={12} /></button>
                          <button onClick={() => removeComment(c.id)} title="Excluir" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 2, borderRadius: 4, transition: 'color .15s' }} onMouseEnter={e => e.currentTarget.style.color = '#EF4444'} onMouseLeave={e => e.currentTarget.style.color = '#9CA3AF'}><X size={13} /></button>
                        </div>
                      </div>
                      <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{c.observation}</div>
                    </>
                  )}
                </div>
              ))}
              {(candidate.interviewComments || []).length === 0 && !addingComment && (
                <div className="empty"><p>Nenhum comentário ainda</p></div>
              )}
              {addingComment ? (
                <div style={{ padding: 16, border: '1px dashed #C7D2FE', borderRadius: 10, marginTop: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div className="form-group">
                      <label className="form-label">Entrevistador</label>
                      <input className="form-input" value={newComment.interviewer} onChange={e => setNewComment(c => ({ ...c, interviewer: e.target.value }))} placeholder="Seu nome" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Etapa</label>
                      <select className="form-select" value={newComment.stage} onChange={e => setNewComment(c => ({ ...c, stage: e.target.value }))}>
                        {processStages.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  {/* Language tabs for observation */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 3, padding: 3, background: '#F3F4F6', borderRadius: 8, width: 'fit-content', marginBottom: 8 }}>
                      {[{ code: 'pt', flag: '🇧🇷', label: 'PT' }, { code: 'en', flag: '🇺🇸', label: 'EN' }, { code: 'zh', flag: '🇨🇳', label: 'ZH' }].map(l => (
                        <button key={l.code} onClick={() => setCommentFormLang(l.code)} style={{ padding: '4px 10px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700, background: commentFormLang === l.code ? 'white' : 'transparent', color: commentFormLang === l.code ? '#4F46E5' : '#6B7280', boxShadow: commentFormLang === l.code ? '0 1px 3px rgba(0,0,0,.1)' : 'none', transition: 'all .15s' }}>
                          {l.flag} {l.label}
                        </button>
                      ))}
                    </div>
                    {commentFormLang === 'pt' && (
                      <div className="form-group">
                        <label className="form-label">Observação</label>
                        <textarea className="form-textarea" value={newComment.observation} onChange={e => setNewComment(c => ({ ...c, observation: e.target.value }))} placeholder="Descreva suas impressões sobre o candidato..." />
                      </div>
                    )}
                    {commentFormLang === 'en' && (
                      <div className="form-group">
                        <label className="form-label">Observation (English) <span style={{ fontWeight: 400, color: '#9CA3AF' }}>— optional</span></label>
                        <textarea className="form-textarea" value={newComment.observationEn} onChange={e => setNewComment(c => ({ ...c, observationEn: e.target.value }))} placeholder="Describe your impressions about the candidate..." />
                      </div>
                    )}
                    {commentFormLang === 'zh' && (
                      <div className="form-group">
                        <label className="form-label">备注 (中文) <span style={{ fontWeight: 400, color: '#9CA3AF' }}>— 可选</span></label>
                        <textarea className="form-textarea" value={newComment.observationZh} onChange={e => setNewComment(c => ({ ...c, observationZh: e.target.value }))} placeholder="描述您对候选人的印象..." />
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary btn-sm" onClick={addComment}>Salvar</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setAddingComment(false); setCommentFormLang('pt'); }}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={() => setAddingComment(true)}>
                  <Plus size={13} /> Adicionar Comentário
                </button>
              )}
            </div>
          )}

          {/* LANGUAGES */}
          {activeTab === 'languages' && (
            <div>
              {(candidate.languages || []).map((l, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#F9FAFB', borderRadius: 10, marginBottom: 8, border: '1px solid #E5E7EB' }}>
                  <Globe size={16} color="#4F46E5" />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{l.language}</span>
                    <span style={{ margin: '0 8px', color: '#D1D5DB' }}>—</span>
                    <span style={{ fontSize: 13, color: '#374151' }}>{l.level}</span>
                    {l.notes && <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{l.notes}</div>}
                  </div>
                  <button onClick={() => removeLang(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB' }}><X size={13} /></button>
                </div>
              ))}
              {addingLang ? (
                <div style={{ padding: 16, border: '1px dashed #C7D2FE', borderRadius: 10, marginTop: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div className="form-group">
                      <label className="form-label">Idioma</label>
                      <select className="form-select" value={newLang.language} onChange={e => setNewLang(l => ({ ...l, language: e.target.value }))}>
                        {languages.map(l => <option key={l}>{l}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Nível</label>
                      <select className="form-select" value={newLang.level} onChange={e => setNewLang(l => ({ ...l, level: e.target.value }))}>
                        {languageLevels.map(l => <option key={l}>{l}</option>)}
                      </select>
                    </div>
                  </div>
                  {/* Language tabs for notes */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 3, padding: 3, background: '#F3F4F6', borderRadius: 8, width: 'fit-content', marginBottom: 8 }}>
                      {[{ code: 'pt', flag: '🇧🇷', label: 'PT' }, { code: 'en', flag: '🇺🇸', label: 'EN' }, { code: 'zh', flag: '🇨🇳', label: 'ZH' }].map(l => (
                        <button key={l.code} onClick={() => setLangFormLang(l.code)} style={{ padding: '4px 10px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700, background: langFormLang === l.code ? 'white' : 'transparent', color: langFormLang === l.code ? '#4F46E5' : '#6B7280', boxShadow: langFormLang === l.code ? '0 1px 3px rgba(0,0,0,.1)' : 'none', transition: 'all .15s' }}>
                          {l.flag} {l.label}
                        </button>
                      ))}
                    </div>
                    {langFormLang === 'pt' && (
                      <div className="form-group">
                        <label className="form-label">Observações</label>
                        <input className="form-input" value={newLang.notes} onChange={e => setNewLang(l => ({ ...l, notes: e.target.value }))} placeholder="Comunicação oral, certificações..." />
                      </div>
                    )}
                    {langFormLang === 'en' && (
                      <div className="form-group">
                        <label className="form-label">Notes (English) <span style={{ fontWeight: 400, color: '#9CA3AF' }}>— optional</span></label>
                        <input className="form-input" value={newLang.notesEn} onChange={e => setNewLang(l => ({ ...l, notesEn: e.target.value }))} placeholder="Oral communication, certifications..." />
                      </div>
                    )}
                    {langFormLang === 'zh' && (
                      <div className="form-group">
                        <label className="form-label">备注 (中文) <span style={{ fontWeight: 400, color: '#9CA3AF' }}>— 可选</span></label>
                        <input className="form-input" value={newLang.notesZh} onChange={e => setNewLang(l => ({ ...l, notesZh: e.target.value }))} placeholder="口头沟通、证书..." />
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary btn-sm" onClick={addLanguage}>Adicionar</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setAddingLang(false); setLangFormLang('pt'); }}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <button className="btn btn-secondary btn-sm" style={{ marginTop: 8 }} onClick={() => setAddingLang(true)}>
                  <Plus size={13} /> Adicionar Idioma
                </button>
              )}
            </div>
          )}
          {/* FEEDBACKS */}
          {activeTab === 'feedbacks' && (() => {
            // Mark as read when tab is opened
            markFeedbacksRead();
            const shares = (() => { try { return JSON.parse(localStorage.getItem('wayzim-shares') || '[]'); } catch { return []; } })();
            const mine = shares.filter(s => s.candidateId === candidate.id);
            const allFeedbacks = mine.flatMap(s =>
              (s.feedbacks || []).map(f => ({ ...f, lang: s.lang, sharedAt: s.sharedAt }))
            ).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
            const sharedLinks = mine.map(s => ({ id: s.id, lang: s.lang, sharedAt: s.sharedAt, feedbackCount: (s.feedbacks || []).length }));

            return (
              <div>
                {/* Links compartilhados */}
                {sharedLinks.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>🔗 Links Compartilhados</div>
                    {sharedLinks.map(s => (
                      <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#F9FAFB', borderRadius: 8, marginBottom: 6, border: '1px solid #E5E7EB' }}>
                        <div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{s.lang === 'en' ? '🇺🇸 English' : s.lang === 'zh' ? '🇨🇳 中文' : '🇧🇷 Português'}</span>
                          <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 10 }}>{new Date(s.sharedAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <span style={{ fontSize: 11, color: s.feedbackCount > 0 ? '#059669' : '#9CA3AF', fontWeight: 600 }}>
                          {s.feedbackCount} feedback{s.feedbackCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Feedbacks recebidos */}
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>
                  💬 Feedbacks Recebidos ({allFeedbacks.length})
                </div>
                {allFeedbacks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 20px', color: '#9CA3AF' }}>
                    <Share2 size={32} style={{ margin: '0 auto 10px', opacity: .3 }} />
                    <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Nenhum feedback ainda</p>
                    <p style={{ fontSize: 12 }}>Compartilhe o relatório com avaliadores usando o botão "Compartilhar" acima.</p>
                  </div>
                ) : (
                  allFeedbacks.map(f => (
                    <div key={f.id} style={{ padding: '14px 16px', background: '#F9FAFB', borderRadius: 10, marginBottom: 10, borderLeft: '3px solid #4F46E5' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{f.name}</span>
                          {f.rating > 0 && (
                            <span style={{ marginLeft: 10, fontSize: 14, color: '#F59E0B' }}>
                              {'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: 11, color: '#9CA3AF' }}>{new Date(f.submittedAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.65 }}>{f.text}</div>
                    </div>
                  ))
                )}
              </div>
            );
          })()}

        </div>
      </div>
    </div>
  );
}
