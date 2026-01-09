"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";

export function UserMenu() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  if (!session?.user) {
    return null;
  }

  const user = session.user;
  const initials = user.name?.charAt(0) || user.email?.charAt(0) || "?";

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--background)] transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-sm font-bold">
          {initials}
        </div>
        <span className="text-sm hidden sm:inline">{user.name || user.email}</span>
        <span className="text-[var(--muted)]">▼</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-56 card shadow-xl z-50 animate-fade-in">
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-[var(--muted)]">{user.email}</p>
            </div>

            <div className="py-2">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                🚪 Выйти
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
