import React from 'react';

const MainView: React.FC = () => {
  return (
    <div className="relative h-full w-full flex items-center justify-center overflow-y-auto">
      {/* Animated background accent for header */}
      <div className="absolute top-0 left-0 w-full h-[260px] z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-tr from-sky-400/20 via-fuchsia-400/10 to-indigo-400/20 blur-2xl opacity-70 animate-gradient-shift-slow" />
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[60vw] h-[180px] rounded-full bg-gradient-to-r from-sky-400/30 via-purple-400/20 to-pink-400/20 blur-3xl opacity-60 animate-gradient-rotate" />
      </div>
      <main className="relative z-10 max-w-3xl w-full mx-auto p-8 bg-white/80 dark:bg-zinc-900/80 shadow-none backdrop-blur-lg flex flex-col items-center transition-all duration-300">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-br from-violet-500 via-blue-500 to-sky-400 bg-clip-text text-transparent dark:from-violet-300 dark:via-blue-300 dark:to-sky-300 mb-2">
          Main Content Area
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400 text-lg text-center max-w-xl">
          Select an action or view from the sidebar or command palette.
        </p>
      </main>
    </div>
  );
};

export default MainView;
