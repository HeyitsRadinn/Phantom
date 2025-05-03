import git from "isomorphic-git";
import http from "isomorphic-git/http/node"; // HTTP client for Node.js
import fs from "fs";
import path from "path";

// structure for file statuses
export interface FileStatus {
  filepath: string;
  status: string;
}

// structure for commit logs
export interface CommitLog {
  oid: string;
  message: string;
  author: {
    name: string;
    email: string;
    timestamp: number;
  };
  committer: {
    name: string;
    email: string;
    timestamp: number;
  };
}

export async function getStatus(repoPath: string): Promise<FileStatus[]> {
  try {
    if (
      !fs.existsSync(repoPath) ||
      !fs.existsSync(path.join(repoPath, ".git"))
    ) {
      throw new Error(
        `Invalid repository path or .git directory not found: ${repoPath}`
      );
    }
    console.log(
      `[gitClient] Attempting git.statusMatrix for path: ${repoPath}`
    );
    const statuses = await git.statusMatrix({ fs, dir: repoPath });
    console.log(`[gitClient] git.statusMatrix call completed.`);

    const mapStatus = (row: [number, number, number]): string => {
      // simple mapping for now
      if (row[1] === 0) return "*deleted";
      if (row[1] === 2 && row[2] === 0) return "*added";
      if (row[1] === 2 && row[2] === 2) return "added";
      if (row[0] === 1 && row[1] === 2 && row[2] === 1) return "unmodified";
      if (row[0] === 1 && row[1] === 2 && row[2] === 2) return "staged";
      if (row[0] === 1 && row[1] === 2 && row[2] === 1) return "*modified";
      // add more later
      return "unknown";
    };

    return statuses
      .map(([filepath, head, workdir, stage]) => ({
        filepath,
        status: mapStatus([head, workdir, stage]),
      }))
      .filter((s) => s.status !== "unmodified");
  } catch (error: any) {
    console.error(`Error getting status for ${repoPath}:`, error);
    throw new Error(`Failed to get status: ${error.message}`);
  }
}

// fetch commit history for current branch
export async function getLog(
  repoPath: string,
  depth: number = 50
): Promise<CommitLog[]> {
  try {
    if (
      !fs.existsSync(repoPath) ||
      !fs.existsSync(path.join(repoPath, ".git"))
    ) {
      throw new Error(
        `Invalid repository path or .git directory not found: ${repoPath}`
      );
    }

    const commits = await git.log({ fs, dir: repoPath, depth });
    return commits.map((c) => ({
      oid: c.oid,
      message: c.commit.message,
      author: c.commit.author,
      committer: c.commit.committer,
    }));
  } catch (error: any) {
    console.error(`Error getting log for ${repoPath}:`, error);
    throw new Error(`Failed to get log: ${error.message}`);
  }
}

// fetch updates from remote
export async function fetchRemote(repoPath: string, remote: string = "origin") {
  try {
    if (
      !fs.existsSync(repoPath) ||
      !fs.existsSync(path.join(repoPath, ".git"))
    ) {
      throw new Error(
        `Invalid repository path or .git directory not found: ${repoPath}`
      );
    }

    const result = await git.fetch({
      fs,
      http,
      dir: repoPath,
      remote,
      // add auth here if needed
    });
    console.log(`Fetch result for ${remote}:`, result);
    return result;
  } catch (error: any) {
    console.error(`Error fetching ${remote} for ${repoPath}:`, error);
    throw new Error(`Failed to fetch remote: ${error.message}`);
  }
}
