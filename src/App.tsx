import React, { useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import MainView from "./components/MainView";
import CommandPalette from "./components/CommandPalette";
import useAppStore from "./store/appStore";

function App() {
  // get actions and repo path from store
  const {
    setFileStatus,
    setLoadingStatus,
    setKnownRepoPaths,
    setActiveRepoPath,
    setCurrentBranch,   // Add branch actions
    setLocalBranches    // Add branch actions
  } = useAppStore();
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
  }, []); // Keep this effect for loading known paths on initial mount

  // Fetch status AND branch info when active repo path changes
  useEffect(() => {
    const fetchDataForRepo = async () => {
      // only fetch if a repo path is selected
      if (!activeRepoPath) {
        setFileStatus([], false, null);
        setCurrentBranch(null);
        setLocalBranches([]);
        setLoadingStatus(false); // Ensure loading is off if no repo
        return;
      }

      if (window.electronAPI?.invoke) {
        setLoadingStatus(true); // Indicate loading started
        // Clear previous branch info immediately
        setCurrentBranch(null);
        setLocalBranches([]);

        // Fetch status, current branch, and local branches concurrently
        try {
          console.log(`Renderer: Fetching data for path ${activeRepoPath}`);
          const [statusResult, currentBranchResult, localBranchesResult] = await Promise.all([
            window.electronAPI.invoke("git:status", activeRepoPath),
            window.electronAPI.invoke("git:getCurrentBranch", activeRepoPath),
            window.electronAPI.invoke("git:getLocalBranches", activeRepoPath)
          ]);

          // Handle status
          console.log("Renderer: Received git:status result:", statusResult);
          if (statusResult.status === "ok") {
            setFileStatus(statusResult.data, false, null); // Loading handled by finally block
          } else {
            console.error("Error fetching status:", statusResult.message);
            setFileStatus([], false, statusResult.message);
          }

          // Handle current branch
          console.log("Renderer: Received git:getCurrentBranch result:", currentBranchResult);
           if (currentBranchResult.status === "ok") {
            setCurrentBranch(currentBranchResult.data);
          } else {
            console.error("Error fetching current branch:", currentBranchResult.message);
             setCurrentBranch(null); // Set to null on error
          }

           // Handle local branches
           console.log("Renderer: Received git:getLocalBranches result:", localBranchesResult);
           if (localBranchesResult.status === "ok") {
            setLocalBranches(localBranchesResult.data);
          } else {
            console.error("Error fetching local branches:", localBranchesResult.message);
            setLocalBranches([]); // Set to empty array on error
          }

        } catch (error: any) {
          console.error("IPC Error fetching repo data:", error);
          setFileStatus([], false, error.message || "An unknown IPC error occurred");
          setCurrentBranch(null);
          setLocalBranches([]);
        } finally {
           setLoadingStatus(false); // Ensure loading is reset after all fetches complete or fail
        }
      } else {
        console.warn("electronAPI or invoke function not found on window.");
        setFileStatus([], false, "Electron API not available.");
        setCurrentBranch(null);
        setLocalBranches([]);
        setLoadingStatus(false);
      }
    };

    fetchDataForRepo();
  }, [activeRepoPath, setFileStatus, setLoadingStatus, setCurrentBranch, setLocalBranches]); // Update dependencies

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
