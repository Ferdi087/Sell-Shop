// ╔══════════════════════════════════════════════════════════════╗
// ║  BACKBLAZE B2 INTEGRATION                                   ║
// ║  ACHTUNG: Keys im Frontend sind NICHT sicher für Produktion!║
// ╚══════════════════════════════════════════════════════════════╝

const B2_KEY_ID = "028379c97795";
const B2_APP_KEY = "003c3f74b4d791587b2f8d9239271bcd44c3f03426";

interface B2AuthResponse {
  authorizationToken: string;
  apiUrl: string;
  downloadUrl: string;
  allowed: {
    bucketId: string;
    bucketName: string;
  };
}

interface B2File {
  fileId: string;
  fileName: string;
  contentLength: number;
  contentType: string;
}

interface B2ListFilesResponse {
  files: B2File[];
  nextFileName: string | null;
}

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

let authData: B2AuthResponse | null = null;

// Authorize with B2
export async function authorizeB2(): Promise<B2AuthResponse> {
  if (authData) return authData;

  const credentials = btoa(`${B2_KEY_ID}:${B2_APP_KEY}`);
  
  const response = await fetch("https://api.backblazeb2.com/b2api/v2/b2_authorize_account", {
    method: "GET",
    headers: {
      Authorization: `Basic ${credentials}`,
    },
  });

  if (!response.ok) {
    throw new Error(`B2 Auth failed: ${response.status}`);
  }

  authData = await response.json();
  return authData!;
}

// List files in a folder
async function listFiles(prefix: string): Promise<B2File[]> {
  const auth = await authorizeB2();
  const allFiles: B2File[] = [];
  let startFileName: string | null = null;

  do {
    const params = new URLSearchParams({
      bucketId: auth.allowed.bucketId,
      prefix: prefix,
      maxFileCount: "1000",
    });
    
    if (startFileName) {
      params.set("startFileName", startFileName);
    }

    const response = await fetch(`${auth.apiUrl}/b2api/v2/b2_list_file_names?${params}`, {
      headers: {
        Authorization: auth.authorizationToken,
      },
    });

    if (!response.ok) {
      throw new Error(`B2 List failed: ${response.status}`);
    }

    const data: B2ListFilesResponse = await response.json();
    allFiles.push(...data.files);
    startFileName = data.nextFileName;
  } while (startFileName);

  return allFiles;
}

// Download file content as text
async function downloadFileAsText(fileName: string): Promise<string> {
  const auth = await authorizeB2();
  
  const response = await fetch(
    `${auth.downloadUrl}/file/${auth.allowed.bucketName}/${fileName}`,
    {
      headers: {
        Authorization: auth.authorizationToken,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`B2 Download failed: ${response.status}`);
  }

  return await response.text();
}

// Get download URL for a file
export async function getDownloadUrl(fileName: string): Promise<string> {
  const auth = await authorizeB2();
  return `${auth.downloadUrl}/file/${auth.allowed.bucketName}/${fileName}?Authorization=${auth.authorizationToken}`;
}

// Parse info.md content
function parseInfoMd(content: string): Partial<ToolInfo> {
  const lines = content.split("\n");
  const data: Record<string, string> = {};

  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim().toLowerCase();
      const value = line.substring(colonIndex + 1).trim();
      data[key] = value;
    }
  }

  return {
    name: data.name || "Unbekannt",
    difficulty: Math.min(5, Math.max(1, parseInt(data.schwierigkeit) || 3)) as 1 | 2 | 3 | 4 | 5,
    info: data.info || "",
    info2: data.info2 || "",
    price: data.preis ? `${data.preis} €` : "0 €",
  };
}

// Format file size
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Load all tools from v/ folder
export async function loadTools(): Promise<ToolInfo[]> {
  const files = await listFiles("v/");
  const tools: ToolInfo[] = [];
  
  // Group files by folder
  const folders = new Map<string, B2File[]>();
  
  for (const file of files) {
    // Extract folder path: v/foldername/...
    const parts = file.fileName.split("/");
    if (parts.length >= 3) {
      const folderPath = `${parts[0]}/${parts[1]}`;
      if (!folders.has(folderPath)) {
        folders.set(folderPath, []);
      }
      folders.get(folderPath)!.push(file);
    }
  }

  // Process each folder
  for (const [folderPath, folderFiles] of folders) {
    const infoFile = folderFiles.find(f => f.fileName.endsWith("info.md"));
    const exeFile = folderFiles.find(f => f.fileName.endsWith(".exe"));
    
    if (infoFile) {
      try {
        const infoContent = await downloadFileAsText(infoFile.fileName);
        const parsed = parseInfoMd(infoContent);
        
        // Calculate total folder size
        const totalSize = folderFiles.reduce((sum, f) => sum + f.contentLength, 0);
        
        tools.push({
          id: folderPath.replace(/[^a-zA-Z0-9]/g, "_"),
          name: parsed.name || "Unbekannt",
          difficulty: parsed.difficulty || 3,
          info: parsed.info || "",
          info2: parsed.info2 || "",
          price: parsed.price || "0 €",
          folder: folderPath,
          exeFile: exeFile?.fileName || null,
          size: formatSize(totalSize),
        });
      } catch (err) {
        console.error(`Error parsing ${folderPath}:`, err);
      }
    }
  }

  return tools;
}

// Load all games from g/ folder
export async function loadGames(): Promise<GameInfo[]> {
  const files = await listFiles("g/");
  const games: GameInfo[] = [];

  for (const file of files) {
    // Only process .zip files directly in g/
    if (file.fileName.match(/^g\/[^/]+\.zip$/)) {
      const fileName = file.fileName.replace("g/", "");
      // Parse: name-preis.zip
      const match = fileName.match(/^(.+)-(\d+(?:[.,]\d+)?)\.zip$/i);
      
      if (match) {
        const name = match[1].replace(/-/g, " ").replace(/_/g, " ");
        const price = match[2].replace(",", ".");
        
        games.push({
          id: file.fileId,
          name: name,
          price: `${price} €`,
          fileName: file.fileName,
          size: formatSize(file.contentLength),
        });
      } else {
        // Fallback if name doesn't match pattern
        games.push({
          id: file.fileId,
          name: fileName.replace(".zip", ""),
          price: "? €",
          fileName: file.fileName,
          size: formatSize(file.contentLength),
        });
      }
    }
  }

  return games;
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
