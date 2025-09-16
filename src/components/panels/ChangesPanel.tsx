import React, { useState, useMemo } from 'react';
import path from 'path-browserify';
import useAppStore from '../../store/appStore';
// No longer need shallow import
import { FileStatus } from '../../../electron/gitClient';
import { Plus, Minus, GitCommitHorizontal } from 'lucide-react';

// Helper component for a single file item with action button
const FileItem: React.FC<{
  file: FileStatus;
  action: 'stage' | 'unstage';
  onAction: (filepath: string) => void;
  isActionInProgress?: boolean;
}> = ({ file, action, onAction, isActionInProgress }) => {
  const isStaged = action === 'unstage';
  const Icon = isStaged ? Minus : Plus;
  const buttonStyle = isStaged
    ? 'text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300'
    : 'text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300';
  const buttonLabel = isStaged ? 'Unstage' : 'Stage';

  const displayStatus = file.status.startsWith('*') ? file.status.substring(1) : file.status;

  const statusStyle =
      displayStatus === 'modified' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200' :
      displayStatus === 'new' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' :
      displayStatus === 'deleted' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200' :
      (displayStatus === 'added' || displayStatus === 'deleted' || displayStatus === 'modified') && isStaged ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200' :
      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';

  return (
    <li className="flex items-center justify-between px-2 py-1.5 rounded group hover:bg-zinc-100 dark:hover:bg-zinc-800/60">
      <div className="flex items-center gap-2 overflow-hidden">
         <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${statusStyle}`}>
           {displayStatus}
         </span>
         {/* Ensure filename text color adapts */}
        <span className="truncate text-zinc-800 dark:text-zinc-100" title={file.filepath}>{file.filepath}</span>
      </div>
      <button
        onClick={() => onAction(file.filepath)}
        title={buttonLabel}
        disabled={isActionInProgress}
        className={`opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-150 p-1 rounded-full ${buttonStyle} hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed`}
      >
        <Icon className="w-4 h-4" />
      </button>
    </li>
  );
};


const ChangesPanel: React.FC = () => {
  const [commitMessage, setCommitMessage] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);
  const [isFileActionInProgress, setIsFileActionInProgress] = useState(false);

  // Select state pieces individually using separate selectors
  const fileStatus = useAppStore((state) => state.fileStatus);
  const isLoadingStatus = useAppStore((state) => state.isLoadingStatus);
  const errorStatus = useAppStore((state) => state.errorStatus);
  const activeRepoPath = useAppStore((state) => state.activeRepoPath);
  const setFileStatus = useAppStore((state) => state.setFileStatus);
  const setLoadingStatus = useAppStore((state) => state.setLoadingStatus);

  // Memoize separation of staged/unstaged files based on '*' prefix
  const { stagedFiles, unstagedFiles } = useMemo(() => {
    const staged = fileStatus.filter(f => !f.status.startsWith('*'));
    const unstaged = fileStatus.filter(f => f.status.startsWith('*'));
    return { stagedFiles: staged, unstagedFiles: unstaged };
  }, [fileStatus]);


  // --- Action Handlers ---
  const triggerStatusRefresh = async (currentRepoPath: string | null) => {
    // Prevent overlapping refreshes
    if (isLoadingStatus || !currentRepoPath || !window.electronAPI?.invoke) {
      console.log(`Refresh skipped (loading: ${isLoadingStatus}, path: ${!!currentRepoPath})`);
      return;
    }
    setLoadingStatus(true); // Set loading explicitly before async call
    try {
      console.log(`Triggering status refresh for ${currentRepoPath}`);
      const result = await window.electronAPI.invoke("git:status", currentRepoPath);
      // setFileStatus below will handle setting loading to false
      if (result.status === 'ok') {
        setFileStatus(result.data, false, null); // Update data, loading = false
      } else {
        setFileStatus([], false, result.message); // Set error, loading = false
      }
    } catch (error: any) {
      setFileStatus([], false, error.message || 'IPC error refreshing status'); // Set error, loading = false
    }
  };

  const handleStage = async (filepath: string) => {
    if (!activeRepoPath || !window.electronAPI?.invoke || isFileActionInProgress) return;
    setIsFileActionInProgress(true);
    try {
      console.log(`Staging ${filepath}`);
      const result = await window.electronAPI.invoke('git:stage', activeRepoPath, filepath);
      if (result.status === 'ok') {
        await triggerStatusRefresh(activeRepoPath);
      } else {
        console.error(`Error staging ${filepath}:`, result.message);
        // TODO: Show error toast
      }
    } catch (error: any) {
      console.error(`IPC Error staging ${filepath}:`, error);
      // TODO: Show error toast
    } finally {
       setIsFileActionInProgress(false);
    }
  };

  const handleUnstage = async (filepath: string) => {
     if (!activeRepoPath || !window.electronAPI?.invoke || isFileActionInProgress) return;
     setIsFileActionInProgress(true);
    try {
       console.log(`Unstaging ${filepath}`);
      const result = await window.electronAPI.invoke('git:unstage', activeRepoPath, filepath);
      if (result.status === 'ok') {
        await triggerStatusRefresh(activeRepoPath);
      } else {
        console.error(`Error unstaging ${filepath}:`, result.message);
        // TODO: Show error toast
      }
    } catch (error: any) {
      console.error(`IPC Error unstaging ${filepath}:`, error);
      // TODO: Show error toast
    } finally {
        setIsFileActionInProgress(false);
    }
  };

  const handleCommit = async () => {
    const currentStagedFiles = fileStatus.filter(f => !f.status.startsWith('*')); // Recalculate fresh value
    const currentCommitMessage = commitMessage.trim();

    // --- DEBUG LOG ---
    console.log('[handleCommit] Handler called. Checking conditions...');
    console.log(`[handleCommit] activeRepoPath: ${activeRepoPath}`);
    console.log(`[handleCommit] commitMessage trimmed: "${currentCommitMessage}"`);
    console.log(`[handleCommit] currentStagedFiles.length: ${currentStagedFiles.length}`); // Check fresh value
    console.log(`[handleCommit] window.electronAPI?.invoke exists: ${!!window.electronAPI?.invoke}`);
    console.log(`[handleCommit] isCommitting: ${isCommitting}`);
    // --- END DEBUG LOG ---

    // Re-verify all conditions *immediately* before proceeding
    if (!activeRepoPath || !currentCommitMessage || currentStagedFiles.length === 0 || !window.electronAPI?.invoke || isCommitting) {
       console.log('[handleCommit] Commit checks failed. Aborting.');
       // Log which condition failed specifically
       if (!activeRepoPath) console.log('[handleCommit] Reason: No activeRepoPath');
       if (!currentCommitMessage) console.log('[handleCommit] Reason: Commit message empty');
       if (currentStagedFiles.length === 0) console.log('[handleCommit] Reason: No staged files');
       if (!window.electronAPI?.invoke) console.log('[handleCommit] Reason: IPC unavailable');
       if (isCommitting) console.log('[handleCommit] Reason: Already committing');
      return;
    }

    // If checks pass, proceed
    console.log(`[handleCommit] Checks passed. Proceeding with commit...`);
    setIsCommitting(true);
     try {
       console.log(`Committing in ${activeRepoPath}`);
      const result = await window.electronAPI.invoke('git:commit', activeRepoPath, currentCommitMessage);
      if (result.status === 'ok') {
        console.log("Commit successful:", result.oid);
        setCommitMessage('');
        await triggerStatusRefresh(activeRepoPath);
        // TODO: Trigger history refresh?
      } else {
        console.error('Error committing:', result.message);
        // TODO: Show error toast
      }
    } catch (error: any) {
      console.error('IPC Error committing:', error);
      // TODO: Show error toast
    } finally {
       setIsCommitting(false);
    }
  };

  // --- Render Logic ---
  let stagedContent, unstagedContent;

  if (!activeRepoPath) {
    unstagedContent = <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center p-4">Open a repository to view changes.</p>;
    stagedContent = null;
  } else if (isLoadingStatus && fileStatus.length === 0) {
    unstagedContent = <p className="text-sm text-zinc-500 dark:text-zinc-400 px-2">Loading changes...</p>;
    stagedContent = <p className="text-sm text-zinc-500 dark:text-zinc-400 px-2">Loading...</p>;
  } else if (errorStatus) {
    unstagedContent = <p className="text-sm text-red-600 dark:text-red-400 px-2">Error: {errorStatus}</p>;
    stagedContent = null;
  } else {
    unstagedContent = unstagedFiles.length > 0 ? (
       <ul className="space-y-1 text-sm">
        {unstagedFiles.map(file => <FileItem key={file.filepath} file={file} action="stage" onAction={handleStage} isActionInProgress={isFileActionInProgress}/>)}
       </ul>
    ) : <p className="text-sm text-zinc-500 dark:text-zinc-400 italic px-2">No unstaged changes</p>;

    stagedContent = stagedFiles.length > 0 ? (
       <ul className="space-y-1 text-sm">
         {stagedFiles.map(file => <FileItem key={file.filepath} file={file} action="unstage" onAction={handleUnstage} isActionInProgress={isFileActionInProgress} />)}
       </ul>
    ) : <p className="text-sm text-zinc-500 dark:text-zinc-400 italic px-2">No staged changes</p>;
  }

  const canCommit = stagedFiles.length > 0 && commitMessage.trim().length > 0 && !isCommitting;

  return (
    <div className="p-4 h-full flex flex-col gap-4">
      {/* Unstaged Changes Section */}
      <div className="flex flex-col border border-zinc-200 dark:border-zinc-700 rounded-md">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 px-3 py-2 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-t-md flex-shrink-0">
            Changes ({unstagedFiles.length})
          </h3>
          {/* Use consistent panel background */}
          <div className="p-3 overflow-y-auto min-h-[6rem] max-h-60 bg-white dark:bg-zinc-900">
              {unstagedContent}
          </div>
      </div>

       {/* Staged Changes Section */}
       <div className="flex flex-col border border-zinc-200 dark:border-zinc-700 rounded-md">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 px-3 py-2 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-t-md flex-shrink-0">
            Staged Changes ({stagedFiles.length})
          </h3>
           {/* Use consistent panel background */}
          <div className="p-3 overflow-y-auto min-h-[6rem] max-h-60 bg-white dark:bg-zinc-900">
            {stagedContent}
          </div>
      </div>

      {/* Commit Area */}
      <div className="mt-auto pt-4 border-t border-zinc-200 dark:border-zinc-700 flex-shrink-0">
        <textarea
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          placeholder="Commit message"
          rows={3}
          // Ensure text is visible in dark mode for textarea
          className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-md text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-offset-zinc-900 dark:focus:border-blue-500 disabled:opacity-50"
          disabled={!activeRepoPath || isCommitting}
        />
        <button
          onClick={handleCommit}
          disabled={!canCommit || !activeRepoPath}
          className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
           <GitCommitHorizontal className="w-4 h-4" />
           {isCommitting ? 'Committing...' : `Commit ${stagedFiles.length > 0 ? `(${stagedFiles.length} file${stagedFiles.length > 1 ? 's' : ''})` : ''}`}
        </button>
      </div>
    </div>
  );
};

export default ChangesPanel;
