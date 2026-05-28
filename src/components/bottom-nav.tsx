import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  CalendarCheck, 
  Briefcase 
} from 'lucide-react';

interface BottomNavProps {
  onOpenQuickAdd: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenQuickAdd }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-1 pointer-events-none flex justify-center md:hidden">
      <nav className="w-full max-w-md h-16 glass rounded-2xl shadow-premium border border-white/40 pointer-events-auto flex justify-between items-center px-6">
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${
              isActive 
                ? 'text-primary scale-110 font-semibold' 
                : 'text-slate-400 hover:text-slate-600'
            }`
          }
        >
          <LayoutDashboard size={20} />
          <span className="text-[10px] mt-0.5 font-medium">Home</span>
        </NavLink>

        <NavLink 
          to="/workers" 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${
              isActive 
                ? 'text-primary scale-110 font-semibold' 
                : 'text-slate-400 hover:text-slate-600'
            }`
          }
        >
          <Users size={20} />
          <span className="text-[10px] mt-0.5 font-medium">Workers</span>
        </NavLink>

        {/* Rapid Worker Add Accent Button */}
        <button 
          onClick={onOpenQuickAdd}
          className="flex flex-col items-center justify-center w-14 h-14 bg-gradient-to-tr from-primary to-primary-light text-white rounded-2xl shadow-lg -translate-y-4 hover:scale-105 active:scale-95 transition-all duration-200 pointer-events-auto border border-white/20"
          title="Rapid Worker Add"
        >
          <UserPlus size={24} />
        </button>

        <NavLink 
          to="/attendance" 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${
              isActive 
                ? 'text-primary scale-110 font-semibold' 
                : 'text-slate-400 hover:text-slate-600'
            }`
          }
        >
          <CalendarCheck size={20} />
          <span className="text-[10px] mt-0.5 font-medium">Check-In</span>
        </NavLink>

        <NavLink 
          to="/deployments" 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${
              isActive 
                ? 'text-primary scale-110 font-semibold' 
                : 'text-slate-400 hover:text-slate-600'
            }`
          }
        >
          <Briefcase size={20} />
          <span className="text-[10px] mt-0.5 font-medium">Deploy</span>
        </NavLink>
      </nav>
    </div>
  );
};
export default BottomNav;
