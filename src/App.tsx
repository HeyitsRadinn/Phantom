import React, { useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import MainView from "./components/MainView";
import CommandPalette from "./components/CommandPalette";
import useAppStore from "./store/appStore";

function App() {
  const { setFileStatus, setLoadingStatus } = useAppStore();

  // fetch initial status on component mount
  useEffect(() => {
    const fetchStatus = async () => {
      if (window.electronAPI?.invoke) {
        setLoadingStatus(true);
        try {
          console.log("Renderer: Invoking git:status");
          const result = await window.electronAPI.invoke("git:status");
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
        setFileStatus([], false, "Electron API not available.");
      }
    };

    fetchStatus();
  }, []);

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
