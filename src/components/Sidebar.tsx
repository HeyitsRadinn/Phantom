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
  Check,
  Loader2, // Add loader icon
} from "lucide-react";
import { Menu, Transition } from "@headlessui/react";
import useAppStore from "../store/appStore";

const SidebarItem: React.FC<{
  icon: React.ElementType;
  label: string;
  count?: number;
  isActive?: boolean;
  onClick?: () => void;
  isDimmed?: boolean;
  isDisabled?: boolean; // To disable during checkout
}> = ({ icon: Icon, label, count, isActive, onClick, isDimmed, isDisabled }) => (
  <li
    // Disable onClick if isDisabled is true
    onClick={isDisabled ? undefined : onClick}
    className={`flex items-center justify-between px-3 py-1.5 rounded-md text-sm transition-colors duration-100 group relative ${
      isDisabled
        ? "text-zinc-400 dark:text-zinc-600 cursor-not-allowed" // Disabled style
        : isActive
        ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200 font-semibold cursor-default" // Active (non-clickable visually)
        : isDimmed
        ? "text-zinc-500 dark:text-zinc-500 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer"
        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
    }
  `}
  >
    <div className="flex items-center gap-2.5">
      {/* Show loader instead of check if this item is being checked out */}
      {isDisabled && label === useAppStore.getState().currentBranch ? (
         <Loader2 className="w-4 h-4 text-zinc-400 dark:text-zinc-500 animate-spin" />
      ) : (
         <Icon className={`w-4 h-4 ${isActive ? '' : 'opacity-80'}`} />
      )}
      <span className="flex-1 truncate">{label}</span>
      {isActive && !isDisabled && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
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

// RepoSwitcher remains the same as previous correct version
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
                      {path.basename(repoPath)}
                    </button>
                  )}
                </Menu.Item>
              ))
            ) : (
              <div className="px-2 py-2 text-sm text-zinc-500 dark:text-zinc-400 italic">No known repositories</div>
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
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  </div>
);


// Sidebar Component
const Sidebar: React.FC = () => {
  // Get state and actions from Zustand store
  const {
    activeView,
    setActiveView,
    activeRepoPath,
    setActiveRepoPath,
    addKnownRepoPath,
    knownRepoPaths,
    currentBranch,
    setCurrentBranch,
    localBranches,
    // Removed setLocalBranches, setFileStatus, setCommitLog as they are not directly needed here
    // setLoadingStatus, // Can remove if not used directly here
    isCheckingOut,    // Get checkout loading state
    setIsCheckingOut, // Get checkout loading action
  } = useAppStore();

  const repoName = activeRepoPath ? path.basename(activeRepoPath) : "Select Repository...";

  // --- Handlers ---
  const handleAddRepository = async () => {
    if (window.electronAPI?.invoke) {
      try {
        const result = await window.electronAPI.invoke('dialog:openDirectory');
        if (result.status === 'ok' && result.path) {
          addKnownRepoPath(result.path);
          setActiveRepoPath(result.path); // This will trigger data refresh via useEffect in App.tsx
          setActiveView('Changes');
        }
      } catch (error) {
         console.error('IPC Error calling dialog:openDirectory:', error);
      }
    }
  };

  const handleSelectRepository = (path: string) => {
    if (path !== activeRepoPath) {
      setActiveRepoPath(path); // This will trigger data refresh via useEffect in App.tsx
      setActiveView('Changes');
    }
  };

  // Refined checkout handler
   const handleCheckoutBranch = async (branchName: string) => {
     if (!activeRepoPath || branchName === currentBranch || isCheckingOut || !window.electronAPI?.invoke) return;

     console.log(`Requesting checkout: ${branchName}`);
     setIsCheckingOut(true); // Set loading state

     try {
       const checkoutResult = await window.electronAPI.invoke('git:checkoutBranch', activeRepoPath, branchName);

       if (checkoutResult.status === 'ok') {
         console.log(`Checkout successful, fetching new branch name...`);
          // After successful checkout, just fetch the new current branch name
          // The useEffect in App listening to activeRepoPath will handle status/log refresh
         const currentBranchResult = await window.electronAPI.invoke("git:getCurrentBranch", activeRepoPath);
         if (currentBranchResult.status === 'ok') {
           setCurrentBranch(currentBranchResult.data);
           // Optionally refresh local branches list too, though less critical immediately
           // const localBranchesResult = await window.electronAPI.invoke("git:getLocalBranches", activeRepoPath);
           // if (localBranchesResult.status === 'ok') setLocalBranches(localBranchesResult.data);
         } else {
            console.error("Error fetching current branch after checkout:", currentBranchResult.message);
            setCurrentBranch(null); // Reset on error
         }
          // Force refresh status/log via App.tsx's useEffect dependency on activeRepoPath
          // (Alternative: Could manually trigger status/log refresh here if needed)

       } else if (checkoutResult.status === 'conflict') {
          // Handle checkout conflict
          console.warn(`Checkout conflict for ${branchName}:`, checkoutResult.message);
          const fileList = checkoutResult.files?.join('\n - ') || 'unknown files';
          alert(`Checkout Conflict:\n\nCannot switch to branch '${branchName}' because of uncommitted changes in the following files:\n\n - ${fileList}\n\nPlease commit, stash, or discard your changes before switching branches.`);
       } else {
         // Handle other generic errors
         console.error(`Error checking out ${branchName}:`, checkoutResult.message);
         alert(`Error checking out branch '${branchName}':\n${checkoutResult.message}`);
       }
     } catch (error: any) { // Catch IPC errors
       console.error(`IPC Error checking out ${branchName}:`, error);
       alert(`Failed to checkout branch '${branchName}':\n${error.message}`);
        // TODO: Show checkout error to user via toast/notification
     } finally {
       setIsCheckingOut(false); // Reset loading state regardless of outcome
     }
   };

  const changesCount = useAppStore((state) => state.fileStatus.length);

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
                  isDisabled={isCheckingOut} // Disable during checkout
                />
                <SidebarItem
                  icon={History}
                  label="History"
                  isActive={activeView === "History"}
                  onClick={() => setActiveView("History")}
                  isDisabled={isCheckingOut} // Disable during checkout
                />
              </ul>
            </div>
            <div>
              <h3 className="px-2 mb-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Branches
              </h3>
              <ul className="space-y-0.5">
                 {/* Display current branch first, always */}
                 {currentBranch && (
                      <SidebarItem
                         key={currentBranch}
                         icon={GitBranch}
                         label={currentBranch}
                         isActive={true} // Mark current as active
                         isDisabled={isCheckingOut} // Disable during checkout
                         // No onClick needed for active branch? Or maybe refresh?
                      />
                 )}
                 {/* List other local branches */}
                 {localBranches.filter(branch => branch !== currentBranch).map(branch => (
                      <SidebarItem
                         key={branch}
                         icon={GitBranch}
                         label={branch}
                         isActive={false}
                         isDimmed={true} // Dim non-active branches
                         isDisabled={isCheckingOut} // Disable during checkout
                         onClick={() => handleCheckoutBranch(branch)}
                      />
                 ))}
                 {/* Placeholder if no branches */}
                 {!currentBranch && localBranches.length === 0 && (
                     <li className="px-3 py-1.5 text-sm text-zinc-400 dark:text-zinc-500 italic">No branches found</li>
                 )}
              </ul>
            </div>
             <div>
              <h3 className="px-2 mb-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Stashes
              </h3>
              <ul className="space-y-0.5">
                <li className="px-3 py-1.5 text-sm text-zinc-400 dark:text-zinc-500 italic">No stashes</li>
              </ul>
            </div>
          </>
        )}
      </nav>
      <div className="relative mt-auto px-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        {/* Settings placeholder */}
      </div>
    </aside>
  );
};

export default Sidebar;
