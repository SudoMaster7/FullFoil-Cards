import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Package, User, BookOpen } from 'lucide-react';
import clsx from 'clsx';

const BottomMenu = () => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const navItems = [
    { path: '/', icon: Home, label: 'Market', exact: true },
    { path: '/catalog', icon: BookOpen, label: 'Catálogo' },
    { path: '/orders', icon: Package, label: 'Pedidos' },
    { path: '/profile', icon: User, label: 'Perfil' },
  ];

  const checkActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname === item.path || location.pathname.startsWith(item.path + '/');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-gray-900 border-t border-gray-800 flex items-center justify-around px-2 z-50 pb-safe">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = checkActive(item);
        return (
          <Link
            key={item.path}
            to={item.path}
            className={clsx(
              "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
              active ? "text-primary" : "text-gray-500 hover:text-gray-300"
            )}
          >
            <Icon className={clsx("w-6 h-6", active && "fill-current/20")} />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
};

export default BottomMenu;
