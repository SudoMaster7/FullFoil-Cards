import React from 'react';
import Navbar from './Navbar';
import BottomMenu from './BottomMenu';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-16 pb-20 px-4 overflow-y-auto">
        <div className="max-w-md mx-auto w-full h-full">
          {children}
        </div>
      </main>

      <BottomMenu />
    </div>
  );
};

export default Layout;
