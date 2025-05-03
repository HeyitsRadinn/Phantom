import React from 'react';
import { ArrowUp, ArrowDown, GitBranch } from 'lucide-react';

const HeaderButton: React.FC<{ icon: React.ElementType; label: string; onClick?: () => void }> = ({ icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 px-4 py-2 bg-white/70 dark:bg-zinc-800/70 text-sm text-zinc-700 dark:text-gray-200 shadow-none hover:bg-sky-50/80 dark:hover:bg-sky-900/60 transition-colors duration-150 backdrop-blur-md font-medium"
    title={label}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

const Header: React.FC = () => {
  const handleFetch = () => console.log("Fetch clicked");
  const handlePull = () => console.log("Pull clicked");
  const handlePush = () => console.log("Push clicked");
  const handleBranch = () => console.log("Branch clicked");

  return (
    <div className="relative h-20 flex items-center justify-between px-8 flex-shrink-0 z-20">
      {/* Animated background accent */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-sky-400/20 via-fuchsia-400/10 to-indigo-400/20 blur-2xl opacity-70 animate-gradient-shift-slow" />
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[60vw] h-[120px] rounded-full bg-gradient-to-r from-sky-400/30 via-purple-400/20 to-pink-400/20 blur-3xl opacity-60 animate-gradient-rotate" />
      </div>
      <div className="relative z-10 flex items-center gap-4">
        <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-br from-violet-500 via-blue-500 to-sky-400 bg-clip-text text-transparent dark:from-violet-300 dark:via-blue-300 dark:to-sky-300">Phantom</span>
      </div>
      <div className="relative z-10 flex items-center gap-3">
        <HeaderButton icon={ArrowDown} label="Fetch" onClick={handleFetch} />
        <HeaderButton icon={ArrowDown} label="Pull" onClick={handlePull} />
        <HeaderButton icon={ArrowUp} label="Push" onClick={handlePush} />
        <HeaderButton icon={GitBranch} label="Branch" onClick={handleBranch} />
      </div>
    </div>
  );
};

export default Header;
