import React from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header'; // Import Header
import MainView from './components/MainView';
import CommandPalette from './components/CommandPalette';

function App() {
  return (
    <>
      {/* Animated background accent for the whole app */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-tr from-sky-400/10 via-fuchsia-400/5 to-indigo-400/10 blur-2xl opacity-70 animate-gradient-shift-slow" />
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[80vw] h-[300px] rounded-full bg-gradient-to-r from-sky-400/20 via-purple-400/10 to-pink-400/10 blur-3xl opacity-40 animate-gradient-rotate" />
      </div>
      <div className="flex h-screen bg-white dark:bg-zinc-950 transition-colors duration-300">
        <Sidebar />
        {/* Wrap Header and MainView for proper layout */}
        <div className="flex flex-col flex-1">
          <Header />
          <MainView />
        </div>
      </div>
      <CommandPalette />
    </>
  );
}

export default App;
