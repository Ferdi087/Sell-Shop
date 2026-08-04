import { useState } from "react";
import { Terminal, Check, AlertTriangle, Loader2 } from "lucide-react";
import { checkCode } from "../firebase";
import { getDownloadUrl } from "../backblaze";

type Status = "idle" | "loading" | "success" | "error";

export default function RedeemSection() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const handleRedeem = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setStatus("error");
      setMessage("Kein Code eingegeben.");
      return;
    }

    setStatus("loading");
    setMessage("Überprüfe Code...");

    try {
      // fileKey ist der Pfad in Backblaze (z.B. "v/toolname/tool.exe" oder "g/game-10.zip")
      const fileKey = await checkCode(trimmed);

      if (fileKey) {
        setStatus("success");
        setMessage("Code gültig. Download wird vorbereitet...");

        // Download-URL von Backblaze holen
        try {
          const downloadUrl = await getDownloadUrl(fileKey);
          
          setTimeout(() => {
            setMessage("Download startet...");
            // Download im gleichen Tab starten, damit kein leerer neuer Tab offen bleibt.
            window.location.href = downloadUrl;
          }, 1000);
        } catch (dlErr) {
          console.error("Download-Fehler:", dlErr);
          setMessage("Code gültig, aber Download fehlgeschlagen. Kontaktiere Support.");
        }
      } else {
        setStatus("error");
        setMessage("Code ungültig oder bereits eingelöst.");
      }
    } catch (err) {
      setStatus("error");
      setMessage("Fehler bei der Code-Überprüfung. Versuche es erneut.");
      console.error(err);
    }
  };

  return (
    <section className="max-w-xl">
      <div className="flex items-center gap-2 mb-3">
        <Terminal size={14} className="text-neutral-400" />
        <h2 className="text-sm font-mono uppercase tracking-wider text-neutral-500 font-medium">
          Code einlösen
        </h2>
      </div>

      <p className="text-[13px] text-neutral-400 mb-4 leading-relaxed">
        Freischaltcode eingeben — Download startet automatisch.
      </p>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            if (status !== "idle") setStatus("idle");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRedeem();
          }}
          placeholder="XXXX-XXXX-XXXX"
          className="flex-1 bg-white border border-neutral-200 text-neutral-900
            px-4 py-3 sm:py-2.5 text-sm font-mono placeholder:text-neutral-300
            focus:outline-none focus:border-neutral-400 transition-colors rounded-md"
        />
        <button
          onClick={handleRedeem}
          disabled={status === "loading"}
          className="bg-neutral-900 text-white px-6 py-3 sm:py-2.5 text-sm font-sans
            font-semibold hover:bg-neutral-800 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0 rounded-md"
        >
          {status === "loading" ? (
            <Loader2 size={16} className="animate-spin mx-auto" />
          ) : (
            "Einlösen"
          )}
        </button>
      </div>

      {/* Status-Nachricht */}
      {status !== "idle" && status !== "loading" && (
        <div
          className={`mt-3 flex items-start gap-2 text-xs font-mono p-3 border rounded-md ${
            status === "success"
              ? "border-emerald-200 text-emerald-700 bg-emerald-50"
              : "border-red-200 text-red-600 bg-red-50"
          }`}
        >
          {status === "success" ? (
            <Check size={13} className="mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle size={13} className="mt-0.5 shrink-0" />
          )}
          <span>{message}</span>
        </div>
      )}
    </section>
  );
}
