import { useState, useEffect } from "react";
import {
  Lock,
  Unlock,
  Plus,
  Trash2,
  Copy,
  Check,
  Loader2,
  RefreshCw,
  X,
  Key,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ADMIN_CODE } from "../data";
import { getAllCodes, createCode, deleteCode, type RedeemCode } from "../firebase";
import { loadTools, loadGames, type ToolInfo, type GameInfo } from "../backblaze";

type FileOption = { id: string; name: string; path: string };

type AdminPanelProps = {
  tools?: ToolInfo[];
  games?: GameInfo[];
};

export default function AdminPanel({ tools = [], games = [] }: AdminPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [adminInput, setAdminInput] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [codes, setCodes] = useState<Record<string, RedeemCode>>({});
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedFile, setSelectedFile] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [newlyCreated, setNewlyCreated] = useState<string | null>(null);
  const [fileOptions, setFileOptions] = useState<FileOption[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  const buildFileOptions = (toolList: ToolInfo[], gameList: GameInfo[]): FileOption[] => {
    return [
      ...toolList.map((t: ToolInfo) => ({
        id: `tool-${t.id}`,
        name: `[Tool] ${t.name}`,
        path: t.exeFile || t.folder,
      })),
      ...gameList.map((g: GameInfo) => ({
        id: `game-${g.id}`,
        name: `[Spiel] ${g.name}`,
        path: g.fileName,
      })),
    ];
  };

  // Codes und Dateien laden wenn Admin
  useEffect(() => {
    if (isAdmin) {
      loadCodes();
      if (tools.length > 0 || games.length > 0) {
        const options = buildFileOptions(tools, games);
        setFileOptions(options);
        if (options.length > 0 && !selectedFile) {
          setSelectedFile(options[0].path);
        }
      } else {
        loadFileOptions();
      }
    }
  }, [isAdmin, tools, games, selectedFile]);

  const loadFileOptions = async () => {
    setLoadingFiles(true);
    try {
      const [fetchedTools, fetchedGames] = await Promise.all([loadTools(), loadGames()]);
      const options = buildFileOptions(fetchedTools, fetchedGames);
      
      setFileOptions(options);
      if (options.length > 0 && !selectedFile) {
        setSelectedFile(options[0].path);
      }
    } catch (err) {
      console.error("Fehler beim Laden der Dateien:", err);
    }
    setLoadingFiles(false);
  };

  const loadCodes = async () => {
    setLoading(true);
    try {
      const data = await getAllCodes();
      setCodes(data);
    } catch (err) {
      console.error("Fehler beim Laden der Codes:", err);
    }
    setLoading(false);
  };

  const handleAdminLogin = () => {
    if (adminInput === ADMIN_CODE) {
      setIsAdmin(true);
      setAdminInput("");
    }
  };

  const handleAdminSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleAdminLogin();
  };

  const handleGenerateCode = async () => {
    if (!selectedFile) return;
    setGenerating(true);
    try {
      const newCode = await createCode(selectedFile);
      setNewlyCreated(newCode);
      await loadCodes();
    } catch (err) {
      console.error("Fehler beim Erstellen:", err);
    }
    setGenerating(false);
  };

  const handleDeleteCode = async (codeId: string) => {
    if (!confirm("Code wirklich löschen?")) return;
    try {
      await deleteCode(codeId);
      await loadCodes();
    } catch (err) {
      console.error("Fehler beim Löschen:", err);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getFileName = (fileKey: string) => {
    const option = fileOptions.find((f) => f.path === fileKey);
    if (option) return option.name;
    // Fallback: letzten Teil des Pfads nehmen
    return fileKey.split("/").pop() || fileKey;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="border-t border-neutral-200 mt-8">
      {/* Toggle Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-center justify-between text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          {isAdmin ? (
            <Unlock size={14} className="text-emerald-500" />
          ) : (
            <Lock size={14} />
          )}
          <span className="text-xs font-mono uppercase tracking-wider">
            {isAdmin ? "Admin-Bereich" : "Admin"}
          </span>
        </div>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {/* Content */}
      {isOpen && (
        <div className="pb-6">
          {!isAdmin ? (
            /* Login */
            <div className="max-w-xs">
              <p className="text-xs text-neutral-400 mb-3">
                Admin-Code eingeben:
              </p>
              <form onSubmit={handleAdminSubmit} className="flex gap-2">
                <input
                  type="password"
                  value={adminInput}
                  onChange={(e) => setAdminInput(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 bg-white border border-neutral-200 text-neutral-900
                    px-3 py-2 text-sm font-mono placeholder:text-neutral-300
                    focus:outline-none focus:border-neutral-400 transition-colors rounded-md"
                />
                <button
                  type="submit"
                  className="bg-neutral-900 text-white px-4 py-2 text-sm font-sans
                    font-medium hover:bg-neutral-800 transition-colors cursor-pointer rounded-md"
                >
                  Login
                </button>
              </form>
            </div>
          ) : (
            /* Admin Dashboard */
            <div className="space-y-6">
              {/* Logout */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-emerald-600 font-mono flex items-center gap-1.5">
                  <Check size={12} /> Eingeloggt als Admin
                </span>
                <button
                  onClick={() => setIsAdmin(false)}
                  className="text-xs text-neutral-400 hover:text-neutral-600 flex items-center gap-1 cursor-pointer"
                >
                  <X size={12} /> Logout
                </button>
              </div>

              {/* Code erstellen */}
              <div className="bg-white border border-neutral-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                  <Plus size={14} /> Neuen Code erstellen
                </h3>
                
                {loadingFiles ? (
                  <div className="flex items-center gap-2 text-neutral-400 text-sm py-2">
                    <Loader2 size={14} className="animate-spin" />
                    Lade Dateien von Backblaze...
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={selectedFile}
                      onChange={(e) => setSelectedFile(e.target.value)}
                      className="flex-1 bg-white border border-neutral-200 text-neutral-900
                        px-3 py-2.5 text-sm focus:outline-none focus:border-neutral-400 
                        transition-colors rounded-md cursor-pointer"
                    >
                      {fileOptions.length === 0 ? (
                        <option value="">Keine Dateien gefunden</option>
                      ) : (
                        fileOptions.map((option) => (
                          <option key={option.id} value={option.path}>
                            {option.name}
                          </option>
                        ))
                      )}
                    </select>
                    <button
                      onClick={handleGenerateCode}
                      disabled={generating || !selectedFile}
                      className="bg-neutral-900 text-white px-5 py-2.5 text-sm font-sans
                        font-semibold hover:bg-neutral-800 transition-colors
                        disabled:opacity-50 cursor-pointer shrink-0 rounded-md flex items-center gap-2"
                    >
                      {generating ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Key size={14} />
                      )}
                      Generieren
                    </button>
                  </div>
                )}

                {/* Neu erstellter Code */}
                {newlyCreated && (
                  <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-md flex items-center justify-between">
                    <div>
                      <span className="text-xs text-emerald-600 block mb-1">
                        Neuer Code erstellt:
                      </span>
                      <span className="font-mono text-sm font-semibold text-emerald-800">
                        {newlyCreated}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopy(newlyCreated)}
                      className="text-emerald-600 hover:text-emerald-800 cursor-pointer p-2"
                    >
                      {copiedCode === newlyCreated ? (
                        <Check size={16} />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Alle Codes */}
              <div className="bg-white border border-neutral-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-neutral-800 flex items-center gap-2">
                    <Key size={14} /> Alle Codes
                    <span className="text-neutral-400 font-normal">
                      ({Object.keys(codes).length})
                    </span>
                  </h3>
                  <button
                    onClick={loadCodes}
                    disabled={loading}
                    className="text-neutral-400 hover:text-neutral-600 cursor-pointer p-1"
                  >
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-8 text-neutral-400">
                    <Loader2 size={20} className="animate-spin mx-auto mb-2" />
                    <span className="text-xs">Lade Codes...</span>
                  </div>
                ) : Object.keys(codes).length === 0 ? (
                  <p className="text-sm text-neutral-400 text-center py-6">
                    Keine Codes vorhanden.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {Object.entries(codes).map(([id, data]) => (
                      <div
                        key={id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-neutral-50 rounded-md gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-sm font-medium text-neutral-800">
                              {data.code}
                            </span>
                            <span className="text-xs text-neutral-400 px-1.5 py-0.5 bg-neutral-200 rounded truncate max-w-[200px]">
                              {getFileName(data.fileKey)}
                            </span>
                          </div>
                          <span className="text-[11px] text-neutral-400 font-mono mt-1 block">
                            {formatDate(data.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleCopy(data.code)}
                            className="text-neutral-400 hover:text-neutral-600 cursor-pointer p-2 rounded hover:bg-neutral-100"
                            title="Kopieren"
                          >
                            {copiedCode === data.code ? (
                              <Check size={14} className="text-emerald-500" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteCode(id)}
                            className="text-neutral-400 hover:text-red-500 cursor-pointer p-2 rounded hover:bg-red-50"
                            title="Löschen"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
