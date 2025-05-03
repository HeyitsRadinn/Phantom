import React, { useEffect } from "react";
import useAppStore from "../../store/appStore";
import { CommitLog } from "../../../electron/gitClient";

// format timestamp
const formatDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleString();
};

// render commit log list
const CommitLogList: React.FC<{ commits: CommitLog[] }> = ({ commits }) => {
  if (commits.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
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
            <span className="font-mono text-xs text-blue-600 dark:text-blue-400">
              {commit.oid.substring(0, 7)}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {formatDate(commit.committer.timestamp)}
            </span>
          </div>
          <p className="font-medium text-zinc-800 dark:text-zinc-100 mb-0.5">
            {commit.message.split("\n")[0]}
          </p>
          <p className="text-xs text-zinc-600 dark:text-zinc-300">
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

  // fetch commit log on component mount
  useEffect(() => {
    const fetchLog = async () => {
      if (window.electronAPI?.invoke) {
        setLoadingLog(true);
        setCommitLog([], true, null);
        try {
          console.log("Renderer: Invoking git:log");
          const result = await window.electronAPI.invoke("git:log", 50);
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
      }
    };

    fetchLog();
  }, [setCommitLog, setLoadingLog]);

  return (
    <div className="p-4 h-full flex flex-col">
      <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100 mb-3 flex-shrink-0">
        Commit History
      </h2>
      <div className="flex-1 overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-md p-3 bg-white dark:bg-zinc-900/50">
        {isLoadingLog ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Loading history...
          </p>
        ) : errorLog ? (
          <p className="text-sm text-red-600 dark:text-red-400">
            Error: {errorLog}
          </p>
        ) : (
          <CommitLogList commits={commitLog} />
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;
