const TOKEN_TTL_SECONDS = 24 * 60 * 60;

let authCache = {
  token: "",
  apiUrl: "",
  downloadUrl: "",
  accountId: "",
  bucketId: "",
  bucketName: "",
  expiresAt: 0,
};

function json(data, status = 200, origin = "*") {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "GET,OPTIONS",
      "access-control-allow-headers": "content-type",
    },
  });
}

function corsOrigin(request, env) {
  const requestOrigin = request.headers.get("origin") || "";
  if (!env.ALLOWED_ORIGIN || env.ALLOWED_ORIGIN === "*") {
    return "*";
  }
  if (requestOrigin === env.ALLOWED_ORIGIN) {
    return requestOrigin;
  }
  return env.ALLOWED_ORIGIN;
}

async function authorizeB2(env) {
  if (Date.now() < authCache.expiresAt && authCache.token) {
    return authCache;
  }

  const creds = btoa(`${env.B2_KEY_ID}:${env.B2_APP_KEY}`);
  const resp = await fetch("https://api.backblazeb2.com/b2api/v2/b2_authorize_account", {
    method: "GET",
    headers: {
      Authorization: `Basic ${creds}`,
    },
  });

  if (!resp.ok) {
    throw new Error(`B2 authorize failed (${resp.status})`);
  }

  const data = await resp.json();
  let bucketId = env.B2_BUCKET_ID || data.allowed.bucketId || "";
  let bucketName = env.B2_BUCKET_NAME || data.allowed.bucketName || "";

  if (!bucketId || !bucketName) {
    const bucketInfo = await resolveBucket(env, {
      authorizationToken: data.authorizationToken,
      apiUrl: data.apiUrl,
      accountId: data.accountId,
      preferredBucketName: env.B2_BUCKET_NAME || "",
    });
    bucketId = bucketInfo.bucketId;
    bucketName = bucketInfo.bucketName;
  }

  authCache = {
    token: data.authorizationToken,
    apiUrl: data.apiUrl,
    downloadUrl: data.downloadUrl,
    accountId: data.accountId,
    bucketId,
    bucketName,
    expiresAt: Date.now() + TOKEN_TTL_SECONDS * 1000,
  };

  return authCache;
}

async function resolveBucket(env, auth) {
  const body = {
    accountId: auth.accountId,
  };

  if (auth.preferredBucketName) {
    body.bucketName = auth.preferredBucketName;
  }

  const resp = await fetch(`${auth.apiUrl}/b2api/v2/b2_list_buckets`, {
    method: "POST",
    headers: {
      Authorization: auth.authorizationToken,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    throw new Error(`B2 list buckets failed (${resp.status})`);
  }

  const data = await resp.json();
  const buckets = data.buckets || [];
  if (!buckets.length) {
    throw new Error("No Backblaze buckets available for this key.");
  }

  const bucket = buckets[0];
  return {
    bucketId: bucket.bucketId,
    bucketName: bucket.bucketName,
  };
}

async function listFilesByPrefix(env, prefix) {
  const auth = await authorizeB2(env);
  const allFiles = [];
  let startFileName = null;

  do {
    const params = new URLSearchParams({
      bucketId: auth.bucketId,
      prefix,
      maxFileCount: "1000",
    });

    if (startFileName) {
      params.set("startFileName", startFileName);
    }

    const resp = await fetch(`${auth.apiUrl}/b2api/v2/b2_list_file_names?${params.toString()}`, {
      headers: {
        Authorization: auth.token,
      },
    });

    if (!resp.ok) {
      throw new Error(`B2 list failed (${resp.status})`);
    }

    const data = await resp.json();
    allFiles.push(...(data.files || []));
    startFileName = data.nextFileName;
  } while (startFileName);

  return allFiles;
}

async function downloadText(env, fileName) {
  const auth = await authorizeB2(env);
  const url = `${auth.downloadUrl}/file/${auth.bucketName}/${encodeURIComponent(fileName).replace(/%2F/g, "/")}`;
  const resp = await fetch(url, {
    headers: {
      Authorization: auth.token,
    },
  });

  if (!resp.ok) {
    throw new Error(`B2 download failed (${resp.status})`);
  }

  return await resp.text();
}

function parseInfoMd(content) {
  const lines = content.split("\n");
  const data = {};

  for (const line of lines) {
    const idx = line.indexOf(":");
    if (idx > 0) {
      const key = line.slice(0, idx).trim().toLowerCase();
      const value = line.slice(idx + 1).trim();
      data[key] = value;
    }
  }

  const difficulty = Math.min(5, Math.max(1, Number.parseInt(data.schwierigkeit || "3", 10) || 3));
  return {
    name: data.name || "Unbekannt",
    difficulty,
    info: data.info || "",
    info2: data.info2 || "",
    price: data.preis ? `${data.preis} €` : "0 €",
  };
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isPreferredDownloadFile(fileName) {
  return /\.(exe|bat|cmd|ps1|msi|com|scr|jar|zip|7z|rar)$/i.test(fileName);
}

async function getTools(env) {
  const files = await listFilesByPrefix(env, "v/");
  const folders = new Map();

  for (const file of files) {
    const parts = file.fileName.split("/");
    if (parts.length >= 3) {
      const folderPath = `${parts[0]}/${parts[1]}`;
      if (!folders.has(folderPath)) folders.set(folderPath, []);
      folders.get(folderPath).push(file);
    }
  }

  const tools = [];
  for (const [folderPath, folderFiles] of folders.entries()) {
    const infoFile = folderFiles.find((f) => f.fileName.endsWith("info.md"));
    const preferredFile = folderFiles.find((f) => isPreferredDownloadFile(f.fileName));

    if (!infoFile) continue;

    try {
      const md = await downloadText(env, infoFile.fileName);
      const parsed = parseInfoMd(md);
      const totalSize = folderFiles.reduce((sum, f) => sum + (f.contentLength || 0), 0);

      tools.push({
        id: folderPath.replace(/[^a-zA-Z0-9]/g, "_"),
        name: parsed.name,
        difficulty: parsed.difficulty,
        info: parsed.info,
        info2: parsed.info2,
        price: parsed.price,
        folder: folderPath,
        exeFile: preferredFile ? preferredFile.fileName : null,
        size: formatSize(totalSize),
      });
    } catch (err) {
      console.error("Tool parse failed", folderPath, err);
    }
  }

  return tools;
}

async function getGames(env) {
  const files = await listFilesByPrefix(env, "g/");
  const games = [];

  for (const file of files) {
    if (!/^g\/[^/]+\.zip$/i.test(file.fileName)) {
      continue;
    }

    const shortName = file.fileName.replace(/^g\//, "");
    const match = shortName.match(/^(.+)-(\d+(?:[.,]\d+)?)\.zip$/i);

    if (match) {
      games.push({
        id: file.fileId,
        name: match[1].replace(/[-_]/g, " "),
        price: `${match[2].replace(",", ".")} €`,
        fileName: file.fileName,
        size: formatSize(file.contentLength || 0),
      });
    } else {
      games.push({
        id: file.fileId,
        name: shortName.replace(/\.zip$/i, ""),
        price: "? €",
        fileName: file.fileName,
        size: formatSize(file.contentLength || 0),
      });
    }
  }

  return games;
}

async function resolveDownloadTarget(env, fileKey) {
  // If file key already looks like a concrete file, keep it.
  if (/\.[^/]+$/i.test(fileKey)) {
    return fileKey;
  }

  const prefix = fileKey.endsWith("/") ? fileKey : `${fileKey}/`;
  const files = await listFilesByPrefix(env, prefix);
  if (!files.length) {
    throw new Error(`No files found for prefix: ${prefix}`);
  }

  const cleanFiles = files.filter((f) => {
    const lower = f.fileName.toLowerCase();
    // Exclude folder markers and metadata files that are not meaningful downloads.
    return !lower.endsWith(".bzempty") && !lower.endsWith("info.md");
  });

  if (!cleanFiles.length) {
    throw new Error(`No downloadable files found for prefix: ${prefix}`);
  }

  const preferred = cleanFiles.find((f) => isPreferredDownloadFile(f.fileName));
  return preferred ? preferred.fileName : cleanFiles[0].fileName;
}

async function getDownloadUrl(env, fileName) {
  const resolvedFileName = await resolveDownloadTarget(env, fileName);
  const auth = await authorizeB2(env);

  const tokenResp = await fetch(`${auth.apiUrl}/b2api/v2/b2_get_download_authorization`, {
    method: "POST",
    headers: {
      Authorization: auth.token,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      bucketId: auth.bucketId,
      fileNamePrefix: resolvedFileName,
      validDurationInSeconds: 60,
    }),
  });

  if (!tokenResp.ok) {
    throw new Error(`B2 get_download_authorization failed (${tokenResp.status})`);
  }

  const tokenData = await tokenResp.json();
  const encodedName = encodeURIComponent(resolvedFileName).replace(/%2F/g, "/");
  return `${auth.downloadUrl}/file/${auth.bucketName}/${encodedName}?Authorization=${encodeURIComponent(tokenData.authorizationToken)}`;
}

export default {
  async fetch(request, env) {
    const origin = corsOrigin(request, env);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": origin,
          "access-control-allow-methods": "GET,OPTIONS",
          "access-control-allow-headers": "content-type",
        },
      });
    }

    if (request.method !== "GET") {
      return json({ error: "Method not allowed" }, 405, origin);
    }

    try {
      const url = new URL(request.url);

      if (url.pathname === "/tools") {
        const tools = await getTools(env);
        return json(tools, 200, origin);
      }

      if (url.pathname === "/games") {
        const games = await getGames(env);
        return json(games, 200, origin);
      }

      if (url.pathname === "/download-url") {
        const fileName = url.searchParams.get("fileName") || "";
        if (!fileName) {
          return json({ error: "Missing fileName" }, 400, origin);
        }
        const dlUrl = await getDownloadUrl(env, fileName);
        return json({ url: dlUrl }, 200, origin);
      }

      return json({ error: "Not found" }, 404, origin);
    } catch (err) {
      console.error(err);
      return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500, origin);
    }
  },
};
