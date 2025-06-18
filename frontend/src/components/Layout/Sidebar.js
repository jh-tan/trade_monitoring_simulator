import React from 'react';
import { BarChart3, TrendingUp, AlertTriangle, Settings } from 'lucide-react';

const Sidebar = () => {
  const menuItems = [
    { icon: BarChart3, label: 'Dashboard', active: true },
  ];

  return (
    <div className="bg-gray-900 text-white w-64 flex-shrink-0">
      <div className="p-6">
        <h2 className="text-xl font-bold">MarginTrader</h2>
      </div>
      
      <nav className="mt-8">
        {menuItems.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <a
              key={index}
              href="#"
              className={`flex items-center px-6 py-3 text-sm font-medium ${
                item.active
                  ? 'bg-gray-800 text-white border-r-2 border-blue-500'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <IconComponent className="w-5 h-5 mr-3" />
              {item.label}
            </a>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
