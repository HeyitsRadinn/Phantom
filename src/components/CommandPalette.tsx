import React, { useState, useEffect } from "react";
import { Command } from "cmdk";
import useAppStore from "../store/appStore";

const CommandPalette: React.FC = () => {
  const [open, setOpen] = useState(false);
  const {
    setActiveView,
    setFileStatus,
    setLoadingStatus,
    setCommitLog,
    setLoadingLog,
  } = useAppStore();

  // toggle
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "p" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  if (!open) {
    return null;
  }

  const closePalette = () => setOpen(false);

  // call handlers
  const handleFetch = async () => {
    closePalette();
    if (window.electronAPI?.invoke) {
      console.log("CommandPalette: Invoking git:fetch");
      try {
        const result = await window.electronAPI.invoke("git:fetch");
        console.log("CommandPalette: Received git:fetch result:", result);
        if (result.status === "ok") {
          handleRefreshStatus();
        } else {
          console.error("Fetch error:", result.message);
        }
      } catch (error: any) {
        console.error("IPC Error calling git:fetch:", error);
      }
    }
  };

  const handleRefreshStatus = async () => {
    closePalette();
    if (window.electronAPI?.invoke) {
      setLoadingStatus(true);
      setFileStatus([], true, null);
      try {
        const result = await window.electronAPI.invoke("git:status");
        if (result.status === "ok") {
          setFileStatus(result.data, false, null);
        } else {
          setFileStatus([], false, result.message);
        }
      } catch (error: any) {
        setFileStatus(
          [],
          false,
          error.message || "An unknown IPC error occurred"
        );
      }
    }
  };

  const handleRefreshLog = async () => {
    closePalette();
    if (window.electronAPI?.invoke) {
      setLoadingLog(true);
      setCommitLog([], true, null);
      try {
        const result = await window.electronAPI.invoke("git:log", 50);
        if (result.status === "ok") {
          setCommitLog(result.data, false, null);
        } else {
          setCommitLog([], false, result.message);
        }
      } catch (error: any) {
        setCommitLog(
          [],
          false,
          error.message || "An unknown IPC error occurred"
        );
      }
    }
  };

  // navigation handlers
  const handleGoToChanges = () => {
    setActiveView("Changes");
    closePalette();
  };

  const handleGoToHistory = () => {
    setActiveView("History");
    closePalette();
  };

  // placeholder for settings
  const handleGoToSettings = () => {
    console.log("Navigate to Settings (Not Implemented)");
    closePalette();
  };

  const dialogClasses =
    "fixed inset-0 z-50 flex items-start justify-center pt-[15vh]";
  const overlayClasses = "fixed inset-0 bg-black/60 z-10";
  const contentWrapperClasses =
    "relative z-20 bg-white dark:bg-zinc-900 rounded-lg shadow-lg max-w-lg w-full border border-zinc-200 dark:border-zinc-700 overflow-hidden";
  const inputClasses =
    "w-full p-3 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700 focus:outline-none placeholder-gray-400 dark:placeholder-zinc-500 text-base";
  const listClasses = "max-h-[400px] overflow-y-auto p-2";
  const itemClasses =
    "p-2 text-sm rounded-md cursor-pointer transition-colors duration-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 data-[selected=true]:bg-blue-600 data-[selected=true]:text-white font-medium";
  const emptyClasses =
    "p-4 text-center text-zinc-500 dark:text-zinc-400 text-sm";
  const groupHeadingClasses =
    "px-2 py-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider";

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Global Command Menu"
      className={dialogClasses}
    >
      <div className={overlayClasses} cmdk-overlay="" onClick={closePalette} />{" "}
      <div className={contentWrapperClasses} cmdk-dialog-content="">
        <Command.Input
          placeholder="Type a command or search..."
          className={inputClasses}
        />
        <Command.List className={listClasses}>
          <Command.Empty className={emptyClasses}>
            No results found.
          </Command.Empty>

          <Command.Group heading="Git Actions" className={groupHeadingClasses}>
            <Command.Item className={itemClasses} onSelect={handleFetch}>
              Fetch from Remote
            </Command.Item>
            <Command.Item
              className={itemClasses}
              onSelect={handleRefreshStatus}
            >
              Refresh Working Directory Status
            </Command.Item>
            <Command.Item className={itemClasses} onSelect={handleRefreshLog}>
              Refresh Commit History
            </Command.Item>
            {/* add pull push etc here later */}
          </Command.Group>

          <Command.Group heading="Navigation" className={groupHeadingClasses}>
            <Command.Item className={itemClasses} onSelect={handleGoToChanges}>
              Go to Changes
            </Command.Item>
            <Command.Item className={itemClasses} onSelect={handleGoToHistory}>
              Go to History
            </Command.Item>
            <Command.Item className={itemClasses} onSelect={handleGoToSettings}>
              Go to Settings
            </Command.Item>
          </Command.Group>
        </Command.List>
      </div>
    </Command.Dialog>
  );
};

export default CommandPalette;
