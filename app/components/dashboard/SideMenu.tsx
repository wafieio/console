'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AiFillSignal, AiOutlineSearch, AiFillSetting } from 'react-icons/ai';
import type { NavigationItem } from '@/app/types/dashboard';

const menuItems: NavigationItem[] = [
  { href: '/overview', label: 'Overview', icon: AiFillSignal },
  { href: '/discovery', label: 'Discovery', icon: AiOutlineSearch },
  { href: '/settings', label: 'Settings', icon: AiFillSetting },
];

export default function SideMenu() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-base-100 border-r border-base-200 shadow-md h-screen overflow-y-auto">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-base-content">Wafie Console</h1>
        <p className="text-sm text-base-content/60 mt-1">Security Platform</p>
      </div>

      <ul className="px-4 py-4 space-y-2 w-full">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <li key={item.href} className="w-full">
              <Link
                href={item.href}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-colors hover:bg-base-300 ${
                  pathname.startsWith(item.href) ? 'bg-primary text-primary-content' : 'text-base-content'
                }`}
              >
                <IconComponent className="text-lg flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}