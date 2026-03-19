'use client';

import { Briefcase, Send, CalendarClock, BarChart2 } from 'lucide-react';
import Image from 'next/image';
import { NavItem } from './NavItem';
import { UserMenu } from './UserMenu';
import { FeedbackButton } from './FeedbackButton';

interface SidebarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

export function Sidebar({ user }: SidebarProps) {
  return (
    <aside className="flex w-56 flex-col bg-gray-900 py-6 px-3 shrink-0">
      <div className="mb-8 flex items-center gap-2.5 px-4">
        <Image
          src="/manfred_logo.png"
          alt="Manfred"
          width={28}
          height={28}
          className="rounded-md"
        />
        <span className="text-lg font-bold text-white">Manfred Daily</span>
      </div>
      <nav className="flex flex-col gap-1 flex-1">
        <NavItem href="/offers" icon={Briefcase} label="Pool de Ofertas" />
        <NavItem href="/generator" icon={Send} label="Generador" />
        <NavItem href="/scheduled" icon={CalendarClock} label="Programados" />
        <NavItem href="/analytics" icon={BarChart2} label="Analítica" />
      </nav>
      {user && (
        <div className="border-t border-gray-800 pt-3 flex flex-col gap-1">
          <FeedbackButton />
          <UserMenu name={user.name} email={user.email} image={user.image} />
        </div>
      )}
    </aside>
  );
}
