import React from "react";
import useAppStore from "../store/appStore";
import ChangesPanel from "./panels/ChangesPanel";
import HistoryPanel from "./panels/HistoryPanel";

const MainView: React.FC = () => {
  // get active view from store
  const activeView = useAppStore((state) => state.activeView);

  const renderActivePanel = () => {
    switch (activeView) {
      case "Changes":
        return <ChangesPanel />;
      case "History":
        return <HistoryPanel />;
      default:
        return (
          <div className="p-4 text-center text-zinc-500">
            Unknown view selected: {activeView}
          </div>
        );
    }
  };

  return <div className="flex-1 overflow-y-auto">{renderActivePanel()}</div>;
};

export default MainView;
