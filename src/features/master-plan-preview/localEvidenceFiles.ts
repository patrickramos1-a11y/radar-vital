const DATABASE_NAME = "radar-vital-capability-journey-local";
const STORE_NAME = "evidence-files";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) return reject(new Error("Este navegador não permite guardar anexos locais."));
    const request = window.indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Falha ao abrir anexos locais."));
  });
}

export async function saveLocalEvidenceFile(id: string, file: File): Promise<void> {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put(file, id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Falha ao guardar anexo."));
    });
  } finally {
    database.close();
  }
}

export async function readLocalEvidenceFile(id: string): Promise<File | undefined> {
  const database = await openDatabase();
  try {
    return await new Promise<File | undefined>((resolve, reject) => {
      const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(id);
      request.onsuccess = () => resolve(request.result as File | undefined);
      request.onerror = () => reject(request.error ?? new Error("Falha ao ler anexo."));
    });
  } finally {
    database.close();
  }
}

export async function removeLocalEvidenceFile(id: string): Promise<void> {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Falha ao excluir anexo."));
    });
  } finally {
    database.close();
  }
}
