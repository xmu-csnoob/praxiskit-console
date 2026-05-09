const DB_NAME = 'praxiskit-console';
const DB_VERSION = 3;
const HANDLE_STORE = 'directoryHandle';
const CACHE_STORE = 'parseCache';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(HANDLE_STORE)) {
        db.createObjectStore(HANDLE_STORE);
      }
      if (!db.objectStoreNames.contains(CACHE_STORE)) {
        db.createObjectStore(CACHE_STORE);
      }
    };
  });
  return dbPromise;
}

export async function saveDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(HANDLE_STORE, 'readwrite');
  const store = tx.objectStore(HANDLE_STORE);
  await promisify(store.put(handle, 'last'));
}

export async function getDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(HANDLE_STORE, 'readonly');
    const store = tx.objectStore(HANDLE_STORE);
    const handle = await promisify(store.get('last'));
    return handle ?? null;
  } catch {
    return null;
  }
}

export async function clearDirectoryHandle(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(HANDLE_STORE, 'readwrite');
  const store = tx.objectStore(HANDLE_STORE);
  await promisify(store.delete('last'));
}

interface ParseCacheEntry {
  fingerprint: string;
  parseResult: unknown;
  waves: unknown;
  currentWaveIndex: number;
  timestamp: number;
}

export async function saveParseCache(
  fingerprint: string,
  parseResult: unknown,
  waves: unknown,
  currentWaveIndex: number
): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(CACHE_STORE, 'readwrite');
  const store = tx.objectStore(CACHE_STORE);
  const entry: ParseCacheEntry = {
    fingerprint,
    parseResult,
    waves,
    currentWaveIndex,
    timestamp: Date.now(),
  };
  await promisify(store.put(entry, fingerprint));
}

export async function getParseCache(fingerprint: string): Promise<{
  parseResult: unknown;
  waves: unknown;
  currentWaveIndex: number;
} | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(CACHE_STORE, 'readonly');
    const store = tx.objectStore(CACHE_STORE);
    const entry: ParseCacheEntry | undefined = await promisify(store.get(fingerprint));
    if (!entry) return null;
    return {
      parseResult: entry.parseResult,
      waves: entry.waves,
      currentWaveIndex: entry.currentWaveIndex,
    };
  } catch {
    return null;
  }
}

export async function clearParseCache(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(CACHE_STORE, 'readwrite');
  const store = tx.objectStore(CACHE_STORE);
  await promisify(store.clear());
}

function promisify<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
