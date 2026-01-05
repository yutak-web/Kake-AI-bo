
import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';

const Layout: React.FC = () => {
  const activeStyle = "bg-gray-200 sketch-border text-black px-4 py-1";
  const inactiveStyle = "bg-white sketch-border text-gray-600 px-4 py-1 hover:bg-gray-100 transition";

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-2xl bg-white shadow-lg rounded-xl overflow-hidden min-h-[600px] flex flex-col">
        {/* Navigation Tabs */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-center space-x-4 mb-4">
            <NavLink 
              to="/registration" 
              className={({ isActive }) => isActive ? activeStyle : inactiveStyle}
            >
              収支登録
            </NavLink>
            <NavLink 
              to="/aggregation" 
              className={({ isActive }) => isActive ? activeStyle : inactiveStyle}
            >
              集計
            </NavLink>
            <NavLink 
              to="/settings" 
              className={({ isActive }) => isActive ? activeStyle : inactiveStyle}
            >
              設定
            </NavLink>
          </div>
          <hr className="border-gray-300" />
        </div>

        {/* Page Content */}
        <div className="flex-1 p-6">
          <Outlet />
        </div>

        {/* Footer info */}
        <div className="p-4 bg-gray-50 flex justify-between items-center text-xs text-gray-400">
          <span>Kake-AI-bo v1.0</span>
          <span>手書き風家計簿</span>
        </div>
      </div>
    </div>
  );
};

export default Layout;
