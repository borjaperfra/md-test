'use client';

import { signOut } from 'next-auth/react';
import Image from 'next/image';
import { LogOut } from 'lucide-react';

interface UserMenuProps {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export function UserMenu({ name, email, image }: UserMenuProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg px-2 py-2">
      {image ? (
        <Image src={image} alt={name ?? ''} width={28} height={28} className="rounded-full shrink-0" />
      ) : (
        <div className="h-7 w-7 rounded-full bg-gray-600 shrink-0 flex items-center justify-center text-xs font-medium text-white">
          {name?.[0]?.toUpperCase() ?? '?'}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="truncate text-xs font-medium text-gray-200">{name}</p>
        <p className="truncate text-[10px] text-gray-500">{email}</p>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        title="Cerrar sesión"
        className="shrink-0 text-gray-500 hover:text-gray-300 transition-colors"
      >
        <LogOut className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
