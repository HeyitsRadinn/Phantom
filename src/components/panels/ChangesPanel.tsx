import React from 'react';
import useAppStore from '../../store/appStore';
import { FileStatus } from '../../../electron/gitClient';

// render file status list
const FileStatusList: React.FC<{ files: FileStatus[] }> = ({ files }) => {
  if (files.length === 0) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">No changes detected.</p>;
  }

  return (
    <ul className="space-y-1 text-sm">
      {files.map((file) => (
        <li key={file.filepath} className="flex items-center justify-between px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800">
          <span>{file.filepath}</span>
          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
            file.status === '*modified' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200' :
            file.status === '*added' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' :
            file.status === '*deleted' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200' :
            file.status === 'staged' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200' :
            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
          }`}>
            {file.status.replace('*', '')}
          </span>
        </li>
      ))}
    </ul>
  );
};

const ChangesPanel: React.FC = () => {
  // select state pieces individually
  const fileStatus = useAppStore((state) => state.fileStatus);
  const isLoadingStatus = useAppStore((state) => state.isLoadingStatus);
  const errorStatus = useAppStore((state) => state.errorStatus);

  return (
    <div className="p-4 h-full flex flex-col">
      <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100 mb-3 flex-shrink-0">
        Working Directory Changes
      </h2>
      <div className="flex-1 overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-md p-3 bg-white dark:bg-zinc-900/50">
        {isLoadingStatus ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading changes...</p>
        ) : errorStatus ? (
          <p className="text-sm text-red-600 dark:text-red-400">Error: {errorStatus}</p>
        ) : (
          <FileStatusList files={fileStatus} />
        )}
      </div>
      {/* commit area for later */}
     </div>
  );
};

export default ChangesPanel;
