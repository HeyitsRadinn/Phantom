import { create } from "zustand";
import { FileStatus, CommitLog } from "../../electron/gitClient";

// def types for store state and actions
interface AppState {
  activeView: "Changes" | "History" | string;
  setActiveView: (view: string) => void;

  // state for git data
  fileStatus: FileStatus[];
  commitLog: CommitLog[];
  isLoadingStatus: boolean;
  isLoadingLog: boolean;
  errorStatus: string | null;
  errorLog: string | null;

  // actions to update data
  setFileStatus: (
    status: FileStatus[],
    isLoading?: boolean,
    error?: string | null
  ) => void;
  setCommitLog: (
    log: CommitLog[],
    isLoading?: boolean,
    error?: string | null
  ) => void;
  setLoadingStatus: (isLoading: boolean) => void;
  setLoadingLog: (isLoading: boolean) => void;

  // List of known repository paths
  knownRepoPaths: string[];
  setKnownRepoPaths: (paths: string[]) => void;
  addKnownRepoPath: (path: string) => void; // Will handle adding and saving

  // Active repository path
  activeRepoPath: string | null; // Renamed from currentRepoPath
  setActiveRepoPath: (path: string | null) => void; // Renamed from setCurrentRepoPath

  // placeholder for future state
  // currentRepo: string | null;

  // Branch state
  currentBranch: string | null;
  localBranches: string[];
  setCurrentBranch: (branch: string | null) => void;
  setLocalBranches: (branches: string[]) => void;

  // Loading state for branch operations
  isCheckingOut: boolean;
  setIsCheckingOut: (loading: boolean) => void;
}

// create zustand store
const useAppStore = create<AppState>((set) => ({
  activeView: "Changes",
  setActiveView: (view) => set({ activeView: view }),

  fileStatus: [],
  commitLog: [],
  isLoadingStatus: false,
  isLoadingLog: false,
  errorStatus: null,
  errorLog: null,

  setFileStatus: (status, isLoading = false, error = null) =>
    set({ fileStatus: status, isLoadingStatus: isLoading, errorStatus: error }),
  setCommitLog: (log, isLoading = false, error = null) =>
    set({ commitLog: log, isLoadingLog: isLoading, errorLog: error }),
  setLoadingStatus: (isLoading) => set({ isLoadingStatus: isLoading }),
  setLoadingLog: (isLoading) => set({ isLoadingLog: isLoading }),

  // repo list state and actions
  knownRepoPaths: [], // init as empty array
  setKnownRepoPaths: (paths) => set({ knownRepoPaths: paths }),
  // action to add a path and make sure its unique and triggering save via IPC
  addKnownRepoPath: (path) => {
    set((state) => {
      const uniquePaths = Array.from(new Set([...state.knownRepoPaths, path]));
      // trigger save asynchronously (fire-and-forget or handle promise)
      if (window.electronAPI?.invoke) {
        window.electronAPI
          .invoke("repos:saveKnownPaths", uniquePaths)
          .catch((err) =>
            console.error("Failed to save known repo paths:", err)
          );
      } else {
        console.warn("electronAPI not available to save repo paths.");
      }
      return { knownRepoPaths: uniquePaths };
    });
  },

  // active repo state and action
  activeRepoPath: null, // renamed, init as null
  setActiveRepoPath: (
    path // renamed action
  ) =>
    set({
      activeRepoPath: path, // renamed state field
      // clear related data when repo changes
      fileStatus: [],
      commitLog: [],
      errorStatus: null,
      errorLog: null,
      // reset loading states? optional, depends on desired UX
      // isLoadingStatus: path ? true : false, // Example: start loading on path set
      // isLoadingLog: path ? true : false,
      // Also clear branch info on repo change
      currentBranch: null,
      localBranches: [],
    }),

  // --- Branch State & Actions ---
  currentBranch: null, // Initialize
  localBranches: [],
  setCurrentBranch: (branch) => set({ currentBranch: branch }),
  setLocalBranches: (branches) => set({ localBranches: branches }),

  // --- Branch Operation Loading State ---
  isCheckingOut: false,
  setIsCheckingOut: (loading) => set({ isCheckingOut: loading }),


  // --- Placeholder State ---
  currentRepo: null,
}));

export default useAppStore;
