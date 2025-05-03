import React from "react";
import path from "path-browserify";
import {
  GitBranch,
  History,
  FolderGit2,
  FileDiff,
  Layers,
  ChevronsUpDown,
  PlusCircle,
} from "lucide-react";
import { Menu, Transition } from "@headlessui/react";
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

// repo switcher
const RepoSwitcher: React.FC<{
  activeRepoName: string;
  knownPaths: string[];
  onSelectPath: (path: string) => void;
  onAddRepo: () => void;
}> = ({ activeRepoName, knownPaths, onSelectPath, onAddRepo }) => (
  <div className="relative mb-4">
    <Menu as="div" className="relative inline-block text-left w-full">
      <div>
        <Menu.Button className="flex items-center justify-between w-full px-3 py-2 text-left rounded-md bg-zinc-200/50 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors duration-100 group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-opacity-75">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <FolderGit2 className="w-4 h-4 text-blue-500 dark:text-blue-400 flex-shrink-0" />
            <span className="text-sm font-semibold truncate text-zinc-800 dark:text-zinc-100">
              {activeRepoName}
            </span>
          </div>
          <ChevronsUpDown className="w-4 h-4 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors duration-100 ml-1 flex-shrink-0" />
        </Menu.Button>
      </div>
      <Transition
        as={React.Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute left-0 right-0 z-30 mt-1 origin-top-right bg-white dark:bg-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none max-h-60 overflow-y-auto">
          <div className="px-1 py-1 ">
            {knownPaths.length > 0 ? (
              knownPaths.map((repoPath) => (
                <Menu.Item key={repoPath}>
                  {({ active }) => (
                    <button
                      onClick={() => onSelectPath(repoPath)}
                      className={`${
                        active ? 'bg-blue-500 text-white' : 'text-zinc-900 dark:text-zinc-100'
                      } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                    >
                      {/* TODO: maybe show full path on hover? */}
                      {path.basename(repoPath)}
                    </button>
                  )}
                </Menu.Item>
              ))
            ) : (
              <div className="px-2 py-2 text-sm text-zinc-500 italic">No known repositories</div>
            )}
          </div>
          <div className="px-1 py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={onAddRepo}
                  className={`${
                    active ? 'bg-blue-500 text-white' : 'text-zinc-700 dark:text-zinc-300'
                  } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                >
                  <PlusCircle className="w-4 h-4 mr-2" aria-hidden="true" />
                  Add Repository...
                </button>
              )}
            </Menu.Item>
             {/* TODO: add clone repo later */}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  </div>
);

// sidebar
const Sidebar: React.FC = () => {
  // get state and actions from zustand
  const activeView = useAppStore((state) => state.activeView);
  const setActiveView = useAppStore((state) => state.setActiveView);
  const activeRepoPath = useAppStore((state) => state.activeRepoPath);
  const setActiveRepoPath = useAppStore((state) => state.setActiveRepoPath);
  const addKnownRepoPath = useAppStore((state) => state.addKnownRepoPath);
  const knownRepoPaths = useAppStore((state) => state.knownRepoPaths);

  const repoName = activeRepoPath ? path.basename(activeRepoPath) : "Select Repository...";

  // handler to add repo
  const handleAddRepository = async () => {
    if (window.electronAPI?.invoke) {
      try {
        const result = await window.electronAPI.invoke('dialog:openDirectory');
        if (result.status === 'ok' && result.path) {
          addKnownRepoPath(result.path); 
          setActiveRepoPath(result.path); 
          setActiveView('Changes');
        }
      } catch (error) {
         console.error('IPC Error calling dialog:openDirectory:', error);
      }
    }
  };

  // handler for selecting a repo
  const handleSelectRepository = (path: string) => {
    if (path !== activeRepoPath) {
      setActiveRepoPath(path);
      setActiveView('Changes'); // switch to changes view
    }
  };

  // get dynamic data based on active repo
  const changesCount = useAppStore((state) => state.fileStatus.length);
  // TODO: get current branch name dynamically
  const currentBranch = "main"; // placeholder for now

  return (
    <aside className="relative w-60 md:w-64 h-screen flex flex-col pt-4 pb-4 px-3 bg-zinc-100 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 z-20 overflow-y-auto">
      <RepoSwitcher
        activeRepoName={repoName}
        knownPaths={knownRepoPaths}
        onSelectPath={handleSelectRepository}
        onAddRepo={handleAddRepository}
      />

      <nav className="flex-1 space-y-4">
        {activeRepoPath && (
          <>
            <div>
              <h3 className="px-2 mb-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Working Copy
              </h3>
              <ul className="space-y-0.5">
                <SidebarItem
                  icon={FileDiff}
                  label="Changes"
                  count={changesCount > 0 ? changesCount : undefined}
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
                  label={currentBranch} // placeholder for now
                  isActive={false} // TODO: needs logic
                />
                {/* TODO: fetch and list other branches */}
              </ul>
            </div>
             <div>
              <h3 className="px-2 mb-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Stashes
              </h3>
              <ul className="space-y-0.5">
                {/* TODO: fetch and display actual stashes */}
                <li className="px-3 py-1.5 text-sm text-zinc-400 dark:text-zinc-500 italic">No stashes</li>
              </ul>
            </div>
             {/* TODO: add remotes */}
          </>
        )}
      </nav>
      <div className="relative mt-auto px-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        {/* settings placeholder */}
      </div>
    </aside>
  );
};

export default Sidebar;
