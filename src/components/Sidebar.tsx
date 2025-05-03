import React from "react";
import {
  GitBranch,
  History,
  FolderGit2,
  FileDiff,
  Layers,
  ChevronsUpDown,
} from "lucide-react";
import useAppStore from "../store/appStore";

const SidebarItem: React.FC<{
  icon: React.ElementType;
  label: string;
  count?: number;
  isActive?: boolean;
  onClick?: () => void;
}> = ({ icon: Icon, label, count, isActive, onClick }) => (
  <li
    onClick={onClick}
    className={`flex items-center justify-between px-3 py-1.5 rounded-md text-sm cursor-pointer transition-colors duration-100 group
    ${
      isActive
        ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200 font-semibold"
        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100"
    }
  `}
  >
    <div className="flex items-center gap-2.5">
      <Icon className="w-4 h-4" />
      <span className="flex-1 truncate">{label}</span>
    </div>
    {count !== undefined && (
      <span
        className={`text-xs rounded-full px-1.5 py-0.5 font-medium transition-colors duration-100 ${
          isActive
            ? "bg-blue-200/80 dark:bg-blue-800/70 text-blue-800 dark:text-blue-100"
            : "bg-zinc-200 dark:bg-zinc-700/80 text-zinc-600 dark:text-zinc-200 group-hover:bg-zinc-300 dark:group-hover:bg-zinc-600/80 group-hover:text-zinc-700 dark:group-hover:text-zinc-100"
        }`}
      >
        {count}
      </span>
    )}
  </li>
);

// repo switcher for later
const RepoSwitcher: React.FC<{ currentRepo: string }> = ({ currentRepo }) => (
  <button className="flex items-center justify-between w-full px-3 py-2 mb-4 text-left rounded-md hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 transition-colors duration-100 group">
    <div className="flex items-center gap-2.5">
      <FolderGit2 className="w-4 h-4 text-blue-500 dark:text-blue-400 flex-shrink-0" />
      <span className="text-sm font-semibold truncate text-zinc-800 dark:text-zinc-100">
        {currentRepo}
      </span>
    </div>
    <ChevronsUpDown className="w-4 h-4 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors duration-100 ml-1 flex-shrink-0" />
  </button>
);

const Sidebar: React.FC = () => {
  const currentRepo = "Phantom";
  const currentBranch = "main";
  const changesCount = 3;
  const activeView = useAppStore((state) => state.activeView);
  const setActiveView = useAppStore((state) => state.setActiveView);

  return (
    // ui isnt actually that bad but ill make it better later
    <aside className="relative w-60 md:w-64 h-screen flex flex-col pt-4 pb-4 px-3 bg-zinc-100 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 z-20 overflow-y-auto">
      <RepoSwitcher currentRepo={currentRepo} />

      <nav className="flex-1 space-y-4">
        <div>
          <h3 className="px-2 mb-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Working Copy
          </h3>
          <ul className="space-y-0.5">
            <SidebarItem
              icon={FileDiff}
              label="Changes"
              count={changesCount}
              isActive={activeView === "Changes"}
              onClick={() => setActiveView("Changes")}
            />
            <SidebarItem
              icon={History}
              label="History"
              isActive={activeView === "History"}
              onClick={() => setActiveView("History")}
            />
          </ul>
        </div>
        <div>
          <h3 className="px-2 mb-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Branches
          </h3>
          <ul className="space-y-0.5">
            <SidebarItem
              icon={GitBranch}
              label={currentBranch}
              isActive={false}
            />
            <SidebarItem
              icon={GitBranch}
              label="feature/new-ui"
              isActive={false}
            />
          </ul>
        </div>
        <div>
          <h3 className="px-2 mb-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Stashes
          </h3>
          <ul className="space-y-0.5">
            <SidebarItem icon={Layers} label="Stash on main" isActive={false} />
          </ul>
        </div>
      </nav>
      <div className="relative mt-auto px-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        {/* settings placeholder for later */}
      </div>
    </aside>
  );
};

export default Sidebar;
