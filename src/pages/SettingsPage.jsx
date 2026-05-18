import { useState } from 'react';
import { Trash2, RotateCcw, Briefcase, Users, AlertTriangle, Shield, Bot, Eye, EyeOff, Check } from 'lucide-react';
import WayzimLogo from '../components/WayzimLogo';
import { getAnthropicKey, saveAnthropicKey } from '../utils/aiAnalysis';

export default function SettingsPage({ trash, onRestore, onPermanentDelete, onClearTrash, session }) {
  const [tab, setTab] = useState('jobs');
  const [confirmClear, setConfirmClear] = useState(false);
  const [apiKey, setApiKey] = useState(getAnthropicKey);
  const [showKey, setShowKey] = useState(false);
  const [keySaved, setKeySaved] = useState(false);

  const deletedJobs = (trash?.jobs || []);
  const deletedCandidates = (trash?.candidates || []);

  const tabs = [
    { id: 'jobs',       label: `Vagas Excluídas (${deletedJobs.length})`,       icon: Briefcase },
    { id: 'candidates', label: `Candidatos Excluídos (${deletedCandidates.length})`, icon: Users },
    { id: 'ia',         label: 'IA — Análise Real',                              icon: Bot },
    { id: 'account',    label: 'Conta Admin',                                    icon: Shield },
  ];

  const handleSaveKey = () => {
    saveAnthropicKey(apiKey);
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2500);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ background: 'white', borderRadius: 10, padding: '20px 24px', marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,.06)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Shield size={20} color="#D97706" />
        </div>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>Configurações Avançadas</h2>
          <p style={{ fontSize: 12, color: '#6B7280', marginTop: 1 }}>Área restrita ao administrador · {session?.email}</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, border: `1.5px solid ${tab === t.id ? '#1B5EA8' : '#E5E7EB'}`, background: tab === t.id ? '#EEF2FF' : 'white', color: tab === t.id ? '#1B5EA8' : '#6B7280', fontWeight: tab === t.id ? 700 : 500, cursor: 'pointer', fontSize: 13, transition: 'all .15s' }}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* Deleted Jobs */}
      {tab === 'jobs' && (
        <div style={{ background: 'white', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
          {deletedJobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9CA3AF' }}>
              <Trash2 size={36} style={{ margin: '0 auto 10px', opacity: .3 }} />
              <p style={{ fontSize: 14 }}>Nenhuma vaga excluída</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>Vagas excluídas ficam aqui por 30 dias antes de serem removidas permanentemente.</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
                {!confirmClear ? (
                  <button className="btn btn-secondary btn-sm" style={{ color: '#DC2626', borderColor: '#FCA5A5' }} onClick={() => setConfirmClear(true)}>
                    <Trash2 size={13} /> Limpar tudo
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#DC2626', fontWeight: 600 }}>Confirmar exclusão permanente?</span>
                    <button className="btn btn-danger btn-sm" onClick={() => { onClearTrash('jobs'); setConfirmClear(false); }}>Sim, excluir</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setConfirmClear(false)}>Cancelar</button>
                  </div>
                )}
              </div>
              {deletedJobs.map(job => (
                <div key={job.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#FEF2F2', borderRadius: 8, marginBottom: 8, border: '1px solid #FEE2E2' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{job.title}</div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{job.department} · {job.location} · {job.candidates?.length || 0} candidatos</div>
                    {job.deletedAt && <div style={{ fontSize: 11, color: '#EF4444', marginTop: 2 }}>Excluída em {new Date(job.deletedAt).toLocaleDateString('pt-BR')}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-secondary btn-sm" style={{ color: '#16A34A', borderColor: '#BBF7D0' }} onClick={() => onRestore('jobs', job.id)}>
                      <RotateCcw size={12} /> Restaurar
                    </button>
                    <button className="btn-icon" style={{ color: '#DC2626', borderColor: '#FCA5A5' }} onClick={() => onPermanentDelete('jobs', job.id)} title="Excluir permanentemente">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Deleted Candidates */}
      {tab === 'candidates' && (
        <div style={{ background: 'white', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
          {deletedCandidates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9CA3AF' }}>
              <Trash2 size={36} style={{ margin: '0 auto 10px', opacity: .3 }} />
              <p style={{ fontSize: 14 }}>Nenhum candidato excluído</p>
            </div>
          ) : (
            deletedCandidates.map(c => (
              <div key={`${c.id}-${c.jobId}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#FEF2F2', borderRadius: 8, marginBottom: 8, border: '1px solid #FEE2E2' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FEE2E2', color: '#DC2626', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {(c.name || '').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 1 }}>{c.email} · Vaga: {c.jobTitle}</div>
                  {c.deletedAt && <div style={{ fontSize: 11, color: '#EF4444', marginTop: 1 }}>Excluído em {new Date(c.deletedAt).toLocaleDateString('pt-BR')}</div>}
                </div>
                <button className="btn btn-secondary btn-sm" style={{ color: '#16A34A', borderColor: '#BBF7D0' }} onClick={() => onRestore('candidates', c.id, c.jobId)}>
                  <RotateCcw size={12} /> Restaurar
                </button>
                <button className="btn-icon" style={{ color: '#DC2626', borderColor: '#FCA5A5' }} onClick={() => onPermanentDelete('candidates', c.id, c.jobId)} title="Excluir permanentemente">
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* IA Config */}
      {tab === 'ia' && (
        <div style={{ background: 'white', borderRadius: 10, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 18, borderBottom: '1px solid #F3F4F6' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={20} color="#16A34A" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#111827' }}>Análise Real por IA — ChatGPT</div>
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 1 }}>Configure a chave da API da OpenAI para leitura real de currículos e análise de compatibilidade com a vaga</div>
            </div>
          </div>

          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#166534', lineHeight: 1.7 }}>
            <strong>Como funciona:</strong> ao receber uma candidatura (ou ao clicar em "Analisar com IA"), o sistema envia o currículo do candidato + descritivo completo da vaga para o <strong>ChatGPT (GPT-4o mini)</strong>. A IA lê o conteúdo real e gera percentual de compatibilidade, score técnico, comportamental, pontos fortes, gaps e resumo qualitativo — baseado exclusivamente no que foi declarado, sem inventar nada.
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
              Chave da API OpenAI (sk-proj-... ou sk-...)
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="sk-proj-..."
                  style={{ width: '100%', padding: '10px 40px 10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#16A34A'}
                  onBlur={e => e.target.style.borderColor = '#E5E7EB'}
                />
                <button type="button" onClick={() => setShowKey(s => !s)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0, display: 'flex' }}>
                  {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <button
                onClick={handleSaveKey}
                style={{ padding: '10px 20px', background: keySaved ? '#16A34A' : '#16A34A', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'background .2s', whiteSpace: 'nowrap', opacity: keySaved ? 1 : 0.85 }}>
                {keySaved ? <><Check size={14} /> Salvo!</> : 'Salvar Chave'}
              </button>
            </div>
            <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>
              A chave é salva localmente no navegador e nunca enviada a terceiros. Obtenha a sua em <strong>platform.openai.com/api-keys</strong>
            </p>
          </div>

          {!getAnthropicKey() && (
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#92400E' }}>
              ⚠ Sem chave configurada — o sistema usa análise automática por algoritmo como fallback. Configure a chave OpenAI para ativar a análise real pelo ChatGPT.
            </div>
          )}
          {getAnthropicKey() && (
            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#166534', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Check size={14} /> Chave configurada — análises serão geradas pelo ChatGPT (GPT-4o mini) em tempo real.
            </div>
          )}
        </div>
      )}

      {/* Account */}
      {tab === 'account' && (
        <div style={{ background: 'white', borderRadius: 10, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid #F3F4F6' }}>
            <WayzimLogo height={28} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Nome', value: session?.name },
              { label: 'E-mail', value: session?.email },
              { label: 'Perfil', value: 'Administrador' },
              { label: 'Sessão iniciada', value: session?.at ? new Date(session.at).toLocaleString('pt-BR') : '—' },
            ].map(f => (
              <div key={f.label} style={{ background: '#F9FAFB', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 2 }}>{f.label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{f.value}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, padding: '14px 16px', background: '#FEF3C7', borderRadius: 8, border: '1px solid #FDE68A', display: 'flex', gap: 10 }}>
            <AlertTriangle size={16} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 12, color: '#92400E', lineHeight: 1.6 }}>
              Esta conta possui acesso administrativo completo, incluindo recuperação de dados excluídos, pool de talentos e exportação de relatórios executivos.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
