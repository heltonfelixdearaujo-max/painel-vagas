import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { discProfiles } from '../data/discQuestions';

// ── i18n labels ───────────────────────────────────────────────────────────────
const T = {
  pt: {
    title: 'Relatório de Candidato', confidential: 'Documento compartilhado pela equipe Wayzim',
    recommendation: 'Recomendação', technical: 'Score Técnico', behavioral: 'Score Comportamental',
    summary: 'Parecer Qualitativo', strengths: 'Pontos Fortes', gaps: 'Gaps Identificados',
    risks: 'Pontos de Atenção', candidateData: 'Dados do Candidato',
    email: 'E-mail', whatsapp: 'WhatsApp', city: 'Cidade',
    salary: 'Pretensão Salarial', availability: 'Disponibilidade', seniority: 'Senioridade',
    languages: 'Idiomas', comments: 'Comentários do Entrevistador',
    discTitle: 'Perfil Comportamental DISC', discSummary: 'Resumo do Perfil',
    resume: 'Currículo', resumeDownload: 'Baixar Currículo', resumeUnavailable: 'Currículo não disponível neste link',
    feedbackTitle: 'Deixar Feedback', feedbackSub: 'Sua avaliação é importante para o processo seletivo',
    yourName: 'Seu nome', yourNamePh: 'Nome completo',
    rating: 'Avaliação geral', ratingLabels: ['', 'Fraco', 'Regular', 'Bom', 'Muito bom', 'Excelente'],
    comment: 'Comentário', commentPh: 'Descreva sua impressão sobre o candidato...',
    submit: 'Enviar Feedback', submittedTitle: 'Feedback enviado!',
    submittedSub: 'Obrigado. O recrutador responsável receberá sua avaliação.',
    invalidLink: 'Link inválido', invalidLinkSub: 'Este link pode ter expirado ou estar incorreto.',
    recLabels: { recommended:'Recomendado ✓', recommended_with_caveats:'Recomendado com Ressalvas ⚠', not_recommended:'Não Recomendado ✗' },
    dominance:'Dominância (D)', influence:'Influência (I)', stability:'Estabilidade (S)', conformity:'Conformidade (C)',
    seniorityMap: { 'Sênior':'Sênior','Pleno':'Pleno','Júnior':'Júnior','Estágio/Trainee':'Estágio/Trainee' },
    stageMap: { 'Triagem de Currículo':'Triagem de Currículo','Entrevista RH':'Entrevista RH','Entrevista Técnica':'Entrevista Técnica','Entrevista com Liderança':'Entrevista com Liderança','Assessment':'Assessment','Proposta':'Proposta' },
    langMap: {}, levelMap: {},
    noFeedbackRequired: 'Campo obrigatório', submitRequired: 'Preencha seu nome e comentário antes de enviar.',
  },
  en: {
    title: 'Candidate Report', confidential: 'Document shared by the Wayzim team',
    recommendation: 'Recommendation', technical: 'Technical Score', behavioral: 'Behavioral Score',
    summary: 'Qualitative Summary', strengths: 'Strengths', gaps: 'Identified Gaps',
    risks: 'Risk Points', candidateData: 'Candidate Data',
    email: 'Email', whatsapp: 'WhatsApp', city: 'City',
    salary: 'Salary Expectation', availability: 'Start Availability', seniority: 'Seniority',
    languages: 'Languages', comments: 'Interviewer Comments',
    discTitle: 'DISC Behavioral Profile', discSummary: 'Profile Summary',
    resume: 'Resume', resumeDownload: 'Download Resume', resumeUnavailable: 'Resume not available in this link',
    feedbackTitle: 'Leave Feedback', feedbackSub: 'Your assessment is important for the selection process',
    yourName: 'Your name', yourNamePh: 'Full name',
    rating: 'Overall rating', ratingLabels: ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'],
    comment: 'Comment', commentPh: 'Describe your impression of the candidate...',
    submit: 'Submit Feedback', submittedTitle: 'Feedback submitted!',
    submittedSub: 'Thank you. The responsible recruiter will receive your assessment.',
    invalidLink: 'Invalid link', invalidLinkSub: 'This link may have expired or be incorrect.',
    recLabels: { recommended:'Recommended ✓', recommended_with_caveats:'Recommended with Caveats ⚠', not_recommended:'Not Recommended ✗' },
    dominance:'Dominance (D)', influence:'Influence (I)', stability:'Stability (S)', conformity:'Conformity (C)',
    seniorityMap: { 'Sênior':'Senior','Pleno':'Mid-level','Júnior':'Junior','Estágio/Trainee':'Internship/Trainee' },
    stageMap: { 'Triagem de Currículo':'CV Screening','Entrevista RH':'HR Interview','Entrevista Técnica':'Technical Interview','Entrevista com Liderança':'Leadership Interview','Assessment':'Assessment','Proposta':'Job Offer' },
    langMap: { 'Inglês':'English','Espanhol':'Spanish','Francês':'French','Alemão':'German','Italiano':'Italian','Mandarim':'Mandarin','Japonês':'Japanese','Árabe':'Arabic','Português':'Portuguese' },
    levelMap: { 'Básico':'Basic','Intermediário':'Intermediate','Avançado':'Advanced','Fluente':'Fluent','Nativo':'Native' },
    noFeedbackRequired: 'Required field', submitRequired: 'Please fill in your name and comment before submitting.',
  },
  zh: {
    title: '候选人报告', confidential: '由 Wayzim 团队共享的文件',
    recommendation: '推荐意见', technical: '技术评分', behavioral: '行为评分',
    summary: '定性总结', strengths: '优势', gaps: '差距分析',
    risks: '风险点', candidateData: '候选人信息',
    email: '电子邮件', whatsapp: 'WhatsApp', city: '城市',
    salary: '薪资期望', availability: '入职时间', seniority: '资历',
    languages: '语言能力', comments: '面试官意见',
    discTitle: 'DISC 行为档案', discSummary: '档案摘要',
    resume: '简历', resumeDownload: '下载简历', resumeUnavailable: '此链接中无简历',
    feedbackTitle: '提交反馈', feedbackSub: '您的评估对招聘过程非常重要',
    yourName: '您的姓名', yourNamePh: '全名',
    rating: '综合评分', ratingLabels: ['', '差', '一般', '好', '很好', '优秀'],
    comment: '意见', commentPh: '描述您对候选人的印象...',
    submit: '提交反馈', submittedTitle: '反馈已提交！',
    submittedSub: '感谢您。负责招聘人员将收到您的评估。',
    invalidLink: '无效链接', invalidLinkSub: '此链接可能已过期或不正确。',
    recLabels: { recommended:'推荐 ✓', recommended_with_caveats:'有条件推荐 ⚠', not_recommended:'不推荐 ✗' },
    dominance:'支配型 (D)', influence:'影响型 (I)', stability:'稳定型 (S)', conformity:'谨慎型 (C)',
    seniorityMap: { 'Sênior':'高级','Pleno':'中级','Júnior':'初级','Estágio/Trainee':'实习/培训生' },
    stageMap: { 'Triagem de Currículo':'简历筛选','Entrevista RH':'HR面试','Entrevista Técnica':'技术面试','Entrevista com Liderança':'高管面试','Assessment':'评估','Proposta':'录用通知' },
    langMap: { 'Inglês':'英语','Espanhol':'西班牙语','Francês':'法语','Alemão':'德语','Italiano':'意大利语','Mandarim':'普通话','Japonês':'日语','Árabe':'阿拉伯语','Português':'葡萄牙语' },
    levelMap: { 'Básico':'基础','Intermediário':'中级','Avançado':'高级','Fluente':'流利','Nativo':'母语' },
    noFeedbackRequired: '必填项', submitRequired: '请在提交前填写您的姓名和意见。',
  },
};

const recColors = {
  recommended:             { bg:'#ECFDF5', color:'#065F46', border:'#10B981' },
  recommended_with_caveats:{ bg:'#FFFBEB', color:'#92400E', border:'#F59E0B' },
  not_recommended:         { bg:'#FEF2F2', color:'#991B1B', border:'#EF4444' },
};
const discColors = { D:'#EF4444', I:'#F59E0B', S:'#10B981', C:'#3B82F6' };

// ── Logo ──────────────────────────────────────────────────────────────────────
function Logo() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 47 47" height={22} style={{ flexShrink:0 }}>
        <rect x="0"  y="0"  width="22" height="22" rx="2.5" fill="#1B5299"/>
        <rect x="25" y="0"  width="22" height="22" rx="2.5" fill="#5BB8E4"/>
        <rect x="0"  y="25" width="22" height="22" rx="2.5" fill="#1B5299"/>
        <rect x="25" y="25" width="22" height="22" rx="2.5" fill="#1B5299"/>
      </svg>
      <div style={{ lineHeight:1 }}>
        <div style={{ fontFamily:"'Arial Black',Arial,sans-serif", fontWeight:900, fontSize:17, color:'#1B5299', letterSpacing:'-0.4px' }}>Wayzim</div>
        <div style={{ fontSize:7, color:'#9CA3AF', fontWeight:600, letterSpacing:'0.06em', marginTop:1 }}>People Report</div>
      </div>
    </div>
  );
}

// ── Decode URL data ───────────────────────────────────────────────────────────
function decodeData(encoded) {
  // searchParams.get() already URL-decodes, so encoded is plain base64
  try { return JSON.parse(decodeURIComponent(escape(atob(encoded)))); } catch {
    try { return JSON.parse(atob(encoded)); } catch { return null; }
  }
}

// ── Get resume from localStorage by shareId ───────────────────────────────────
function getResumeFromStore(shareId) {
  try {
    const shares = JSON.parse(localStorage.getItem('wayzim-shares') || '[]');
    const s = shares.find(x => x.id === shareId);
    return s ? { file: s.resumeFile, name: s.resumeFileName } : null;
  } catch { return null; }
}

// ── Store / update feedback in localStorage ───────────────────────────────────
function storeFeedback(shareId, fb) {
  try {
    const shares = JSON.parse(localStorage.getItem('wayzim-shares') || '[]');
    const idx = shares.findIndex(s => s.id === shareId);
    const entry = { id: Date.now(), ...fb, submittedAt: new Date().toISOString(), read: false };
    if (idx >= 0) {
      shares[idx].feedbacks = [...(shares[idx].feedbacks || []), entry];
    } else {
      shares.push({ id: shareId, feedbacks: [entry] });
    }
    localStorage.setItem('wayzim-shares', JSON.stringify(shares));
    return entry;
  } catch { return null; }
}

function updateFeedback(shareId, feedbackId, patch) {
  try {
    const shares = JSON.parse(localStorage.getItem('wayzim-shares') || '[]');
    const idx = shares.findIndex(s => s.id === shareId);
    if (idx >= 0) {
      shares[idx].feedbacks = (shares[idx].feedbacks || []).map(f =>
        f.id === feedbackId ? { ...f, ...patch, editedAt: new Date().toISOString() } : f
      );
      localStorage.setItem('wayzim-shares', JSON.stringify(shares));
    }
  } catch {}
}

function getFeedbacks(shareId) {
  try {
    const shares = JSON.parse(localStorage.getItem('wayzim-shares') || '[]');
    const s = shares.find(x => x.id === shareId);
    return s?.feedbacks || [];
  } catch { return []; }
}

// ── Section header ────────────────────────────────────────────────────────────
function SH({ children }) {
  return <div style={{ fontSize:10, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:8, paddingBottom:5, borderBottom:'1px solid #F3F4F6' }}>{children}</div>;
}

// ── Star rating ───────────────────────────────────────────────────────────────
function Stars({ value, hover, onHover, onClick }) {
  return (
    <div style={{ display:'flex', gap:4 }}>
      {[1,2,3,4,5].map(n => (
        <button key={n} onMouseEnter={() => onHover(n)} onMouseLeave={() => onHover(0)} onClick={() => onClick(n)}
          style={{ background:'none', border:'none', cursor:'pointer', fontSize:28, color: n <= (hover || value) ? '#F59E0B' : '#E5E7EB', padding:0, lineHeight:1, transition:'color .1s' }}>★</button>
      ))}
    </div>
  );
}

// ── Score bar ─────────────────────────────────────────────────────────────────
function ScoreBar({ value, color, label }) {
  return (
    <div style={{ flex:1, background:'white', borderRadius:10, padding:'14px 16px', border:'1px solid #E5E7EB', textAlign:'center' }}>
      <div style={{ fontSize:38, fontWeight:900, color: value >= 70 ? color : value >= 50 ? '#D97706' : '#EF4444', lineHeight:1 }}>{value ?? '—'}%</div>
      <div style={{ fontSize:11, fontWeight:600, color:'#374151', marginTop:4 }}>{label}</div>
      <div style={{ height:5, background:'#F3F4F6', borderRadius:99, marginTop:8, overflow:'hidden' }}>
        <div style={{ width:`${value ?? 0}%`, height:'100%', background: value >= 70 ? color : value >= 50 ? '#F59E0B' : '#EF4444', borderRadius:99 }} />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SharedReport() {
  const [searchParams] = useSearchParams();
  const [lang, setLang] = useState(() => searchParams.get('l') || 'pt');
  const [fbForm, setFbForm] = useState({ name:'', rating:0, text:'' });
  const [hoverStar, setHoverStar] = useState(0);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [editingFeedbackId, setEditingFeedbackId] = useState(null);
  const [localFeedbacks, setLocalFeedbacks] = useState([]);
  const [updatedUrl, setUpdatedUrl] = useState('');
  const [urlCopied, setUrlCopied] = useState(false);

  const reportData = useMemo(() => {
    const d = searchParams.get('d');
    return d ? decodeData(d) : null;
  }, [searchParams]);

  // Feedbacks embedded in the URL (from previous reviewers)
  const urlFeedbacks = useMemo(() => {
    const f = searchParams.get('f');
    if (!f) return [];
    try { return JSON.parse(decodeURIComponent(escape(atob(f)))); } catch { return []; }
  }, [searchParams]);

  const t = T[lang] || T.pt;

  // On load: merge URL feedbacks into localStorage, then load all
  useEffect(() => {
    if (!reportData?.shareId) return;
    const sid = reportData.shareId;
    if (urlFeedbacks.length > 0) {
      try {
        const shares = JSON.parse(localStorage.getItem('wayzim-shares') || '[]');
        let idx = shares.findIndex(s => s.id === sid);
        if (idx < 0) { shares.push({ id: sid, feedbacks: [] }); idx = shares.length - 1; }
        const existingIds = new Set((shares[idx].feedbacks || []).map(f => f.id));
        const newOnes = urlFeedbacks.filter(f => !existingIds.has(f.id));
        if (newOnes.length > 0) {
          shares[idx].feedbacks = [...(shares[idx].feedbacks || []), ...newOnes];
          localStorage.setItem('wayzim-shares', JSON.stringify(shares));
        }
      } catch {}
    }
    setLocalFeedbacks(getFeedbacks(sid));
  }, [reportData, urlFeedbacks]);

  const buildUpdatedUrl = (feedbacks) => {
    const d = searchParams.get('d') || '';
    const l = searchParams.get('l') || 'pt';
    const fEncoded = encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(feedbacks)))));
    const hash = window.location.hash.replace(/&f=[^&]*/g, '').replace(/\?f=[^&]*/g, '');
    const sep = hash.includes('?') ? '&' : '?';
    return window.location.origin + window.location.pathname + hash + sep + `f=${fEncoded}`;
  };


  if (!reportData) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F9FAFB', fontFamily:'-apple-system,Arial,sans-serif' }}>
        <div style={{ textAlign:'center', padding:40 }}>
          <Logo />
          <p style={{ fontSize:18, fontWeight:700, color:'#111827', marginTop:24 }}>{t.invalidLink}</p>
          <p style={{ fontSize:13, color:'#6B7280', marginTop:6 }}>{t.invalidLinkSub}</p>
        </div>
      </div>
    );
  }

  const { candidate, job, shareId } = reportData;
  const ai      = candidate.aiAnalysis || {};
  const disc    = candidate.disc || {};
  const profile = discProfiles[disc.profile];
  const recStyle = recColors[ai.recommendation] || null;

  // Language-aware field pickers
  const pick = (pt, en, zh) => (lang === 'en' && en) ? en : (lang === 'zh' && zh) ? zh : pt;
  const pickArr = (pt, en, zh) => (lang === 'en' && en?.length) ? en : (lang === 'zh' && zh?.length) ? zh : (pt || []);

  const summary   = pick(ai.qualitativeSummary,    ai.qualitativeSummaryEn,    ai.qualitativeSummaryZh);
  const strengths = pickArr(ai.strengths,            ai.strengthsEn,             ai.strengthsZh);
  const gaps      = pickArr(ai.gaps,                 ai.gapsEn,                  ai.gapsZh);
  const risks     = pickArr(ai.risks,                ai.risksEn,                 ai.risksZh);
  const seniority = (t.seniorityMap || {})[ai.seniority] || ai.seniority;

  const resumeStore = getResumeFromStore(shareId);
  const hasResume   = !!(resumeStore?.file) || !!(candidate.resumeFileName);

  const downloadResume = () => {
    if (!resumeStore?.file) return;
    const a = document.createElement('a');
    a.href = resumeStore.file;
    a.download = resumeStore.name || 'curriculo.pdf';
    a.click();
  };

  const submitFeedback = () => {
    if (!fbForm.name.trim() || !fbForm.text.trim()) {
      setFormError(t.submitRequired);
      return;
    }
    setFormError('');
    if (editingFeedbackId) {
      updateFeedback(shareId, editingFeedbackId, { name: fbForm.name, rating: fbForm.rating, text: fbForm.text });
      setEditingFeedbackId(null);
    } else {
      storeFeedback(shareId, fbForm);
    }
    const all = getFeedbacks(shareId);
    setLocalFeedbacks(all);
    setUpdatedUrl(buildUpdatedUrl(all));
    setUrlCopied(false);
    setFbForm({ name:'', rating:0, text:'' });
    setSuccessMsg(t.submittedTitle);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const startEditFeedback = (fb) => {
    setEditingFeedbackId(fb.id);
    setFbForm({ name: fb.name, rating: fb.rating, text: fb.text });
    setFormError('');
  };

  const cancelEdit = () => {
    setEditingFeedbackId(null);
    setFbForm({ name:'', rating:0, text:'' });
    setFormError('');
  };

  const today = new Date().toLocaleDateString(lang === 'zh' ? 'zh-CN' : lang === 'en' ? 'en-US' : 'pt-BR');

  const card = { background:'white', borderRadius:12, padding:'18px 20px', border:'1px solid #E5E7EB', marginBottom:16 };

  return (
    <div style={{ minHeight:'100vh', background:'#F3F4F6', fontFamily:'-apple-system,"Helvetica Neue",Arial,"Noto Sans CJK SC",sans-serif', color:'#1F2937' }}>
      {/* Top bar */}
      <div style={{ background:'white', borderBottom:'1px solid #E5E7EB', padding:'12px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:10 }}>
        <Logo />
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:11, color:'#9CA3AF' }}>{t.confidential}</span>
          <div style={{ display:'flex', gap:2, padding:2, background:'#F3F4F6', borderRadius:8 }}>
            {[{ code:'pt', flag:'🇧🇷' },{ code:'en', flag:'🇺🇸' },{ code:'zh', flag:'🇨🇳' }].map(l => (
              <button key={l.code} onClick={() => setLang(l.code)} style={{ padding:'4px 10px', border:'none', borderRadius:6, cursor:'pointer', fontSize:13, background: lang === l.code ? 'white' : 'transparent', fontWeight: lang === l.code ? 700 : 400, boxShadow: lang === l.code ? '0 1px 3px rgba(0,0,0,.1)' : 'none' }}>
                {l.flag}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:840, margin:'0 auto', padding:'28px 16px 60px' }}>

        {/* Candidate header */}
        <div style={{ ...card, borderLeft:'4px solid #1B5299', display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ width:52, height:52, borderRadius:'50%', background:'#EEF2FF', color:'#4F46E5', fontWeight:900, fontSize:17, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            {candidate.name.split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase()}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:20, fontWeight:800, color:'#111827' }}>{candidate.name}</div>
            <div style={{ fontSize:13, color:'#4F46E5', fontWeight:600, marginTop:2 }}>{job?.title || '—'}{job?.department ? ` · ${job.department}` : ''}</div>
            <div style={{ display:'flex', gap:16, marginTop:6, flexWrap:'wrap' }}>
              {candidate.city && <span style={{ fontSize:12, color:'#6B7280' }}>📍 {candidate.city}</span>}
              {candidate.salaryClaim && <span style={{ fontSize:12, color:'#6B7280' }}>💼 {candidate.salaryClaim}</span>}
              {candidate.startAvailability && <span style={{ fontSize:12, color:'#6B7280' }}>📅 {candidate.startAvailability}</span>}
              {seniority && <span style={{ fontSize:12, color:'#6B7280' }}>🎯 {seniority}</span>}
              {candidate.linkedin && candidate.linkedin !== 'https://www.linkedin.com/in/' && (
                <a href={candidate.linkedin} target="_blank" rel="noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:12, color:'#0A66C2', fontWeight:600, textDecoration:'none', background:'#EFF6FF', padding:'2px 8px', borderRadius:99 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  LinkedIn
                </a>
              )}
            </div>
          </div>
          <div style={{ textAlign:'right', fontSize:10, color:'#D1D5DB' }}>{today}</div>
        </div>

        {/* Recommendation + scores */}
        {recStyle && (
          <div style={{ ...card, background:recStyle.bg, borderColor:recStyle.border }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
              <div>
                <div style={{ fontSize:9, color:recStyle.color, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:3 }}>{t.recommendation}</div>
                <div style={{ fontSize:18, fontWeight:800, color:recStyle.color }}>{t.recLabels[ai.recommendation] || '—'}</div>
              </div>
              {(ai.technicalScore != null || ai.behavioralScore != null) && (
                <div style={{ display:'flex', gap:12 }}>
                  {ai.technicalScore != null && <ScoreBar value={ai.technicalScore} color="#0891B2" label={t.technical} />}
                  {ai.behavioralScore != null && <ScoreBar value={ai.behavioralScore} color="#10B981" label={t.behavioral} />}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Qualitative summary */}
        {summary && (
          <div style={card}>
            <SH>📋 {t.summary}</SH>
            <div style={{ padding:'10px 14px', background:'#EEF2FF', borderRadius:8, borderLeft:'3px solid #4F46E5', fontSize:13, color:'#374151', lineHeight:1.75 }}>{summary}</div>
          </div>
        )}

        {/* Strengths + Gaps */}
        {(strengths.length > 0 || gaps.length > 0) && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
            {strengths.length > 0 && (
              <div style={{ background:'white', borderRadius:12, padding:'16px 18px', border:'1px solid #E5E7EB' }}>
                <SH>✅ {t.strengths}</SH>
                {strengths.map((s, i) => <div key={i} style={{ padding:'7px 10px', background:'#F0FDF4', borderRadius:7, borderLeft:'2px solid #16A34A', fontSize:12, color:'#14532D', lineHeight:1.5, marginBottom:5 }}>{s}</div>)}
              </div>
            )}
            {gaps.length > 0 && (
              <div style={{ background:'white', borderRadius:12, padding:'16px 18px', border:'1px solid #E5E7EB' }}>
                <SH>⚠️ {t.gaps}</SH>
                {gaps.map((g, i) => <div key={i} style={{ padding:'7px 10px', background:'#FFFBEB', borderRadius:7, borderLeft:'2px solid #F59E0B', fontSize:12, color:'#78350F', lineHeight:1.5, marginBottom:5 }}>{g}</div>)}
              </div>
            )}
          </div>
        )}

        {/* Risks */}
        {risks.length > 0 && (
          <div style={{ ...card, background:'#FEF2F2', borderColor:'#FEE2E2' }}>
            <SH>🚨 {t.risks}</SH>
            {risks.map((r, i) => <div key={i} style={{ fontSize:12, color:'#7F1D1D', marginBottom:4, paddingLeft:10, borderLeft:'2px solid #FCA5A5', lineHeight:1.5 }}>{r}</div>)}
          </div>
        )}

        {/* DISC Profile */}
        {disc.profile && profile && (
          <div style={{ ...card, borderLeft:`4px solid ${profile.color}` }}>
            <SH>🧠 {t.discTitle}</SH>
            <div style={{ display:'flex', gap:16, flexWrap:'wrap', alignItems:'flex-start' }}>
              <div style={{ padding:'12px 14px', background:profile.bg, borderRadius:10, flexShrink:0, minWidth:160 }}>
                <div style={{ fontSize:20 }}>{profile.emoji}</div>
                <div style={{ fontSize:16, fontWeight:800, color:profile.color, marginTop:4 }}>{profile.title}</div>
                <div style={{ fontSize:11, color:'#6B7280', marginTop:2 }}>{profile.subtitle}</div>
              </div>
              <div style={{ flex:1, minWidth:180 }}>
                <p style={{ fontSize:12, color:'#374151', lineHeight:1.7, marginBottom:10 }}>{profile.summary}</p>
                {disc.scores && Object.entries(disc.scores).map(([k, v]) => (
                  <div key={k} style={{ marginBottom:6 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                      <span style={{ fontSize:11, color:'#374151', fontWeight:600 }}>{t[{ D:'dominance', I:'influence', S:'stability', C:'conformity' }[k]]}</span>
                      <span style={{ fontSize:11, fontWeight:700, color:discColors[k] }}>{v}%</span>
                    </div>
                    <div style={{ height:5, background:'#F3F4F6', borderRadius:99, overflow:'hidden' }}>
                      <div style={{ width:`${v}%`, height:'100%', background:discColors[k], borderRadius:99 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Languages */}
        {(candidate.languages || []).length > 0 && (
          <div style={card}>
            <SH>🌐 {t.languages}</SH>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {candidate.languages.map((l, i) => {
                const notes = pick(l.notes, l.notesEn, l.notesZh);
                return (
                  <div key={i} style={{ padding:'6px 12px', background:'#EEF2FF', borderRadius:8, display:'flex', flexDirection:'column' }}>
                    <span style={{ fontSize:12, fontWeight:700, color:'#4F46E5' }}>
                      {(t.langMap || {})[l.language] || l.language} — {(t.levelMap || {})[l.level] || l.level}
                    </span>
                    {notes && <span style={{ fontSize:10, color:'#6B7280', marginTop:2 }}>{notes}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Interview comments */}
        {(candidate.interviewComments || []).length > 0 && (
          <div style={card}>
            <SH>💬 {t.comments}</SH>
            {candidate.interviewComments.map(c => {
              const obs = pick(c.observation, c.observationEn, c.observationZh);
              return (
                <div key={c.id} style={{ padding:'10px 13px', background:'#F9FAFB', borderRadius:8, marginBottom:8, borderLeft:'3px solid #4F46E5' }}>
                  <div style={{ fontSize:10, color:'#6B7280', marginBottom:4 }}>
                    <strong style={{ color:'#374151' }}>{c.interviewer}</strong> · {(t.stageMap || {})[c.stage] || c.stage} · {c.date}
                  </div>
                  <div style={{ fontSize:12, color:'#374151', lineHeight:1.65 }}>{obs}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Resume */}
        <div style={card}>
          <SH>📄 {t.resume}</SH>
          {resumeStore?.file ? (
            <button onClick={downloadResume} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'9px 18px', background:'#1B5299', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:700 }}>
              ⬇ {t.resumeDownload} {resumeStore.name ? `— ${resumeStore.name}` : ''}
            </button>
          ) : (
            <div style={{ padding:'10px 14px', background:'#F9FAFB', borderRadius:8, border:'1px dashed #D1D5DB', fontSize:12, color:'#9CA3AF' }}>
              📎 {candidate.resumeFileName ? `${candidate.resumeFileName} — ` : ''}{t.resumeUnavailable}
            </div>
          )}
        </div>

        {/* ── Feedbacks enviados ── */}
        {localFeedbacks.length > 0 && (
          <div style={{ ...card, marginTop:32 }}>
            <SH>💬 {lang === 'zh' ? '已提交的反馈' : lang === 'en' ? 'Submitted Feedbacks' : 'Feedbacks enviados'}</SH>
            {localFeedbacks.map(fb => (
              <div key={fb.id} style={{ padding:'12px 14px', background:'#F9FAFB', borderRadius:10, marginBottom:8, border:'1px solid #E5E7EB', display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                    <span style={{ fontWeight:700, fontSize:13, color:'#111827' }}>{fb.name}</span>
                    <span style={{ color:'#F59E0B', fontSize:14, letterSpacing:1 }}>{'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}</span>
                  </div>
                  <div style={{ fontSize:13, color:'#374151', lineHeight:1.6 }}>{fb.text}</div>
                  {fb.editedAt && <div style={{ fontSize:10, color:'#9CA3AF', marginTop:4 }}>✏ {lang === 'en' ? 'Edited' : lang === 'zh' ? '已编辑' : 'Editado'}</div>}
                </div>
                <button onClick={() => startEditFeedback(fb)}
                  style={{ background:'none', border:'1px solid #E5E7EB', borderRadius:7, padding:'4px 10px', cursor:'pointer', fontSize:11, color:'#6B7280', fontWeight:600, flexShrink:0, whiteSpace:'nowrap' }}>
                  {lang === 'en' ? 'Edit' : lang === 'zh' ? '编辑' : 'Editar'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── Feedback form ── */}
        <div style={{ ...card, borderTop:'3px solid #4F46E5', marginTop: localFeedbacks.length > 0 ? 0 : 32 }}>
          <div style={{ marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontSize:15, fontWeight:800, color:'#111827' }}>
                {editingFeedbackId
                  ? (lang === 'en' ? 'Edit Feedback' : lang === 'zh' ? '编辑反馈' : 'Editar Feedback')
                  : t.feedbackTitle}
              </div>
              <div style={{ fontSize:12, color:'#6B7280', marginTop:3 }}>{t.feedbackSub}</div>
            </div>
            {successMsg && (
              <div style={{ background:'#DCFCE7', color:'#15803D', padding:'6px 14px', borderRadius:8, fontSize:12, fontWeight:700 }}>
                ✓ {successMsg}
              </div>
            )}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#374151', marginBottom:5, textTransform:'uppercase', letterSpacing:'.04em' }}>{t.yourName}</label>
              <input value={fbForm.name} onChange={e => setFbForm(f => ({ ...f, name: e.target.value }))} placeholder={t.yourNamePh}
                style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }}
                onFocus={e => e.target.style.borderColor='#4F46E5'} onBlur={e => e.target.style.borderColor='#E5E7EB'} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#374151', marginBottom:5, textTransform:'uppercase', letterSpacing:'.04em' }}>{t.rating}</label>
              <Stars value={fbForm.rating} hover={hoverStar} onHover={setHoverStar} onClick={n => setFbForm(f => ({ ...f, rating: n }))} />
              {fbForm.rating > 0 && <div style={{ fontSize:11, color:'#6B7280', marginTop:3 }}>{t.ratingLabels[fbForm.rating]}</div>}
            </div>
          </div>

          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#374151', marginBottom:5, textTransform:'uppercase', letterSpacing:'.04em' }}>{t.comment}</label>
            <textarea value={fbForm.text} onChange={e => setFbForm(f => ({ ...f, text: e.target.value }))} placeholder={t.commentPh} rows={4}
              style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:13, outline:'none', resize:'vertical', boxSizing:'border-box', fontFamily:'inherit', lineHeight:1.6 }}
              onFocus={e => e.target.style.borderColor='#4F46E5'} onBlur={e => e.target.style.borderColor='#E5E7EB'} />
          </div>

          {formError && <div style={{ fontSize:12, color:'#DC2626', marginBottom:10 }}>⚠ {formError}</div>}

          <div style={{ display:'flex', gap:8 }}>
            <button onClick={submitFeedback}
              style={{ padding:'10px 22px', background:'#1B5299', color:'white', border:'none', borderRadius:9, cursor:'pointer', fontSize:14, fontWeight:700 }}>
              {editingFeedbackId
                ? (lang === 'en' ? 'Save Changes' : lang === 'zh' ? '保存更改' : 'Salvar Alterações')
                : t.submit}
            </button>
            {editingFeedbackId && (
              <button onClick={cancelEdit}
                style={{ padding:'10px 18px', background:'#F3F4F6', color:'#374151', border:'none', borderRadius:9, cursor:'pointer', fontSize:14, fontWeight:600 }}>
                {lang === 'en' ? 'Cancel' : lang === 'zh' ? '取消' : 'Cancelar'}
              </button>
            )}
          </div>

          {/* Updated link banner */}
          {updatedUrl && (
            <div style={{ marginTop:16, padding:'14px 16px', background:'#F0FDF4', borderRadius:10, border:'1px solid #BBF7D0' }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#15803D', marginBottom:8 }}>
                🔗 {lang === 'en' ? 'Share this updated link so the next reviewer sees all feedbacks:' : lang === 'zh' ? '分享此更新链接，让下一位评审人看到所有反馈：' : 'Compartilhe este link atualizado para que o próximo revisor veja todos os feedbacks:'}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <input
                  readOnly
                  value={updatedUrl}
                  onFocus={e => e.target.select()}
                  style={{ flex:1, padding:'8px 10px', border:'1px solid #BBF7D0', borderRadius:7, fontSize:10, fontFamily:'monospace', color:'#374151', background:'white', outline:'none' }}
                />
                <button
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(updatedUrl).then(() => setUrlCopied(true));
                    } else {
                      try { document.execCommand('copy'); setUrlCopied(true); } catch {}
                    }
                  }}
                  style={{ padding:'8px 16px', background: urlCopied ? '#15803D' : '#1B5299', color:'white', border:'none', borderRadius:7, cursor:'pointer', fontSize:12, fontWeight:700, flexShrink:0, transition:'background .2s' }}
                >
                  {urlCopied ? '✓ Copiado' : (lang === 'en' ? 'Copy' : lang === 'zh' ? '复制' : 'Copiar')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign:'center', marginTop:24, fontSize:10, color:'#D1D5DB' }}>
          <Logo />
          <div style={{ marginTop:6 }}>Wayzim People Platform · {today}</div>
        </div>

      </div>
    </div>
  );
}
