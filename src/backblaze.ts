// Browser ruft nur den eigenen Proxy/Backend-Endpunkt auf.
// Direkte B2-Auth aus GitHub Pages scheitert an CORS.
const DEFAULT_API_BASE_URL = "https://sell-shop-api.ferdinandurbach4.workers.dev";
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, "");

// Parsed info from info.md
export interface ToolInfo {
  id: string;
  name: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  info: string;
  info2: string;
  price: string;
  folder: string;
  exeFile: string | null;
  size: string;
}

// Parsed info from game zip filename
export interface GameInfo {
  id: string;
  name: string;
  price: string;
  fileName: string;
  size: string;
}
type DownloadUrlResponse = {
  url: string;
};

function ensureApiBase(): string {
  if (!API_BASE_URL) {
    throw new Error("VITE_API_BASE_URL ist nicht gesetzt.");
  }
  return API_BASE_URL;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`API-Fehler (${response.status}) für ${url}`);
  }

  return (await response.json()) as T;
}

// Erwartete Proxy-Endpunkte:
// GET {VITE_API_BASE_URL}/tools
// GET {VITE_API_BASE_URL}/games
// GET {VITE_API_BASE_URL}/download-url?fileName=...
export async function loadTools(): Promise<ToolInfo[]> {
  const apiBase = ensureApiBase();
  const tools = await fetchJson<ToolInfo[]>(`${apiBase}/tools`);
  return Array.isArray(tools) ? tools : [];
}

export async function loadGames(): Promise<GameInfo[]> {
  const apiBase = ensureApiBase();
  const games = await fetchJson<GameInfo[]>(`${apiBase}/games`);
  return Array.isArray(games) ? games : [];
}

export async function getDownloadUrl(fileName: string): Promise<string> {
  const apiBase = ensureApiBase();
  const params = new URLSearchParams({ fileName });
  const data = await fetchJson<DownloadUrlResponse>(`${apiBase}/download-url?${params.toString()}`);
  if (!data?.url) {
    throw new Error("Download-URL wurde nicht vom Backend geliefert.");
  }
  return data.url;
}

// Download a tool (returns the exe download URL)
export async function downloadTool(tool: ToolInfo): Promise<string | null> {
  if (!tool.exeFile) return null;
  return await getDownloadUrl(tool.exeFile);
}

// Download a game
export async function downloadGame(game: GameInfo): Promise<string> {
  return await getDownloadUrl(game.fileName);
}
