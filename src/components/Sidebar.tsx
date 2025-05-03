import React from 'react';
import { GitBranch, History, FolderGit2, FileDiff, Layers } from 'lucide-react'; // Import icons

const SidebarItem: React.FC<{ icon: React.ElementType; label: string; count?: number; isActive?: boolean }> = ({ icon: Icon, label, count, isActive }) => (
  <li className={`flex items-center justify-between px-4 py-2 text-sm cursor-pointer transition-all duration-150 font-medium shadow-none border-none group
    ${isActive ? 'bg-white/80 dark:bg-zinc-900/80 text-blue-700 dark:text-blue-300 shadow-none' :
      'text-gray-500 dark:text-gray-400 hover:bg-sky-50/80 dark:hover:bg-sky-900/60 hover:text-blue-700 dark:hover:text-blue-300'}
  `}>
    <div className="flex items-center gap-2">
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </div>
    {count !== undefined && (
      <span className="text-xs bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-full px-2 py-0.5 font-semibold shadow group-hover:bg-blue-200/80 dark:group-hover:bg-blue-800/80 transition-all duration-150">{count}</span>
    )}
  </li>
);

const Sidebar: React.FC = () => {
  // Placeholder data - later this will come from Git state
  const currentRepo = "Phantom";
  const currentBranch = "main";
  const changesCount = 3; // Example

  return (
    <aside className="relative w-64 h-screen flex flex-col pt-6 pb-4 px-2 bg-white/80 dark:bg-zinc-900/80 border-r-0 shadow-none backdrop-blur-lg z-20 overflow-y-auto">
      {/* Animated background accent for sidebar */}
      <div className="absolute top-0 left-0 w-full h-48 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-400/20 via-fuchsia-400/10 to-indigo-400/20 blur-2xl opacity-60 animate-gradient-shift-slow" />
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[40vw] h-[120px] rounded-full bg-gradient-to-r from-sky-400/30 via-purple-400/20 to-pink-400/20 blur-3xl opacity-40 animate-gradient-rotate" />
      </div>
      <div className="relative z-10 px-4 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <FolderGit2 className="w-6 h-6 text-blue-400 dark:text-blue-300" />
          <h2 className="text-xl font-extrabold truncate bg-gradient-to-br from-violet-500 via-blue-500 to-sky-400 bg-clip-text text-transparent dark:from-violet-300 dark:via-blue-300 dark:to-sky-300" title={currentRepo}>{currentRepo}</h2>
        </div>
      </div>
      <nav className="relative z-10 flex-1 px-1 space-y-6">
        <div>
          <h3 className="px-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Working Copy</h3>
          <ul className="space-y-1">
            <SidebarItem icon={FileDiff} label="Changes" count={changesCount} isActive />
            <SidebarItem icon={History} label="History" />
          </ul>
        </div>
        <div>
          <h3 className="px-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Branches</h3>
          <ul className="space-y-1">
            <SidebarItem icon={GitBranch} label={currentBranch} />
            <SidebarItem icon={GitBranch} label="feature/new-ui" />
          </ul>
        </div>
        <div>
          <h3 className="px-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Stashes</h3>
          <ul className="space-y-1">
            <SidebarItem icon={Layers} label="Stash on main" />
          </ul>
        </div>
      </nav>
      <div className="relative z-10 mt-auto px-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        {/* Placeholder for settings gear or user info */}
      </div>
    </aside>
  );
};

export default Sidebar;
