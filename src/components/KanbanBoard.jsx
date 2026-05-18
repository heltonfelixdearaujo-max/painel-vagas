import { MapPin, Users } from 'lucide-react';

const columns = ['Aberta', 'Em Seleção', 'Encerrada'];

export default function KanbanBoard({ jobs, onCardClick, onCandidates }) {
  return (
    <div className="kanban-board">
      {columns.map(col => {
        const colJobs = jobs.filter(j => j.status === col);
        const colClass = col === 'Em Seleção' ? 'col-Em Seleção' : `col-${col}`;
        return (
          <div key={col} className="kanban-col">
            <div className={`kanban-col-header ${colClass}`}>
              <span className="kanban-col-title">{col}</span>
              <span className="kanban-col-count">{colJobs.length}</span>
            </div>
            <div className="kanban-cards">
              {colJobs.length === 0 ? (
                <div className="empty" style={{ padding: '20px 0' }}>
                  <p>Sem vagas</p>
                </div>
              ) : (
                colJobs.map(job => (
                  <div key={job.id} className="kanban-card" onClick={() => onCardClick(job)}>
                    <div className="kanban-card-title">{job.title}</div>
                    <div className="kanban-card-dept">{job.department}</div>
                    <div className="kanban-card-footer">
                      <div className="kanban-card-loc">
                        <MapPin size={11} />{job.location}
                      </div>
                      <button
                        className="cand-count"
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        onClick={e => { e.stopPropagation(); onCandidates(job); }}
                        title="Ver candidatos"
                      >
                        <Users size={12} /> {job.candidates.length}
                      </button>
                    </div>
                    {job.salary && (
                      <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 8 }}>{job.salary}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
