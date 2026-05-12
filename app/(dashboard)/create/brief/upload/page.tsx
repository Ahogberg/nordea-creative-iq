"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  Loader2,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";

const TEXT_EXTENSIONS = [".txt", ".md"];

export default function BriefUploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setError(null);
    setFile(f);
  };

  const readFileAsText = (f: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(reader.error ?? new Error("File read failed"));
      reader.readAsText(f);
    });

  const handleParse = async () => {
    setError(null);
    if (!file && !pastedText.trim()) {
      setError("Ladda upp en fil eller klistra in text");
      return;
    }

    setIsParsing(true);
    try {
      let text = pastedText.trim();

      if (file) {
        const name = file.name.toLowerCase();
        const isTextLike = TEXT_EXTENSIONS.some((ext) => name.endsWith(ext));
        if (!isTextLike) {
          // PDF/DOCX parsing is stubbed for Sprint 10 (per spec: "PDF-parsing
          // kan stub:as om det blir krångligt"). Users with binary briefs can
          // copy the text into the textarea instead.
          throw new Error(
            "PDF/DOCX-parsing stöds inte än — klistra in briefen som text nedan istället"
          );
        }
        text = await readFileAsText(file);
      }

      if (!text.trim()) {
        throw new Error("Briefen är tom");
      }

      const res = await fetch("/api/brief/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || "Kunde inte tolka briefen");
      }

      const data = await res.json();
      if (data.brief?.id) {
        router.push(`/create/brief/${data.brief.id}/review`);
      } else {
        throw new Error("Inget brief-id returnerades");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Okänt fel");
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="min-h-screen bg-nordea-bg">
      <div className="h-14 bg-white border-b border-nordea-border flex items-center px-6">
        <button
          type="button"
          onClick={() => router.push("/create/brief")}
          className="flex items-center gap-2 text-sm text-nordea-text-tertiary hover:text-nordea-text"
        >
          <ArrowLeft className="w-4 h-4" />
          Tillbaka
        </button>
      </div>

      <div className="max-w-2xl mx-auto py-12 px-6">
        <h1 className="text-3xl font-semibold text-nordea-text mb-2 tracking-tight">
          Ladda upp brief
        </h1>
        <p className="text-base text-nordea-text-secondary mb-8">
          AI:n extraherar strategin och du kan justera innan kampanjen
          genereras
        </p>

        <div className="bg-white border-2 border-dashed border-nordea-border rounded-2xl p-8 text-center mb-6 hover:border-nordea-blue/40 transition-colors">
          <input
            type="file"
            accept=".pdf,.txt,.md,.docx"
            onChange={handleFileChange}
            className="hidden"
            id="brief-upload"
            disabled={isParsing}
          />
          <label
            htmlFor="brief-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            {file ? (
              <>
                <FileText className="w-10 h-10 text-nordea-teal mb-3" />
                <p className="text-base font-medium text-nordea-text mb-1">
                  {file.name}
                </p>
                <p className="text-xs text-nordea-text-tertiary">
                  {(file.size / 1024).toFixed(1)} KB · Klicka för att byta
                </p>
              </>
            ) : (
              <>
                <Upload className="w-10 h-10 text-nordea-text-tertiary mb-3" />
                <p className="text-base font-medium text-nordea-text mb-1">
                  Klicka för att ladda upp
                </p>
                <p className="text-xs text-nordea-text-tertiary">
                  TXT eller MD · PDF/DOCX kommer i nästa sprint
                </p>
              </>
            )}
          </label>
        </div>

        <div className="text-center text-sm text-nordea-text-tertiary mb-4">
          — eller —
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-nordea-text mb-2">
            Klistra in brief som text
          </label>
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Klistra in hela briefen här…"
            rows={10}
            disabled={isParsing}
            className="w-full px-4 py-3 bg-white border border-nordea-border rounded-xl text-sm text-nordea-text placeholder:text-nordea-text-tertiary focus:outline-none focus:border-nordea-blue/40 focus:ring-2 focus:ring-nordea-blue/10 resize-none"
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-nordea-rose/10 border border-nordea-rose/20 rounded-md flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-nordea-rose flex-shrink-0 mt-0.5" />
            <p className="text-sm text-nordea-rose">{error}</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleParse}
          disabled={(!file && !pastedText.trim()) || isParsing}
          className="nordea-btn nordea-btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isParsing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Tolkar briefen…
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Tolka brief
            </>
          )}
        </button>
      </div>
    </div>
  );
}
