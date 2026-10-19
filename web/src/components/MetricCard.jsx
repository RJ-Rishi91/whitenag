import React from 'react';

export function MetricCard({ title, value, subtext, icon: Icon, trend, color = 'primary' }) {
  const colorMap = {
    primary: 'text-[#D9580B] bg-[#FFF1EB]',
    maroon: 'text-[#7A1F2B] bg-[#FDE8E9]',
    teal: 'text-[#03353A] bg-[#E6F4F5]',
    emerald: 'text-emerald-700 bg-emerald-50',
    amber: 'text-amber-700 bg-amber-50'
  };

  const activeColor = colorMap[color] || colorMap.primary;

  return (
    <div className="card-surface p-5 transition-all duration-200 hover:shadow-md hover:border-[#D9580B]/40">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#837561]">{title}</span>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${activeColor}`}>
            <Icon className="w-5 h-5 stroke-[2]" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-2xl font-bold font-['Epilogue'] tracking-tight text-[#2B1B12] table-nums">
          {value}
        </div>
        {subtext && (
          <div className="mt-1 flex items-center text-xs text-[#837561]">
            {trend && <span className="font-semibold mr-1">{trend}</span>}
            <span>{subtext}</span>
          </div>
        )}
      </div>
    </div>
  );
}
