import { Briefcase, Users, CheckCircle, Clock, TrendingUp, Star } from 'lucide-react';
import { discProfiles } from '../data/discQuestions';

const deptColors = ['#4f46e5', '#0891b2', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#db2777', '#ea580c'];

export default function Dashboard({ jobs, onViewChange }) {
  const totalJobs = jobs.length;
  const openJobs = jobs.filter(j => j.status === 'Aberta').length;
  const inSelection = jobs.filter(j => j.status === 'Em Seleção').length;
  const allCandidates = jobs.flatMap(j => j.candidates || []);
  const totalCandidates = allCandidates.length;
  const approved = allCandidates.filter(c => c.status === 'Aprovado').length;
  const withDisc = allCandidates.filter(c => c.disc?.profile).length;
  const avgScore = allCandidates.filter(c => c.aiAnalysis?.adherenceScore).length > 0
    ? Math.round(allCandidates.reduce((s, c) => s + (c.aiAnalysis?.adherenceScore || 0), 0) / allCandidates.filter(c => c.aiAnalysis?.adherenceScore).length)
    : 0;

  const byDept = jobs.reduce((acc, j) => { acc[j.department] = (acc[j.department] || 0) + 1; return acc; }, {});
  const deptList = Object.entries(byDept).sort((a, b) => b[1] - a[1]);
  const maxDept = deptList[0]?.[1] || 1;

  const discDist = allCandidates.reduce((acc, c) => { if (c.disc?.profile) acc[c.disc.profile] = (acc[c.disc.profile] || 0) + 1; return acc; }, {});

  const recentJobs = [...jobs].sort((a, b) => new Date(b.openDate) - new Date(a.openDate)).slice(0, 5);

  const statusBadge = (s) => {
    const map = { 'Aberta': 'badge-Aberta', 'Em Seleção': 'badge-Em Seleção', 'Encerrada': 'badge-Encerrada' };
    return 'badge ' + (map[s] || '');
  };

  const topCandidates = allCandidates
    .filter(c => c.aiAnalysis?.adherenceScore)
    .sort((a, b) => b.aiAnalysis.adherenceScore - a.aiAnalysis.adherenceScore)
    .slice(0, 4);

  return (
    <>
      <div className="stats-grid">
        {[
          { label: 'Total de Vagas', value: totalJobs, icon: Briefcase, color: '#4f46e5', bg: '#eef2ff' },
          { label: 'Vagas Abertas', value: openJobs, icon: CheckCircle, color: '#16a34a', bg: '#dcfce7' },
          { label: 'Em Seleção', value: inSelection, icon: Clock, color: '#d97706', bg: '#fef3c7' },
          { label: 'Candidatos', value: totalCandidates, icon: Users, color: '#0891b2', bg: '#e0f2fe' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg }}><s.icon size={20} color={s.color} /></div>
            <div><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Score + DISC row */}
      {totalCandidates > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#F0FDF4' }}><TrendingUp size={20} color="#16A34A" /></div>
            <div><div className="stat-value">{avgScore}%</div><div className="stat-label">Score Médio IA</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#FEF3C7' }}><Star size={20} color="#D97706" /></div>
            <div><div className="stat-value">{approved}</div><div className="stat-label">Aprovados</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#EEF2FF' }}><Users size={20} color="#4F46E5" /></div>
            <div><div className="stat-value">{withDisc}</div><div className="stat-label">Com DISC</div></div>
          </div>
        </div>
      )}

      <div className="two-col">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Vagas Recentes</div>
            <button className="btn btn-secondary btn-sm" onClick={() => onViewChange('vagas')}>Ver todas</button>
          </div>
          <div style={{ padding: '4px 20px 16px' }}>
            {recentJobs.map((job, i) => (
              <div key={job.id} className="list-item">
                <div className="dept-dot" style={{ background: deptColors[i % deptColors.length] }} />
                <div className="list-item-info">
                  <div className="list-item-title">{job.title}</div>
                  <div className="list-item-sub">{job.department} · {job.candidates?.length || 0} candidato{job.candidates?.length !== 1 ? 's' : ''}</div>
                </div>
                <span className={statusBadge(job.status)}>{job.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><div className="card-title">Vagas por Área</div></div>
            <div style={{ padding: '16px 20px' }}>
              {deptList.map(([dept, count], i) => (
                <div key={dept} className="bar-row">
                  <div className="bar-label" title={dept}>{dept}</div>
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${(count / maxDept) * 100}%`, background: deptColors[i % deptColors.length] }} /></div>
                  <div className="bar-count">{count}</div>
                </div>
              ))}
            </div>
          </div>

          {Object.keys(discDist).length > 0 && (
            <div className="card">
              <div className="card-header"><div className="card-title">Perfis DISC</div></div>
              <div style={{ padding: '16px 20px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {Object.entries(discDist).map(([p, count]) => {
                  const profile = discProfiles[p];
                  return (
                    <div key={p} style={{ flex: 1, minWidth: 80, textAlign: 'center', padding: '10px 8px', background: profile?.bg, borderRadius: 10, border: `1px solid ${profile?.color}22` }}>
                      <div style={{ fontSize: 20 }}>{profile?.emoji}</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: profile?.color }}>{count}</div>
                      <div style={{ fontSize: 10, color: '#6B7280', fontWeight: 600 }}>{p}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {topCandidates.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-header"><div className="card-title">🏆 Top Candidatos por Score IA</div></div>
          <div style={{ padding: '8px 20px 16px' }}>
            {topCandidates.map((c, i) => {
              const profile = c.disc?.profile ? discProfiles[c.disc.profile] : null;
              const job = jobs.find(j => (j.candidates || []).some(cand => cand.id === c.id));
              return (
                <div key={c.id} className="list-item">
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: ['#F59E0B', '#9CA3AF', '#CD7C2F', '#E5E7EB'][i], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: i < 3 ? 'white' : '#6B7280', flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: profile?.bg || '#EEF2FF', color: profile?.color || '#4F46E5', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{c.name.split(' ').map(p => p[0]).slice(0, 2).join('')}</div>
                  <div className="list-item-info">
                    <div className="list-item-title">{c.name}</div>
                    <div className="list-item-sub">{job?.title} {profile ? `· ${profile.emoji} ${profile.title}` : ''}</div>
                  </div>
                  <div style={{ fontWeight: 900, fontSize: 18, color: c.aiAnalysis?.adherenceScore >= 80 ? '#16A34A' : '#D97706' }}>{c.aiAnalysis?.adherenceScore}%</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
