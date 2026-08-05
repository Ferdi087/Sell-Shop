import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, remove, child } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCveA190eo3SEiGQJOIEuPCzdH6jsj4bEg",
  authDomain: "website-ca306.firebaseapp.com",
  databaseURL: "https://website-ca306-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "website-ca306",
  storageBucket: "website-ca306.firebasestorage.app",
  messagingSenderId: "532445171900",
  appId: "1:532445171900:web:f42732fc1d0fe0a42940b9",
  measurementId: "G-3V69H2E7KM"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);

// ─── Code-Struktur in Firebase ───────────────────────────────────
// /codes/{codeId} = { code: "ABC-123", fileKey: "1.exe", createdAt: timestamp }

export interface RedeemCode {
  code: string;
  fileKey: string;
  createdAt: number;
}

// Alle Codes laden
export async function getAllCodes(): Promise<Record<string, RedeemCode>> {
  const dbRef = ref(database);
  const snapshot = await get(child(dbRef, "codes"));
  if (snapshot.exists()) {
    return snapshot.val();
  }
  return {};
}

// Code prüfen und Datei-Key zurückgeben
export async function checkCode(inputCode: string): Promise<string | null> {
  const codes = await getAllCodes();
  const upperInput = inputCode.trim().toUpperCase();
  
  for (const [_id, data] of Object.entries(codes)) {
    if (data.code.toUpperCase() === upperInput) {
      // Einmal-Code: nach erfolgreicher Einlösung sofort löschen.
      await remove(ref(database, `codes/${_id}`));
      return data.fileKey;
    }
  }
  return null;
}

// Neuen Code erstellen
export async function createCode(fileKey: string): Promise<string> {
  const codeStr = generateCodeString();
  const codeId = `code_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  await set(ref(database, `codes/${codeId}`), {
    code: codeStr,
    fileKey: fileKey,
    createdAt: Date.now(),
  });
  
  return codeStr;
}

// Code löschen
export async function deleteCode(codeId: string): Promise<void> {
  await remove(ref(database, `codes/${codeId}`));
}

// Zufälligen Code generieren
function generateCodeString(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // keine I/O/0/1 (verwechselbar)
  const part = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${part()}-${part()}-${part()}`;
}
