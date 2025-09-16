import git from "isomorphic-git";
import http from "isomorphic-git/http/node";
import fs from "fs";
import path from "path";
import { execSync } from 'child_process'; // Import for fallback

// --- Helper: Map Status Codes ---
const mapStatus = ([head, workdir, stage]: [number, number, number]): string => {
  if (head === 0 && workdir === 2 && stage === 0) return '*new';
  if (head === 0 && workdir === 2 && stage === 2) return 'added';
  if (head === 1 && workdir === 0 && stage === 0) return 'deleted';
  if (head === 1 && workdir === 0 && stage === 1) return '*deleted';
  if (head === 1 && workdir === 2 && stage === 1) return '*modified';
  if (head === 1 && workdir === 2 && stage === 2) return 'modified';
  if (head === 1 && workdir === 1 && stage === 2) return 'modified';
  if (head === 1 && workdir === 1 && stage === 0) return '*typechange';
  if (head === 1 && workdir === 1 && stage === 1) return 'unmodified';
  console.warn(`[gitClient] Unknown git status matrix: [${head}, ${workdir}, ${stage}]`);
  return 'unknown';
};

// --- Helper: Read Global Git Config ---
const readGlobalGitConfig = (key: string): string | null => {
  try {
    // Make sure git command is available
    execSync('git --version', { stdio: 'ignore' }); // Throws if git not found
    console.log(`[gitClient] Attempting to read global config: ${key}`);
    const value = execSync(`git config --global --get ${key}`, { encoding: 'utf8' }).trim();
    console.log(`[gitClient] Global config read success for ${key}: "${value}"`);
    return value || null; // Return null if value is empty string
  } catch (error: any) {
    // Specifically ignore errors where the config key isn't found (exit code 1 for `git config --get`)
    // or if git command itself isn't found.
    if (error.status === 1 || error.message.includes('command not found')) {
       console.log(`[gitClient] Global config key "${key}" not found or git command unavailable.`);
    } else {
       console.error(`[gitClient] Failed to read global config ${key}:`, error.message);
    }
    return null;
  }
}


// --- Interfaces ---
export interface FileStatus {
  filepath: string;
  status: string;
}
export interface CommitLog {
  oid: string; message: string;
  author: { name: string; email: string; timestamp: number; };
  committer: { name: string; email: string; timestamp: number; };
}

// --- Core Git Operations ---

export async function getStatus(repoPath: string): Promise<FileStatus[]> {
  try {
    if (!fs.existsSync(repoPath) || !fs.existsSync(path.join(repoPath, ".git"))) {
      throw new Error(`Invalid repository path: ${repoPath}`);
    }
    const statuses = await git.statusMatrix({ fs, dir: repoPath });
    return statuses
      .map(([filepath, head, workdir, stage]) => ({
        filepath, status: mapStatus([head, workdir, stage]),
      }))
      .filter((s) => s.status !== "unmodified");
  } catch (error: any) {
    console.error(`Error getting status for ${repoPath}:`, error);
    throw new Error(`Failed to get status: ${error.message}`);
  }
}

export async function getLog(repoPath: string, depth: number = 50): Promise<CommitLog[]> {
  try {
    if (!fs.existsSync(repoPath) || !fs.existsSync(path.join(repoPath, ".git"))) {
      throw new Error(`Invalid repository path: ${repoPath}`);
    }
    const commits = await git.log({ fs, dir: repoPath, depth });
    return commits.map((c) => ({
      oid: c.oid, message: c.commit.message,
      author: c.commit.author, committer: c.commit.committer,
    }));
  } catch (error: any) {
    console.error(`Error getting log for ${repoPath}:`, error);
    throw new Error(`Failed to get log: ${error.message}`);
  }
}

export async function fetchRemote(repoPath: string, remote: string = "origin") {
  try {
    if (!fs.existsSync(repoPath) || !fs.existsSync(path.join(repoPath, ".git"))) {
      throw new Error(`Invalid repository path: ${repoPath}`);
    }
    const result = await git.fetch({ fs, http, dir: repoPath, remote });
    console.log(`Fetch result for ${remote}:`, result);
    return result;
  } catch (error: any) {
    console.error(`Error fetching ${remote} for ${repoPath}:`, error);
    throw new Error(`Failed to fetch remote: ${error.message}`);
  }
}

export async function stageFile(repoPath: string, filepath: string): Promise<void> {
  try {
    await git.add({ fs, dir: repoPath, filepath });
  } catch (error: any) {
    console.error(`Error staging file ${filepath}:`, error);
    throw new Error(`Failed to stage file: ${error.message}`);
  }
}

export async function unstageFile(repoPath: string, filepath: string): Promise<void> {
  try {
    await git.remove({ fs, dir: repoPath, filepath });
  } catch (error: any) {
    console.error(`Error unstaging file ${filepath}:`, error);
    throw new Error(`Failed to unstage file: ${error.message}`);
  }
}

export async function commitChanges(
  repoPath: string, message: string, author: { name: string; email: string }
): Promise<string> {
  try {
    const statuses = await git.statusMatrix({ fs, dir: repoPath });
    const hasStagedFiles = statuses.some(([, head, workdir, stage]) => {
        const statusString = mapStatus([head, workdir, stage]);
        return !statusString.startsWith('*') && statusString !== 'unmodified';
    });
    if (!hasStagedFiles) {
       throw Object.assign(new Error('No changes added to commit.'), { code: 'NoChanges' });
    }
    const sha = await git.commit({
      fs, dir: repoPath, message,
      author: { name: author.name, email: author.email },
      committer: { name: author.name, email: author.email }
    });
    return sha;
  } catch (error: any) {
    console.error(`Error committing changes:`, error);
    if (error.code === 'NoChanges') throw new Error('No changes added to commit.');
    throw new Error(`Failed to commit: ${error.message}`);
  }
}

export async function getCurrentBranch(repoPath: string): Promise<string | null> {
  try {
    if (!fs.existsSync(repoPath) || !fs.existsSync(path.join(repoPath, ".git"))) {
       throw new Error(`Invalid repository path: ${repoPath}`);
    }
    const branchName = await git.currentBranch({ fs, dir: repoPath });
    return branchName ?? null;
  } catch (error: any) {
    console.error(`Error getting current branch for ${repoPath}:`, error);
    if (error.code === 'UnbornBranchError') return null;
    throw new Error(`Failed to get current branch: ${error.message}`);
  }
}

export async function getLocalBranches(repoPath: string): Promise<string[]> {
    try {
        if (!fs.existsSync(repoPath) || !fs.existsSync(path.join(repoPath, '.git'))) {
          throw new Error(`Invalid repository path: ${repoPath}`);
        }
        const refs = await git.listBranches({ fs, dir: repoPath });
        return refs.filter(ref => !ref.startsWith('remotes/'));
    } catch (error: any) {
        console.error(`Error listing local branches for ${repoPath}:`, error);
        throw new Error(`Failed to list local branches: ${error.message}`);
    }
}

export async function checkoutBranch(repoPath: string, branchName: string): Promise<void> {
    try {
         if (!fs.existsSync(repoPath) || !fs.existsSync(path.join(repoPath, '.git'))) {
          throw new Error(`Invalid repository path: ${repoPath}`);
        }
        await git.checkout({ fs, dir: repoPath, ref: branchName });
    } catch (error: any) {
        console.error(`Error checking out branch ${branchName}:`, error);
        throw error;
    }
}

// Updated getUserConfig with fallback and better logging
export async function getUserConfig(repoPath: string): Promise<{ name: string; email: string }> {
  const defaultName = 'Phantom User';
  const defaultEmail = 'user@phantom.app';

  let name = defaultName;
  let email = defaultEmail;

  try {
    // 1. Try reading from local repo config using isomorphic-git
    if (fs.existsSync(repoPath) && fs.existsSync(path.join(repoPath, ".git"))) {
      console.log(`[gitClient] Attempting local config read in ${repoPath}`);
      try {
        const localName = await git.getConfig({ fs, dir: repoPath, path: 'user.name' });
        console.log(`[gitClient] Local user.name result: "${localName}" (type: ${typeof localName})`);
        if (localName) name = localName;
      } catch (e: any) {
        if (e.code !== 'NotFoundError') console.error(`[gitClient] Error reading local user.name:`, e.message);
        else console.log(`[gitClient] Local user.name not found.`);
      }
      try {
        const localEmail = await git.getConfig({ fs, dir: repoPath, path: 'user.email' });
         console.log(`[gitClient] Local user.email result: "${localEmail}" (type: ${typeof localEmail})`);
        if (localEmail) email = localEmail;
      } catch (e: any) {
        if (e.code !== 'NotFoundError') console.error(`[gitClient] Error reading local user.email:`, e.message);
         else console.log(`[gitClient] Local user.email not found.`);
      }
    } else {
       console.warn(`[gitClient] Invalid repo path for local config lookup: ${repoPath}`);
    }

    // 2. If still default, try reading from global config using fallback
    if (name === defaultName) {
      console.log("[gitClient] Name still default, attempting global fallback.");
      name = readGlobalGitConfig('user.name') ?? defaultName;
    }
    if (email === defaultEmail) {
      console.log("[gitClient] Email still default, attempting global fallback.");
      email = readGlobalGitConfig('user.email') ?? defaultEmail;
    }

    console.log(`[gitClient] Final User config: Name=${name}, Email=${email}`);
    return { name, email };

  } catch (error: any) {
    // Catch any unexpected errors during the process
    console.error(`[gitClient] Unexpected error in getUserConfig for ${repoPath}:`, error);
    return { name: defaultName, email: defaultEmail }; // Return defaults on failure
  }
}
