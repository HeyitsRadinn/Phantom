import React, { useState, useEffect } from 'react';
import { Command } from 'cmdk';

const CommandPalette: React.FC = () => {
  const [open, setOpen] = useState(false);

  // Toggle the command menu with Cmd+P or Ctrl+P
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'p' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  if (!open) {
    return null;
  }

  // Modern glassy styles
  const dialogClasses = "fixed inset-0 z-50 flex items-start justify-center pt-[15vh]";
  const overlayClasses = "fixed inset-0 bg-black/50 backdrop-blur-sm z-10";
  const contentWrapperClasses = "relative z-20 bg-white/80 dark:bg-zinc-900/80 rounded-2xl shadow-2xl max-w-lg w-full border border-zinc-200 dark:border-zinc-800 backdrop-blur-lg overflow-hidden";
  const inputClasses = "w-full p-4 bg-transparent border-b border-zinc-200 dark:border-zinc-700 focus:outline-none placeholder-gray-500 text-lg";
  const listClasses = "max-h-[400px] overflow-y-auto p-2";
  const itemClasses = "p-3 text-base rounded-xl cursor-pointer transition-all duration-150 hover:bg-sky-50/80 dark:hover:bg-sky-900/60 data-[selected=true]:bg-blue-600 data-[selected=true]:text-white font-medium";
  const emptyClasses = "p-6 text-center text-gray-400 text-base";
  const groupHeadingClasses = "px-2 py-1 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider";

  return (
    <Command.Dialog open={open} onOpenChange={setOpen} label="Global Command Menu" className={dialogClasses}>
      {/* Animated background accent for palette */}
      <div className="absolute top-0 left-0 w-full h-48 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-400/20 via-fuchsia-400/10 to-indigo-400/20 blur-2xl opacity-60 animate-gradient-shift-slow" />
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[40vw] h-[120px] rounded-full bg-gradient-to-r from-sky-400/30 via-purple-400/20 to-pink-400/20 blur-3xl opacity-40 animate-gradient-rotate" />
      </div>
      <div className={overlayClasses} cmdk-overlay="" onClick={() => setOpen(false)} />
      <div className={contentWrapperClasses} cmdk-dialog-content="">
        <Command.Input placeholder="Type a command or search..." className={inputClasses} />
        <Command.List className={listClasses}>
          <Command.Empty className={emptyClasses}>No results found.</Command.Empty>
          <Command.Group heading="Actions" className={groupHeadingClasses}>
            <Command.Item className={itemClasses} onSelect={() => console.log('Action: Open Repository')}>
              Open Repository...
            </Command.Item>
            <Command.Item className={itemClasses} onSelect={() => console.log('Action: Clone Repository')}>
              Clone Repository...
            </Command.Item>
          </Command.Group>
          <Command.Group heading="Navigation" className={groupHeadingClasses}>
            <Command.Item className={itemClasses} onSelect={() => console.log('Nav: Go to History')}>
              Go to History
            </Command.Item>
            <Command.Item className={itemClasses} onSelect={() => console.log('Nav: Go to Settings')}>
              Go to Settings
            </Command.Item>
          </Command.Group>
        </Command.List>
      </div>
    </Command.Dialog>
  );
};

export default CommandPalette;
