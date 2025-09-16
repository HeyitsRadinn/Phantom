import React, { useEffect } from "react";
import path from "path-browserify";
import useAppStore from "../../store/appStore";
import { CommitLog } from "../../../electron/gitClient";

const formatDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleString();
};

// render commit log list
const CommitLogList: React.FC<{ commits: CommitLog[] }> = ({ commits }) => {
  if (commits.length === 0) {
    return (
      // Ensure placeholder text has dark mode color
      <p className="text-sm text-zinc-500 dark:text-zinc-400 p-2">
        No commits found.
      </p>
    );
  }

  return (
    <ul className="space-y-3 text-sm">
      {commits.map((commit) => (
        <li
          key={commit.oid}
          className="border-b border-zinc-200 dark:border-zinc-700 pb-2 last:border-b-0"
        >
          <div className="flex justify-between items-center mb-1">
            {/* Ensure commit hash color is appropriate */}
            <span className="font-mono text-xs text-blue-600 dark:text-blue-400">
              {commit.oid.substring(0, 7)}
            </span>
             {/* Ensure timestamp color is appropriate */}
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {formatDate(commit.committer.timestamp)}
            </span>
          </div>
           {/* Ensure commit message color is appropriate */}
          <p className="font-medium text-zinc-800 dark:text-zinc-100 mb-0.5">
            {commit.message.split("\n")[0]}
          </p>
           {/* Ensure author color is appropriate */}
          <p className="text-xs text-zinc-600 dark:text-zinc-400"> {/* Adjusted dark mode author color */}
            {`${commit.author.name} <${commit.author.email}>`}
          </p>
        </li>
      ))}
    </ul>
  );
};

const HistoryPanel: React.FC = () => {
  const commitLog = useAppStore((state) => state.commitLog);
  const isLoadingLog = useAppStore((state) => state.isLoadingLog);
  const errorLog = useAppStore((state) => state.errorLog);
  const setCommitLog = useAppStore((state) => state.setCommitLog);
  const setLoadingLog = useAppStore((state) => state.setLoadingLog);
  const activeRepoPath = useAppStore((state) => state.activeRepoPath);

  // fetch commit log on component mount or when active repo path changes
  useEffect(() => {
    const fetchLog = async () => {
      // only fetch if a repo path is selected
      if (!activeRepoPath) {
        setCommitLog([], false, null);
        setLoadingLog(false);
        return;
      }

      if (window.electronAPI?.invoke) {
        setLoadingLog(true);
        setCommitLog([], true, null);
        try {
          console.log(`Renderer: Invoking git:log for path ${activeRepoPath}`);
          // pass repo path to IPC call
          const result = await window.electronAPI.invoke(
            "git:log",
            activeRepoPath,
            50
          );
          console.log("Renderer: Received git:log result:", result);
          if (result.status === "ok") {
            setCommitLog(result.data, false, null);
          } else {
            console.error("Error fetching log:", result.message);
            setCommitLog([], false, result.message);
          }
        } catch (error: any) {
          console.error("IPC Error calling git:log:", error);
          setCommitLog(
            [],
            false,
            error.message || "An unknown IPC error occurred"
          );
        }
      } else {
        console.warn("electronAPI or invoke function not found on window.");
        setCommitLog([], false, "Electron API not available.");
        setLoadingLog(false);
      }
    };

    fetchLog();
  }, [activeRepoPath, setCommitLog, setLoadingLog]);

  let content;
  if (!activeRepoPath) {
    content = (
       // Ensure placeholder text has dark mode color
      <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center p-4">
        Open a repository to view history.
      </p>
    );
  } else if (isLoadingLog) {
    content = (
       // Ensure loading text has dark mode color
      <p className="text-sm text-zinc-500 dark:text-zinc-400 p-2">
        Loading history...
      </p>
    );
  } else if (errorLog) {
    content = (
       // Ensure error text has dark mode color
      <p className="text-sm text-red-600 dark:text-red-400 p-2">
        Error: {errorLog}
      </p>
    );
  } else {
    content = <CommitLogList commits={commitLog} />;
  }

  return (
    <div className="p-4 h-full flex flex-col">
      <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100 mb-3 flex-shrink-0">
        Commit History{" "}
        {activeRepoPath ? `(${path.basename(activeRepoPath)})` : ""}{" "}
      </h2>
       {/* Use consistent panel background */}
      <div className="flex-1 overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-md p-3 bg-white dark:bg-zinc-900">
        {content}
      </div>
    </div>
  );
};

export default HistoryPanel;
