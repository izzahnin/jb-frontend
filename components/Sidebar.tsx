'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks';

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Super Admin',
  admin_sales: 'Sales',
  admin_ops: 'Ops',
};

type NavItem = {
  href: string;
  label: string;
  exact?: boolean;
  roles?: string[];
  icon: React.ReactNode;
};

function IconGrid() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}
function IconDocument() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}
function IconDispatch() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
    </svg>
  );
}
function IconTruck() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}
function IconBuilding() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  );
}
function IconShield() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}
function IconLogout() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
    </svg>
  );
}
function IconChevronLeft() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  );
}
function IconChevronRight() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', exact: true, icon: <IconGrid /> },
  { href: '/dashboard/customers', label: 'Customers', roles: ['super_admin', 'admin_sales'], icon: <IconBuilding /> },
  { href: '/dashboard/orders', label: 'Orders', roles: ['super_admin', 'admin_sales'], icon: <IconDocument /> },
  { href: '/dashboard/trucks', label: 'Trucks', roles: ['super_admin', 'admin_ops'], icon: <IconTruck /> },
  { href: '/dashboard/drivers', label: 'Drivers', roles: ['super_admin', 'admin_ops'], icon: <IconUsers /> },
  { href: '/dashboard/dispatch', label: 'Dispatch', roles: ['super_admin', 'admin_ops'], icon: <IconDispatch /> },
  { href: '/dashboard/users', label: 'Users', roles: ['super_admin'], icon: <IconShield /> },
];

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('jb_sidebar_collapsed');
    if (stored !== null) setCollapsed(stored === 'true');
  }, []);

  const toggleCollapse = () => {
    setCollapsed(prev => {
      localStorage.setItem('jb_sidebar_collapsed', String(!prev));
      return !prev;
    });
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (!user) return null;

  const isActive = (href: string, exact?: boolean) =>
    exact
      ? pathname === href
      : pathname.startsWith(href);

  return (
    <aside
      className={`
        hidden md:flex flex-col bg-slate-900 border-r border-slate-800 h-screen shrink-0 transition-all duration-200
        ${collapsed ? 'w-16' : 'w-60'}
      `}
    >
      {/* Logo */}
      <div className={`flex items-center h-14 px-3 border-b border-slate-800 shrink-0 ${collapsed ? 'justify-center' : 'gap-2.5'}`}>
        <div className="shrink-0 flex items-center justify-center" style={{ width: '36px', height: '24px' }}>
          <svg viewBox="0 0 114 75" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
            <path d="M9 56.5H2.5L15 44L27.5 56.5H20.5C20.5 65 20.5 65 33 65C44.5109 65 44.5 65 44.5 57V13V10.5H37.5L57 1.5L76 10.5H69V13V32.5H97C101 32.5 101 32.5 101 26.5C101 20.5 101 20.5 97 20.5H80V23L69.5 16L80 9.5V11.5H101C106 11.5 112.5 15 112.5 26C112.5 37 106 41 101 41H69V64.5H97C101 64.5 101 64.5 101 58C101 51.5 101 52 97 52H80V54.5L69.5 48L80 41.5V44H101C105.5 44 112.5 46.5 112.5 58C112.5 69.5 107.5 73.5 101 73.5H57.5V13H56V60C56 66.75 51.2473 73.5 40 73.5H23C17.7093 73.5 9 68.5 9 62V56.5Z" fill="#FFD00F"/>
          </svg>
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-none">
            <span className="text-sm font-semibold text-white tracking-tight">Jalur Berlian</span>
            <span className="text-[10px] text-slate-500 tracking-widest uppercase mt-0.5">Fleet Management</span>
          </div>
        )}
        {/* Collapse toggle — only on lg+ */}
        {!collapsed && (
          <button
            onClick={toggleCollapse}
            title="Perkecil sidebar"
            className="ml-auto hidden lg:flex w-6 h-6 items-center justify-center rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <IconChevronLeft />
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, exact, roles, icon }) => {
          const disabled = roles !== undefined && !roles.includes(user.role);
          const active = !disabled && isActive(href, exact);
          const baseClass = `flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors ${collapsed ? 'justify-center' : ''}`;
          if (disabled) {
            return (
              <span
                key={href}
                title={collapsed ? label : 'Akses terbatas untuk role ini'}
                className={`${baseClass} cursor-not-allowed opacity-40 text-slate-500 select-none`}
              >
                <span className="shrink-0">{icon}</span>
                {!collapsed && <span className="truncate">{label}</span>}
              </span>
            );
          }
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={`${baseClass} ${active ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}`}
            >
              <span className="shrink-0">{icon}</span>
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Expand button when collapsed (lg only) */}
      {collapsed && (
        <div className="hidden lg:flex justify-center py-2 border-t border-slate-800">
          <button
            onClick={toggleCollapse}
            title="Perlebar sidebar"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <IconChevronRight />
          </button>
        </div>
      )}

      {/* User info + logout */}
      <div className={`border-t border-slate-800 p-2 shrink-0 ${collapsed ? '' : ''}`}>
        {!collapsed ? (
          <Link
            href="/dashboard/profile"
            className={`flex items-center gap-2.5 px-2 py-2 mb-1 rounded-lg transition-colors cursor-pointer ${
              pathname.startsWith('/dashboard/profile') ? 'bg-slate-800' : 'hover:bg-slate-800/60'
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.username}</p>
              <p className="text-xs text-slate-500 truncate">{ROLE_LABEL[user.role] ?? user.role}</p>
            </div>
          </Link>
        ) : (
          <Link
            href="/dashboard/profile"
            title={user.username}
            className={`flex justify-center py-1 mb-1 rounded-lg transition-colors ${
              pathname.startsWith('/dashboard/profile') ? 'bg-slate-800' : 'hover:bg-slate-800/60'
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
              {user.username.charAt(0).toUpperCase()}
            </div>
          </Link>
        )}
        <button
          onClick={handleLogout}
          title={collapsed ? 'Logout' : undefined}
          className={`
            w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors
            ${collapsed ? 'justify-center' : ''}
          `}
        >
          <IconLogout />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
