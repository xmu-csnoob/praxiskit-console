import type { DirectoryEntry, FileSystemAdapter } from './directoryReader';

declare global {
  interface Window {
    showDirectoryPicker(): Promise<FileSystemDirectoryHandle>;
  }
}

/**
 * Check if the File System Access API is available.
 */
export function isFileSystemAccessSupported(): boolean {
  return 'showDirectoryPicker' in window;
}

/**
 * Open a directory picker using the File System Access API.
 * Returns null if the user cancels.
 */
export async function openDirectoryPicker(): Promise<FileSystemDirectoryHandle | null> {
  if (!isFileSystemAccessSupported()) {
    return null;
  }
  try {
    const handle = await window.showDirectoryPicker();
    return handle;
  } catch (err) {
    // User cancelled or permission denied
    if (err instanceof DOMException && err.name === 'AbortError') {
      return null;
    }
    throw err;
  }
}

/**
 * Create a FileSystemAdapter from a FileSystemDirectoryHandle.
 */
export function createFileSystemAdapter(
  dirHandle: FileSystemDirectoryHandle
): FileSystemAdapter {
  return new FileSystemAccessAdapter(dirHandle);
}

/**
 * Adapter using the File System Access API.
 */
class FileSystemAccessAdapter implements FileSystemAdapter {
  private dirHandle: FileSystemDirectoryHandle;

  constructor(dirHandle: FileSystemDirectoryHandle) {
    this.dirHandle = dirHandle;
  }

  async readFile(path: string): Promise<string> {
    const parts = path.split('/').filter(Boolean);
    let current: FileSystemDirectoryHandle = this.dirHandle;

    for (let i = 0; i < parts.length - 1; i++) {
      current = await current.getDirectoryHandle(parts[i]);
    }

    const fileName = parts[parts.length - 1];
    const fileHandle = await current.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    return file.text();
  }

  async listFiles(dirPath: string = ''): Promise<DirectoryEntry[]> {
    const parts = dirPath.split('/').filter(Boolean);
    let current: FileSystemDirectoryHandle = this.dirHandle;

    for (const part of parts) {
      current = await current.getDirectoryHandle(part);
    }

    const entries: DirectoryEntry[] = [];
    for await (const [name, handle] of current.entries()) {
      entries.push({
        name,
        kind: handle.kind,
        path: dirPath ? `${dirPath}/${name}` : name,
      });
    }
    return entries;
  }

  async readDirectoryRecursively(dirPath: string = ''): Promise<DirectoryEntry[]> {
    const entries = await this.listFiles(dirPath);
    const result: DirectoryEntry[] = [];

    const skipDirs = new Set(['node_modules', 'dist', '.git', '.claude', '.vscode', '.idea', 'coverage']);

    for (const entry of entries) {
      if (skipDirs.has(entry.name)) continue;
      result.push(entry);
      if (entry.kind === 'directory') {
        const children = await this.readDirectoryRecursively(entry.path);
        result.push(...children);
      }
    }

    return result;
  }

  async getFileMetadata(path: string): Promise<{ lastModified: number }> {
    const parts = path.split('/').filter(Boolean);
    let current: FileSystemDirectoryHandle = this.dirHandle;

    for (let i = 0; i < parts.length - 1; i++) {
      current = await current.getDirectoryHandle(parts[i]);
    }

    const fileName = parts[parts.length - 1];
    const fileHandle = await current.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    return { lastModified: file.lastModified };
  }

  getRootName(): string {
    return this.dirHandle.name;
  }

  async createDirectory(path: string): Promise<void> {
    const parts = path.split('/').filter(Boolean);
    let current: FileSystemDirectoryHandle = this.dirHandle;

    for (const part of parts) {
      current = await current.getDirectoryHandle(part, { create: true });
    }
  }

  async writeFile(path: string, content: string): Promise<void> {
    const parts = path.split('/').filter(Boolean);
    let current: FileSystemDirectoryHandle = this.dirHandle;

    for (let i = 0; i < parts.length - 1; i++) {
      current = await current.getDirectoryHandle(parts[i], { create: true });
    }

    const fileName = parts[parts.length - 1];
    const fileHandle = await current.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  }
}

/**
 * Create a FileSystemAdapter from drag-and-dropped files.
 * This is a fallback when File System Access API is not available.
 */
export function createDragDropAdapter(files: File[]): FileSystemAdapter {
  return new DragDropAdapter(files);
}

/**
 * Adapter using a flat list of dropped files.
 */
class DragDropAdapter implements FileSystemAdapter {
  private fileMap: Map<string, File>;

  constructor(files: File[]) {
    this.fileMap = new Map();
    for (const file of files) {
      // Use webkitRelativePath if available (from directory drag)
      const path = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
      this.fileMap.set(path, file);
    }
  }

  async readFile(path: string): Promise<string> {
    const file = this.fileMap.get(path);
    if (!file) {
      throw new Error(`File not found: ${path}`);
    }
    return file.text();
  }

  async listFiles(dirPath: string = ''): Promise<DirectoryEntry[]> {
    const prefix = dirPath ? `${dirPath}/` : '';
    const entries = new Map<string, DirectoryEntry>();

    for (const path of this.fileMap.keys()) {
      if (!path.startsWith(prefix)) continue;

      const relative = path.slice(prefix.length);
      const firstSlash = relative.indexOf('/');

      if (firstSlash === -1) {
        // Direct file
        entries.set(relative, {
          name: relative,
          kind: 'file',
          path: prefix + relative,
        });
      } else {
        // In a subdirectory
        const dirName = relative.slice(0, firstSlash);
        if (!entries.has(dirName)) {
          entries.set(dirName, {
            name: dirName,
            kind: 'directory',
            path: prefix + dirName,
          });
        }
      }
    }

    return Array.from(entries.values());
  }

  async readDirectoryRecursively(dirPath: string = ''): Promise<DirectoryEntry[]> {
    const prefix = dirPath ? `${dirPath}/` : '';
    const entries: DirectoryEntry[] = [];
    const seenDirs = new Set<string>();
    const skipDirs = new Set(['node_modules', 'dist', '.git', '.claude', '.vscode', '.idea', 'coverage']);

    for (const path of this.fileMap.keys()) {
      if (!path.startsWith(prefix)) continue;

      const relative = path.slice(prefix.length);
      if (!relative) continue;

      const parts = relative.split('/');
      // Skip if any parent dir is in skip list
      if (parts.some((p) => skipDirs.has(p))) continue;

      let currentPath = prefix;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        if (i < parts.length - 1) {
          // It's a directory
          if (!seenDirs.has(currentPath)) {
            seenDirs.add(currentPath);
            entries.push({
              name: part,
              kind: 'directory',
              path: currentPath,
            });
          }
        } else {
          // It's a file
          entries.push({
            name: part,
            kind: 'file',
            path: currentPath,
          });
        }
      }
    }

    return entries;
  }

  async getFileMetadata(path: string): Promise<{ lastModified: number }> {
    const file = this.fileMap.get(path);
    if (!file) {
      throw new Error(`File not found: ${path}`);
    }
    return { lastModified: file.lastModified };
  }

  getRootName(): string {
    return 'dropped-project';
  }

  async createDirectory(): Promise<void> {
    throw new Error('DragDropAdapter is read-only: cannot create directories');
  }

  async writeFile(): Promise<void> {
    throw new Error('DragDropAdapter is read-only: cannot write files');
  }
}
