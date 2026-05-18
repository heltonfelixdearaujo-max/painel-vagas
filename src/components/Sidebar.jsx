import { useMemo } from 'react';
import { LayoutDashboard, Briefcase, LayoutGrid, Users, Settings, LogOut } from 'lucide-react';
import { logout } from '../utils/auth';
import WayzimLogo from './WayzimLogo';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'vagas', label: 'Vagas', icon: Briefcase },
  { id: 'kanban', label: 'Kanban', icon: LayoutGrid },
  { id: 'pool', label: 'Pool de Talentos', icon: Users },
];

export default function Sidebar({ view, setView, totalOpen, session, onLogout }) {
  const handleLogout = () => {
    logout();
    onLogout();
  };

  const unreadFeedbackCount = useMemo(() => {
    try {
      const shares = JSON.parse(localStorage.getItem('wayzim-shares') || '[]');
      return shares.reduce((acc, s) => acc + (s.feedbacks || []).filter(f => !f.read).length, 0);
    } catch { return 0; }
  }, [view]);

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <WayzimLogo height={26} />
      </div>

      {/* Nav */}
      <div className="sidebar-section">
        <div className="sidebar-label">Menu</div>
        {navItems.map(({ id, label, icon: Icon }) => (
          <button key={id} className={`nav-item ${view === id ? 'active' : ''}`} onClick={() => setView(id)}>
            <Icon size={16} />
            {label}
            {id === 'vagas' && totalOpen > 0 && <span className="nav-badge">{totalOpen}</span>}
          </button>
        ))}
        {unreadFeedbackCount > 0 && (
          <div style={{ margin: '6px 0 0', padding: '8px 12px', background: '#ECFDF5', borderRadius: 8, border: '1px solid #D1FAE5', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#065F46', fontWeight: 600 }}>
            <span style={{ background: '#059669', color: 'white', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>{unreadFeedbackCount}</span>
            Novo{unreadFeedbackCount > 1 ? 's' : ''} feedback{unreadFeedbackCount > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Admin section */}
      {session?.role === 'admin' && (
        <div className="sidebar-section">
          <div className="sidebar-label">Admin</div>
          <button className={`nav-item ${view === 'settings' ? 'active' : ''}`} onClick={() => setView('settings')}>
            <Settings size={16} /> Configurações
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="user-card">
          <div className="avatar" style={{ background: '#1B5EA8', fontSize: 11, fontWeight: 900 }}>
            {(session?.name || 'RH').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="user-name">{session?.name || 'Administrador'}</div>
            <div className="user-role">{session?.role === 'admin' ? 'Admin' : 'Recrutador'}</div>
          </div>
          <button onClick={handleLogout} title="Sair" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4, borderRadius: 6, display: 'flex', transition: 'color .15s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
            onMouseLeave={e => e.currentTarget.style.color = '#9CA3AF'}>
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
