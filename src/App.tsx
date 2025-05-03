import React, { useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import MainView from "./components/MainView";
import CommandPalette from "./components/CommandPalette";
import useAppStore from "./store/appStore";

function App() {
  // get actions and repo path from store using the new names
  const {
    setFileStatus,
    setLoadingStatus,
    setKnownRepoPaths,
    setActiveRepoPath,
  } = useAppStore(); // Add setKnownRepoPaths, setActiveRepoPath
  const activeRepoPath = useAppStore((state) => state.activeRepoPath);

  // load known repos on mount
  useEffect(() => {
    const loadRepos = async () => {
      if (window.electronAPI?.invoke) {
        try {
          console.log("Renderer: Invoking repos:loadKnownPaths");
          const result = await window.electronAPI.invoke(
            "repos:loadKnownPaths"
          );
          console.log("Renderer: Received known paths:", result);
          if (result.status === "ok" && Array.isArray(result.data)) {
            setKnownRepoPaths(result.data);
            // optionally set the first known repo as active if none is active
            // or restore the last active repo (would need to save/load that too)
            if (!activeRepoPath && result.data.length > 0) {
              setActiveRepoPath(result.data[0]);
            }
          } else {
            console.error("Failed to load known repos:", result.message);
          }
        } catch (error) {
          console.error("IPC Error loading known repos:", error);
        }
      } else {
        console.warn("electronAPI not available to load known repos.");
      }
    };
    loadRepos();
  }, []);

  // fetch status on component mount or when active repo path changes
  useEffect(() => {
    const fetchStatus = async () => {
      // only fetch if a repo path is selected
      if (!activeRepoPath) {
        setFileStatus([], false, null);
        setLoadingStatus(false);
        return;
      }

      if (window.electronAPI?.invoke) {
        setLoadingStatus(true);
        try {
          console.log(
            `Renderer: Invoking git:status for path ${activeRepoPath}`
          );
          // pass the repo path to the IPC call
          const result = await window.electronAPI.invoke(
            "git:status",
            activeRepoPath
          );
          console.log("Renderer: Received git:status result:", result);
          if (result.status === "ok") {
            setFileStatus(result.data, false, null);
          } else {
            console.error("Error fetching status:", result.message);
            setFileStatus([], false, result.message);
          }
        } catch (error: any) {
          console.error("IPC Error calling git:status:", error);
          setFileStatus(
            [],
            false,
            error.message || "An unknown IPC error occurred"
          );
        }
      } else {
        console.warn("electronAPI or invoke function not found on window.");
        // ensure loading is false even if API is not available after path is set
        setFileStatus([], false, "Electron API not available.");
        setLoadingStatus(false);
      }
    };

    fetchStatus();
  }, [activeRepoPath, setFileStatus, setLoadingStatus]); // add activeRepoPath to dependency array

  return (
    <>
      <div className="flex h-screen transition-colors duration-300">
        <Sidebar />
        <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950">
          <Header />
          <MainView />
        </div>
      </div>
      <CommandPalette />
    </>
  );
}

export default App;
