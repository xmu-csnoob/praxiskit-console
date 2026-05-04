export interface DirectoryEntry {
  name: string;
  path: string;
  kind: 'file' | 'directory';
}

export interface FileSystemDirectory {
  name: string;
  entries: DirectoryEntry[];
}

export interface FileSystemAdapter {
  readFile(path: string): Promise<string>;
  listFiles(dirPath?: string): Promise<DirectoryEntry[]>;
  readDirectoryRecursively(dirPath?: string): Promise<DirectoryEntry[]>;
  getFileMetadata(path: string): Promise<{ lastModified: number }>;
  getRootName(): string;
  createDirectory(path: string): Promise<void>;
  writeFile(path: string, content: string): Promise<void>;
}

export async function readDirectoryEntries(
  dirHandle: FileSystemDirectoryHandle
): Promise<DirectoryEntry[]> {
  const entries: DirectoryEntry[] = [];
  for await (const [name, handle] of dirHandle.entries()) {
    entries.push({
      name,
      path: name,
      kind: handle.kind,
    });
  }
  return entries;
}

export async function readFileContent(
  dirHandle: FileSystemDirectoryHandle,
  filePath: string
): Promise<string> {
  const parts = filePath.split('/');
  let current = dirHandle;

  for (let i = 0; i < parts.length - 1; i++) {
    current = await current.getDirectoryHandle(parts[i]);
  }

  const fileHandle = await current.getFileHandle(parts[parts.length - 1]);
  const file = await fileHandle.getFile();
  return file.text();
}

export async function readAllFilesInDirectory(
  dirHandle: FileSystemDirectoryHandle,
  subPath: string = ''
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const current = subPath
    ? await getSubDirectoryHandle(dirHandle, subPath)
    : dirHandle;

  for await (const [name, handle] of current.entries()) {
    const fullPath = subPath ? `${subPath}/${name}` : name;
    if (handle.kind === 'directory') {
      const nested = await readAllFilesInDirectory(dirHandle, fullPath);
      nested.forEach((content, path) => result.set(path, content));
    } else {
      const file = await handle.getFile();
      result.set(fullPath, await file.text());
    }
  }

  return result;
}

async function getSubDirectoryHandle(
  root: FileSystemDirectoryHandle,
  path: string
): Promise<FileSystemDirectoryHandle> {
  const parts = path.split('/');
  let current = root;
  for (const part of parts) {
    current = await current.getDirectoryHandle(part);
  }
  return current;
}
