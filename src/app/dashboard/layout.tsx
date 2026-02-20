import Link from 'next/link';
import { LayoutGrid, Users, Settings } from 'lucide-react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <div style={{
                        width: 36, height: 36, borderRadius: 8,
                        background: 'linear-gradient(135deg, #6c5ce7, #a78bfa)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, fontWeight: 800, color: 'white',
                    }}>A</div>
                    <h1>Agência 360</h1>
                </div>
                <nav className="sidebar-nav">
                    <Link href="/dashboard/clients" className="nav-item active">
                        <Users size={18} />
                        Clientes
                    </Link>
                    <Link href="/dashboard/carousels" className="nav-item">
                        <LayoutGrid size={18} />
                        Todos os Carrosséis
                    </Link>
                    <Link href="/dashboard" className="nav-item">
                        <Settings size={18} />
                        Configurações
                    </Link>
                </nav>
                <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Super Agência IA 360</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>MVP v1.0</div>
                </div>
            </aside>
            <main className="main-content">
                {children}
            </main>
        </div>
    );
}
