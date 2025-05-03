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

  // placeholder for future state
  currentRepo: string | null;
  currentBranch: string | null;
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

  currentRepo: null,
  currentBranch: null,
}));

export default useAppStore;
