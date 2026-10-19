import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home } from 'lucide-react';

export function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-full bg-[#FFF1EB] flex items-center justify-center text-[#D9580B] font-bold text-2xl font-['Epilogue'] mb-4">
        404
      </div>
      <h2 className="text-xl font-bold font-['Epilogue'] text-[#2B1B12]">Screen Not Found</h2>
      <p className="text-xs text-[#837561] mt-1 max-w-sm">
        The requested screen does not exist or may have been relocated.
      </p>
      <NavLink
        to="/"
        className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D9580B] text-white text-xs font-bold shadow-xs"
      >
        <Home className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </NavLink>
    </div>
  );
}
