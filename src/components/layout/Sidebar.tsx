'use client';

import { Briefcase, Send, CalendarClock } from 'lucide-react';
import { NavItem } from './NavItem';

export function Sidebar() {
  return (
    <aside className="flex w-56 flex-col bg-gray-900 py-6 px-3 shrink-0">
      <div className="mb-8 px-4">
        <span className="text-lg font-bold text-white">Manfred Daily</span>
      </div>
      <nav className="flex flex-col gap-1">
        <NavItem href="/offers" icon={Briefcase} label="Pool de Ofertas" />
        <NavItem href="/generator" icon={Send} label="Generador" />
        <NavItem href="/scheduled" icon={CalendarClock} label="Programados" />
      </nav>
    </aside>
  );
}
