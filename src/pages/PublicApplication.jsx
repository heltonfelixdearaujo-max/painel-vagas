import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { decompressFromEncodedURIComponent } from 'lz-string';
import { fetchJobFromServer } from '../utils/jobStorage';
import { MapPin, Briefcase, DollarSign, CheckCircle, Upload, X, ChevronRight, ChevronLeft, ChevronDown } from 'lucide-react';
import { formatWhatsApp, isValidWhatsApp } from '../utils/whatsapp';
import { discQuestions } from '../data/discQuestions';
import { generateAIAnalysis, generateRealAIAnalysis } from '../utils/aiAnalysis';
import { extractResumeText } from '../utils/resumeExtract';
import { salaryRangesBRL, brazilStates } from '../data/mockData';
import WayzimLogo from '../components/WayzimLogo';

const STEP_FORM = 1;
const STEP_SCREENING = 2;
const STEP_DISC = 3;

function JobDescription({ text }) {
  if (!text?.trim()) return null;

  // ── Parse text into sections ──────────────────────────────────────────────
  const isHeading = (line) =>
    (line.endsWith(':') && line.length > 2 && !/^[*\-•\d]/.test(line)) ||
    (line === line.toUpperCase() && line.length > 4 && /[A-ZÁÉÍÓÚÃÕ]/.test(line));

  const sections = [];
  let intro = [];
  let current = null;

  text.split('\n').forEach(raw => {
    const line = raw.trim();
    if (!line) return;

    if (isHeading(line)) {
      if (current) sections.push(current);
      current = { title: line.replace(/:$/, ''), lines: [] };
    } else if (current) {
      current.lines.push(line);
    } else {
      intro.push(line);
    }
  });
  if (current) sections.push(current);

  // No headings found — wrap everything in one accordion
  if (sections.length === 0) {
    sections.push({ title: 'Detalhes da Vaga', lines: intro });
    intro = [];
  }

  // ── Accordion state — first section open by default ───────────────────────
  const [open, setOpen] = useState(() =>
    Object.fromEntries(sections.map((_, i) => [i, i === 0]))
  );
  const toggle = (i) => setOpen(o => ({ ...o, [i]: !o[i] }));

  const renderLine = (line, j) => {
    if (/^([*\-•]|\d+\.)/.test(line)) {
      const content = line.replace(/^([*\-•]|\d+\.)\s*/, '');
      return (
        <div key={j} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 6, fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#1B5299', flexShrink: 0, marginTop: 6 }} />
          <span>{content}</span>
        </div>
      );
    }
    return <p key={j} style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.75, margin: '0 0 6px' }}>{line}</p>;
  };

  return (
    <div>
      {/* Intro text (before any heading) */}
      {intro.length > 0 && (
        <p style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.75, marginBottom: 12 }}>
          {intro.join(' ')}
        </p>
      )}

      {/* Accordion */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sections.map((sec, i) => (
          <div key={i} style={{
            border: `1.5px solid ${open[i] ? '#C7D2FE' : '#E5E7EB'}`,
            borderRadius: 10, overflow: 'hidden',
            transition: 'border-color .15s',
          }}>
            {/* Header */}
            <button
              type="button"
              onClick={() => toggle(i)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '11px 14px', border: 'none', cursor: 'pointer', textAlign: 'left',
                background: open[i] ? '#EEF2FF' : '#F9FAFB',
                borderBottom: open[i] ? '1px solid #C7D2FE' : 'none',
                transition: 'background .15s',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 13, color: open[i] ? '#1B5299' : '#374151' }}>
                {sec.title}
              </span>
              <ChevronDown
                size={16}
                color={open[i] ? '#1B5299' : '#9CA3AF'}
                style={{ transition: 'transform .2s', transform: open[i] ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
              />
            </button>

            {/* Body */}
            {open[i] && (
              <div style={{ padding: '12px 16px', background: 'white' }}>
                {sec.lines.length === 0
                  ? <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>Sem detalhes cadastrados.</p>
                  : sec.lines.map(renderLine)
                }
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
function Section({ title, children, last }) {
  return (
    <div style={{ marginBottom: last ? 0 : 16, paddingBottom: last ? 0 : 16, borderBottom: last ? 'none' : '1px solid #F3F4F6' }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: '#1B5299', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.75 }}>{children}</div>
    </div>
  );
}

const STEP_LGPD    = 0;
const STEP_SUCCESS = 4;

export default function PublicApplication({ jobs, onApply }) {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [job, setJob] = useState(() => {
    const fromStore = jobs.find(j => String(j.id) === String(jobId));
    if (fromStore) return fromStore;
    try {
      // Read raw from hash to avoid URLSearchParams decoding + as space
      const rawSearch = window.location.hash.split('?')[1] || '';
      const match = rawSearch.match(/(?:^|&)j=([^&]*)/);
      const enc = match ? decodeURIComponent(match[1]) : null;
      if (enc) {
        const lz = decompressFromEncodedURIComponent(enc);
        if (lz) return JSON.parse(lz);
        return JSON.parse(decodeURIComponent(escape(atob(enc))));
      }
    } catch {}
    return null;
  });

  const [loadingJob, setLoadingJob] = useState(!job);

  // If not found locally or in URL, fetch from GitHub Pages hosted file
  useEffect(() => {
    if (job) { setLoadingJob(false); return; }
    fetchJobFromServer(jobId).then(data => {
      if (data) setJob(data);
      setLoadingJob(false);
    });
  }, [jobId]);

  const [step, setStep] = useState(STEP_LGPD);
  const [lgpdChecked, setLgpdChecked] = useState(false);
  const [form, setForm] = useState({
    name: '', state: '', city: '', email: '', whatsapp: '', linkedin: 'https://www.linkedin.com/in/',
    salaryClaim: '', startAvailability: '', currentlyWorking: 'Não',
    resumeFile: null, resumeFileName: '', resumeText: '',
  });
  const [screeningAnswers, setScreeningAnswers] = useState({});
  const [discAnswers, setDiscAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const fileRef = useRef();

  useEffect(() => { window.scrollTo(0, 0); }, [step]);

  useEffect(() => {
    if (step !== STEP_SUCCESS) return;
    setCountdown(8);
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(interval); window.location.href = 'https://www.wayzim.com/en/'; return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  if (loadingJob) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '4px solid #E5E7EB', borderTop: '4px solid #1B5299', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: '#6B7280', fontSize: 14 }}>Carregando vaga...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  if (!job) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
        <h2 style={{ color: '#1F2937', marginBottom: 8 }}>Vaga não encontrada</h2>
        <p style={{ color: '#6B7280' }}>Esta vaga pode ter sido encerrada ou o link está incorreto.</p>
      </div>
    </div>
  );

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    set('resumeFileName', file.name);
    set('resumeText', '');
    const reader = new FileReader();
    reader.onload = (ev) => set('resumeFile', ev.target.result);
    reader.readAsDataURL(file);
    const text = await extractResumeText(file);
    set('resumeText', text);
  };

  const validateForm = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Nome obrigatório';
    if (!form.state) e.city = 'Selecione o estado';
    else if (!form.city) e.city = 'Selecione a cidade';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'E-mail inválido';
    if (!isValidWhatsApp(form.whatsapp)) e.whatsapp = 'WhatsApp inválido';
    if (!form.salaryClaim) e.salaryClaim = 'Selecione uma faixa';
    if (!form.startAvailability.trim()) e.startAvailability = 'Disponibilidade obrigatória';
    if (!form.resumeFileName) e.resume = 'Currículo obrigatório';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateScreening = () => {
    if (!job.screeningQuestions?.length) return true;
    const e = {};
    job.screeningQuestions.forEach(q => {
      if (q.required && !screeningAnswers[q.id]?.trim()) e[q.id] = 'Resposta obrigatória';
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextStep = () => {
    if (step === STEP_FORM && !validateForm()) return;
    if (step === STEP_SCREENING && !validateScreening()) return;
    setErrors({});
    setStep(s => s + 1);
  };

  const handleDiscAnswer = (qId, optionId, discType) => {
    setDiscAnswers(prev => ({ ...prev, [qId]: { optionId, discType } }));
    setTimeout(() => {
      if (currentQ < discQuestions.length - 1) {
        setCurrentQ(q => q + 1);
      } else {
        finishDisc({ ...discAnswers, [qId]: { optionId, discType } });
      }
    }, 320);
  };

  const finishDisc = async (answers) => {
    const counts = { D: 0, I: 0, S: 0, C: 0 };
    Object.values(answers).forEach(a => { if (a.discType) counts[a.discType]++; });
    const total = Object.values(counts).reduce((s, v) => s + v, 0) || 1;
    const scores = { D: Math.round((counts.D / total) * 100), I: Math.round((counts.I / total) * 100), S: Math.round((counts.S / total) * 100), C: Math.round((counts.C / total) * 100) };
    const profile = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    const disc = { profile, scores, completedAt: new Date().toISOString() };
    try {
      await submitApplication(disc);
    } catch {
      // garantir que avança mesmo se a análise IA falhar
    }
    setStep(STEP_SUCCESS);
  };

  const submitApplication = async (disc) => {
    setSubmitting(true);
    try {
      const candidate = {
        id: Date.now(),
        ...form,
        screeningAnswers: Object.entries(screeningAnswers).map(([qId, answer]) => ({ questionId: Number(qId), answer })),
        disc: { ...disc, completedAt: new Date().toISOString() },
        aiAnalysis: null,
        status: 'Inscrito',
        appliedDate: new Date().toISOString().slice(0, 10),
        languages: [],
        interviewComments: [],
      };
      let realAnalysis = null;
      try { realAnalysis = await generateRealAIAnalysis(candidate, job); } catch { /* fallback */ }
      candidate.aiAnalysis = realAnalysis || generateAIAnalysis(candidate, job);
      onApply(job.id, candidate);
    } finally {
      setSubmitting(false);
    }
  };

  const stepHasScreening = job.screeningQuestions?.length > 0;
  const currentStepNum = step === STEP_DISC ? (stepHasScreening ? 3 : 2) : step;
  const discQ = discQuestions[currentQ];
  const progress = ((currentQ) / discQuestions.length) * 100;

  // ── LGPD gate ──────────────────────────────────────────────────────────────
  if (step === STEP_LGPD) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #EEF2FF 0%, #F9FAFB 60%, #E0F2FE 100%)', display: 'flex', flexDirection: 'column' }}>
        <header style={{ background: 'white', borderBottom: '1px solid #E5E7EB', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <WayzimLogo height={34} />
          <span style={{ fontSize: 12, color: '#6B7280' }}>{job.title} · {job.department}</span>
        </header>

        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px 60px' }}>
          <div style={{ width: '100%', maxWidth: 640 }}>

            {/* Header card */}
            <div style={{ background: 'white', borderRadius: 16, padding: '28px 32px', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,.07)', border: '1px solid #E5E7EB' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 22 }}>🔒</span>
                </div>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: '#111827', margin: 0 }}>Privacidade e Proteção de Dados</h2>
                  <p style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0' }}>Conforme a Lei Geral de Proteção de Dados — Lei nº 13.709/2018 (LGPD)</p>
                </div>
              </div>

              {/* LGPD content */}
              <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.8 }}>

                <Section title="Dados Coletados">
                  Nome, e-mail, WhatsApp, localização, LinkedIn, currículo, pretensão salarial, disponibilidade e resultado da avaliação comportamental DISC.
                </Section>

                <Section title="Finalidade">
                  Seus dados serão usados exclusivamente para avaliação desta candidatura, comunicação sobre o processo seletivo e formação de banco de talentos interno da Wayzim.
                </Section>

                <Section title="Armazenamento e Compartilhamento">
                  Os dados ficam armazenados por até <strong>24 meses</strong>. Não são vendidos nem compartilhados com terceiros fora do processo seletivo.
                </Section>

                <Section title="Seus Direitos — Lei nº 13.709/2018 (LGPD)" last>
                  Você pode, a qualquer momento, solicitar acesso, correção ou exclusão dos seus dados, bem como revogar este consentimento, diretamente com a equipe de Pessoas da Wayzim.
                </Section>
              </div>
            </div>

            {/* Consent checkbox */}
            <div style={{ background: 'white', borderRadius: 12, padding: '18px 24px', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,.06)', border: lgpdChecked ? '1.5px solid #4F46E5' : '1.5px solid #E5E7EB', transition: 'border-color .2s' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={lgpdChecked}
                  onChange={e => setLgpdChecked(e.target.checked)}
                  style={{ width: 18, height: 18, marginTop: 2, accentColor: '#4F46E5', cursor: 'pointer', flexShrink: 0 }}
                />
                <span style={{ fontSize: 13, color: '#1F2937', lineHeight: 1.7 }}>
                  Li e compreendi as informações acima. <strong>Autorizo a Wayzim Technology a tratar meus dados pessoais</strong> para fins deste processo seletivo, conforme descrito na política acima e nos termos da Lei nº 13.709/2018 (LGPD). Sei que posso revogar este consentimento a qualquer momento.
                </span>
              </label>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setStep(STEP_FORM)}
                disabled={!lgpdChecked}
                style={{
                  flex: 1, padding: '13px', borderRadius: 10, border: 'none', cursor: lgpdChecked ? 'pointer' : 'not-allowed',
                  background: lgpdChecked ? '#4F46E5' : '#E5E7EB',
                  color: lgpdChecked ? 'white' : '#9CA3AF',
                  fontWeight: 700, fontSize: 14, transition: 'all .2s',
                }}
              >
                {lgpdChecked ? '✓ Autorizar e Iniciar Candidatura' : 'Aceite os termos para continuar'}
              </button>
            </div>

            <p style={{ textAlign: 'center', fontSize: 11, color: '#9CA3AF', marginTop: 16 }}>
              Ao prosseguir, você confirma que leu e concorda com os termos de privacidade acima.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #EEF2FF 0%, #F9FAFB 60%, #E0F2FE 100%)' }}>

      {/* Top bar */}
      <header style={{ background: 'white', borderBottom: '1px solid #E5E7EB', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <WayzimLogo height={34} />
        <span style={{ fontSize: 12, color: '#6B7280' }}>{job.title} · {job.department}</span>
      </header>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px 60px' }}>

        {/* ── Wayzim company intro ── */}
        {step === STEP_FORM && (
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #1B5299 100%)',
            borderRadius: 16, padding: '28px 28px 26px', marginBottom: 24,
            boxShadow: '0 8px 32px rgba(27,82,153,.25)', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(91,184,228,.07)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -40, left: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(91,184,228,.05)', pointerEvents: 'none' }} />

            <div style={{ position: 'relative' }}>

              {/* Badge */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(91,184,228,.12)', border: '1px solid rgba(91,184,228,.25)', borderRadius: 99, padding: '4px 14px', marginBottom: 18 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#5BB8E4', display: 'inline-block' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#5BB8E4', letterSpacing: '.08em', textTransform: 'uppercase' }}>Global · Inovação · Alta Performance</span>
              </div>

              {/* Headline */}
              <h2 style={{ fontSize: 21, fontWeight: 900, color: 'white', lineHeight: 1.25, marginBottom: 12, letterSpacing: '-.3px' }}>
                Automação logística de<br />
                <span style={{ color: '#5BB8E4' }}>escala global.</span>{' '}
                <span style={{ color: 'rgba(255,255,255,.45)', fontWeight: 400, fontSize: 17 }}>Oportunidade real.</span>
              </h2>

              {/* One-liner */}
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', lineHeight: 1.75, marginBottom: 20, maxWidth: 500 }}>
                A <strong style={{ color: 'white' }}>Wayzim</strong> é uma multinacional de tecnologia com presença na Ásia, Europa e Américas,
                especializada em intralogística inteligente, robótica e automação industrial de alta complexidade —
                em franca expansão no Brasil e América Latina.
              </p>

              {/* Stats row */}
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 20 }}>
                {[
                  { value: 'Global', label: 'Presença Internacional' },
                  { value: 'LATAM', label: 'Expansão Acelerada' },
                  { value: 'Deep Tech', label: 'Robótica & Automação' },
                ].map(({ value, label }) => (
                  <div key={label}>
                    <div style={{ fontSize: 15, fontWeight: 900, color: 'white', letterSpacing: '-.2px' }}>{value}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', fontWeight: 500, marginTop: 1 }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Divider + Links */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,.08)' }}>
                <a href="https://www.wayzim.com/en/" target="_blank" rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.55)', textDecoration: 'none', letterSpacing: '.02em' }}>
                  🌎 wayzim.com
                </a>
                <span style={{ color: 'rgba(255,255,255,.15)', fontSize: 14 }}>|</span>
                <a href="https://www.linkedin.com/company/wayzim/" target="_blank" rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.55)', textDecoration: 'none', letterSpacing: '.02em' }}>
                  🔗 LinkedIn
                </a>
              </div>

            </div>
          </div>
        )}

        {/* Job card */}
        {(
          <div style={{ background: 'white', borderRadius: 14, padding: '20px 24px', marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,.08)', border: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 8 }}>{job.title}</h1>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6B7280', background: '#F3F4F6', padding: '3px 10px', borderRadius: 99 }}><MapPin size={11} />{job.location}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6B7280', background: '#F3F4F6', padding: '3px 10px', borderRadius: 99 }}><Briefcase size={11} />{job.type}{job.modality ? ` · ${job.modality}` : ''}</span>
                  {job.salary && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#059669', background: '#ECFDF5', padding: '3px 10px', borderRadius: 99, fontWeight: 600 }}><DollarSign size={11} />{job.salary}</span>}
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#4F46E5', background: '#EEF2FF', padding: '3px 10px', borderRadius: 99, fontWeight: 600 }}>{job.department}</span>
                </div>
              </div>
              <span style={{ padding: '4px 12px', background: '#DCFCE7', color: '#16A34A', borderRadius: 99, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>● {job.status}</span>
            </div>
            {job.description && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #F3F4F6' }}>
                <JobDescription text={job.description} />
              </div>
            )}
          </div>
        )}

        {/* Step indicators */}
        {(
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            {[{ n: 1, label: 'Dados' }, ...(stepHasScreening ? [{ n: 2, label: 'Triagem' }] : []), { n: stepHasScreening ? 3 : 2, label: 'DISC' }].map((s, i, arr) => (
              <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: i < arr.length - 1 ? 1 : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, background: currentStepNum >= s.n ? '#4F46E5' : '#E5E7EB', color: currentStepNum >= s.n ? 'white' : '#9CA3AF', transition: 'all .3s', flexShrink: 0 }}>{currentStepNum > s.n ? '✓' : s.n}</div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: currentStepNum >= s.n ? '#4F46E5' : '#9CA3AF' }}>{s.label}</span>
                </div>
                {i < arr.length - 1 && <div style={{ flex: 1, height: 2, background: currentStepNum > s.n ? '#4F46E5' : '#E5E7EB', margin: '0 8px', transition: 'background .3s' }} />}
              </div>
            ))}
          </div>
        )}

        {/* STEP 1: Personal form */}
        {step === STEP_FORM && (
          <div style={{ background: 'white', borderRadius: 14, padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20, color: '#111827' }}>Suas Informações</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Nome Completo *" error={errors.name}>
                <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Seu nome completo" />
              </Field>
              <Field label="Estado *" error={errors.city}>
                <select
                  className="form-select"
                  value={form.state}
                  onChange={e => { set('state', e.target.value); set('city', ''); }}
                >
                  <option value="">Selecione o estado...</option>
                  {brazilStates.map(s => (
                    <option key={s.uf} value={s.uf}>{s.name} ({s.uf})</option>
                  ))}
                </select>
              </Field>
              <Field label="Cidade *">
                <select
                  className="form-select"
                  value={form.city}
                  onChange={e => set('city', e.target.value)}
                  disabled={!form.state}
                >
                  <option value="">{form.state ? 'Selecione a cidade...' : 'Selecione o estado primeiro'}</option>
                  {(brazilStates.find(s => s.uf === form.state)?.cities || []).map(c => (
                    <option key={c} value={`${c}, ${form.state}`}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="E-mail *" error={errors.email}>
                <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="seu@email.com" />
              </Field>
              <Field label="WhatsApp *" error={errors.whatsapp}>
                <input className="form-input" value={form.whatsapp} onChange={e => set('whatsapp', formatWhatsApp(e.target.value))} placeholder="(11) 99999-9999" maxLength={16} />
              </Field>
              <Field label="LinkedIn" style={{ gridColumn: '1/-1' }}>
                <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #E5E7EB', borderRadius: 8, overflow: 'hidden', background: 'white', transition: 'border-color .2s' }}
                  onFocusCapture={e => e.currentTarget.style.borderColor = '#4F46E5'}
                  onBlurCapture={e => e.currentTarget.style.borderColor = '#E5E7EB'}>
                  <span style={{ padding: '0 10px', fontSize: 12, color: '#9CA3AF', background: '#F9FAFB', borderRight: '1px solid #E5E7EB', whiteSpace: 'nowrap', alignSelf: 'stretch', display: 'flex', alignItems: 'center', userSelect: 'none' }}>
                    linkedin.com/in/
                  </span>
                  <input
                    style={{ flex: 1, border: 'none', outline: 'none', padding: '10px 12px', fontSize: 14, fontFamily: 'inherit', background: 'white' }}
                    value={form.linkedin.replace('https://www.linkedin.com/in/', '')}
                    onChange={e => {
                      const slug = e.target.value.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, '');
                      set('linkedin', 'https://www.linkedin.com/in/' + slug);
                    }}
                    placeholder="seu-perfil"
                  />
                </div>
              </Field>
              <Field label="Pretensão Salarial *" error={errors.salaryClaim}>
                <select className="form-select" value={form.salaryClaim} onChange={e => set('salaryClaim', e.target.value)}>
                  <option value="">Selecione uma faixa...</option>
                  {salaryRangesBRL.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </Field>
              <Field label="Disponibilidade para Início *" error={errors.startAvailability}>
                <select className="form-select" value={form.startAvailability} onChange={e => set('startAvailability', e.target.value)}>
                  <option value="">Selecione...</option>
                  {['Imediata', '15 dias', '30 dias', '45 dias', '60 dias'].map(v => <option key={v}>{v}</option>)}
                </select>
              </Field>
              <Field label="Trabalhando Atualmente?">
                <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                  {['Sim', 'Não'].map(v => (
                    <button key={v} type="button" onClick={() => set('currentlyWorking', v)} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: `2px solid ${form.currentlyWorking === v ? '#4F46E5' : '#E5E7EB'}`, background: form.currentlyWorking === v ? '#EEF2FF' : 'white', color: form.currentlyWorking === v ? '#4F46E5' : '#6B7280', fontWeight: 600, cursor: 'pointer', transition: 'all .15s', fontSize: 13 }}>{v}</button>
                  ))}
                </div>
              </Field>
              <div style={{ gridColumn: '1/-1' }}>
                <Field label="Currículo (PDF ou DOCX) *" error={errors.resume}>
                  <input ref={fileRef} type="file" accept=".pdf,.docx,.doc" style={{ display: 'none' }} onChange={handleFile} />
                  <div onClick={() => fileRef.current.click()} style={{ border: `2px dashed ${errors.resume ? '#EF4444' : form.resumeFileName ? '#4F46E5' : '#D1D5DB'}`, borderRadius: 10, padding: '20px', cursor: 'pointer', textAlign: 'center', background: form.resumeFileName ? '#EEF2FF' : '#FAFAFA', transition: 'all .2s' }}>
                    {form.resumeFileName ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#4F46E5' }}>
                        <CheckCircle size={18} />
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{form.resumeFileName}</span>
                        <button type="button" onClick={e => { e.stopPropagation(); set('resumeFileName', ''); set('resumeFile', null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X size={14} /></button>
                      </div>
                    ) : (
                      <>
                        <Upload size={22} color="#9CA3AF" style={{ margin: '0 auto 6px' }} />
                        <div style={{ fontSize: 13, color: '#6B7280' }}>Clique para enviar seu currículo</div>
                        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>PDF ou DOCX · Máx. 10MB</div>
                      </>
                    )}
                  </div>
                </Field>
              </div>
            </div>
            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={nextStep} style={{ padding: '10px 28px' }}>
                Continuar <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Screening */}
        {step === STEP_SCREENING && (
          <div style={{ background: 'white', borderRadius: 14, padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6, color: '#111827' }}>Perguntas de Triagem</h2>
            <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 24 }}>Responda com sinceridade — não há respostas certas ou erradas.</p>
            {job.screeningQuestions.map((q, i) => (
              <div key={q.id} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: i < job.screeningQuestions.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#1F2937', marginBottom: 8 }}>
                  {i + 1}. {q.text} {q.required && <span style={{ color: '#EF4444' }}>*</span>}
                </label>
                {q.type === 'yesno' ? (
                  <div style={{ display: 'flex', gap: 10 }}>
                    {['Sim', 'Não'].map(v => (
                      <button key={v} type="button" onClick={() => setScreeningAnswers(a => ({ ...a, [q.id]: v }))} style={{ padding: '8px 24px', borderRadius: 8, border: `2px solid ${screeningAnswers[q.id] === v ? '#4F46E5' : '#E5E7EB'}`, background: screeningAnswers[q.id] === v ? '#EEF2FF' : 'white', color: screeningAnswers[q.id] === v ? '#4F46E5' : '#6B7280', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>{v}</button>
                    ))}
                  </div>
                ) : (
                  <textarea className="form-textarea" style={{ minHeight: 80 }} value={screeningAnswers[q.id] || ''} onChange={e => setScreeningAnswers(a => ({ ...a, [q.id]: e.target.value }))} placeholder="Sua resposta..." />
                )}
                {errors[q.id] && <span style={{ fontSize: 11, color: '#EF4444', marginTop: 4, display: 'block' }}>{errors[q.id]}</span>}
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <button className="btn btn-secondary" onClick={() => setStep(STEP_FORM)}><ChevronLeft size={15} /> Voltar</button>
              <button className="btn btn-primary" onClick={nextStep} style={{ padding: '10px 28px' }}>Continuar <ChevronRight size={15} /></button>
            </div>
          </div>
        )}

        {/* STEP 3: DISC */}
        {step === STEP_DISC && (
          <div>
            <div style={{ background: 'white', borderRadius: 14, padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,.08)', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Análise de Perfil Comportamental</h2>
                  <p style={{ fontSize: 13, color: '#6B7280' }}>Escolha a opção que mais representa você naturalmente.</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#4F46E5' }}>{currentQ + 1}<span style={{ fontSize: 13, color: '#9CA3AF' }}>/{discQuestions.length}</span></div>
                </div>
              </div>
              {/* Progress */}
              <div style={{ height: 6, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden', marginBottom: 28 }}>
                <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg,#4F46E5,#7C3AED)', borderRadius: 99, transition: 'width .4s ease' }} />
              </div>

              {discQ && (
                <div key={discQ.id}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{discQ.emoji}</div>
                  <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 4, fontStyle: 'italic' }}>{discQ.context}</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: '#111827', marginBottom: 20 }}>{discQ.question}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {discQ.options.map((opt, oi) => {
                      const selected = discAnswers[discQ.id]?.optionId === opt.id;
                      return (
                        <button key={opt.id} type="button" onClick={() => handleDiscAnswer(discQ.id, opt.id, opt.disc)}
                          style={{ textAlign: 'left', padding: '14px 16px', borderRadius: 10, border: `2px solid ${selected ? '#4F46E5' : '#E5E7EB'}`, background: selected ? '#EEF2FF' : 'white', cursor: 'pointer', transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', border: `2px solid ${selected ? '#4F46E5' : '#D1D5DB'}`, background: selected ? '#4F46E5' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: selected ? 'white' : '#9CA3AF', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{['A', 'B', 'C', 'D'][oi]}</div>
                          <span style={{ fontSize: 14, color: selected ? '#4F46E5' : '#374151', fontWeight: selected ? 600 : 400, lineHeight: 1.5 }}>{opt.text}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => { setCurrentQ(0); setDiscAnswers({}); setStep(stepHasScreening ? STEP_SCREENING : STEP_FORM); }}><ChevronLeft size={13} /> Voltar</button>
              {Object.keys(discAnswers).length === discQuestions.length && (
                <button
                  className="btn btn-primary"
                  onClick={() => finishDisc(discAnswers)}
                  disabled={submitting}
                  style={{ padding: '10px 28px', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  {submitting ? 'Enviar' : 'Concluir candidatura'} <ChevronRight size={15} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP SUCCESS */}
        {step === STEP_SUCCESS && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>

            {/* Thank-you card */}
            <div style={{ background: 'white', borderRadius: 20, padding: '48px 40px', boxShadow: '0 4px 24px rgba(0,0,0,.08)', border: '1px solid #E5E7EB', textAlign: 'center', width: '100%' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#DCFCE7,#BBF7D0)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 32, boxShadow: '0 4px 16px rgba(5,150,105,.15)' }}>
                ✓
              </div>
              <h2 style={{ fontSize: 26, fontWeight: 900, color: '#111827', marginBottom: 10, letterSpacing: '-.3px' }}>
                Candidatura enviada com sucesso!
              </h2>
              <p style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.75, maxWidth: 460, margin: '0 auto 24px' }}>
                Obrigado, <strong style={{ color: '#111827' }}>{form.name.split(' ')[0]}</strong>! Recebemos sua candidatura para a vaga de{' '}
                <strong style={{ color: '#1B5299' }}>{job.title}</strong>. Nossa equipe irá analisar seu perfil e entrar em contato em breve.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', padding: '20px 0', borderTop: '1px solid #F3F4F6', borderBottom: '1px solid #F3F4F6', marginBottom: 24 }}>
                {[
                  { icon: '📧', text: `Confirmação enviada para ${form.email}` },
                  { icon: '📱', text: 'Fique atento ao seu WhatsApp e e-mail' },
                  { icon: '⏱️', text: 'Prazo de retorno: até 5 dias úteis' },
                ].map(({ icon, text }) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#4B5563' }}>
                    <span>{icon}</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>

              {/* Countdown + redirect */}
              <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 14 }}>
                Você será redirecionado para o site da Wayzim em{' '}
                <strong style={{ color: '#1B5299' }}>{countdown}s</strong>
              </p>
              <div style={{ height: 5, background: '#EEF2FF', borderRadius: 99, overflow: 'hidden', maxWidth: 280, margin: '0 auto 20px' }}>
                <div style={{ height: '100%', background: 'linear-gradient(90deg,#1B5299,#4F46E5)', borderRadius: 99, transition: 'width 1s linear', width: `${((countdown || 0) / 8) * 100}%` }} />
              </div>
              <a
                href="https://www.wayzim.com/en/"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 28px', background: '#1B5299', color: 'white', borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none', transition: 'background .2s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#154a87'}
                onMouseLeave={e => e.currentTarget.style.background = '#1B5299'}
              >
                🌎 Ir para wayzim.com agora
              </a>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

function Field({ label, children, error, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, ...style }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{label}</label>
      {children}
      {error && <span style={{ fontSize: 11, color: '#EF4444' }}>{error}</span>}
    </div>
  );
}
