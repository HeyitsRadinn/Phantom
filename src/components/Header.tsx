import React from "react";

const Header: React.FC = () => {
  return (
    // basic header for now
    <div className="relative h-14 flex items-center justify-between px-4 md:px-6 flex-shrink-0 z-10 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
        <span className="text-base font-semibold text-zinc-800 dark:text-zinc-100">
          Phantom
        </span>
      </div>
    </div>
  );
};

export default Header;
