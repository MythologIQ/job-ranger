import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main overflow-y-auto">
        <div className="content-wrap animate-rise px-2 py-4 sm:px-4 sm:py-6 md:px-6">
          {children}
        </div>
      </main>
    </div>
  );
}
