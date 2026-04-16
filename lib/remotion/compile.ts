// ── Server-side TSX → JS compilation for Canvas scenes ──
//
// The AI generates a React component named `Scene` as a TSX string. We compile
// it to plain JS with esbuild, strip imports, and run basic safety checks.
// The client then executes the compiled JS inside a scoped `new Function` call
// with a whitelisted set of globals (see CanvasScene.tsx).

import { transform } from "esbuild";

export interface CompileResult {
  ok: boolean;
  compiledJs?: string;
  error?: string;
}

// Patterns we refuse to compile. This is a basic hygiene filter — the real
// sandbox is the `new Function` call on the client which only exposes the
// whitelisted scope. But blocking these at compile time gives cleaner errors.
const FORBIDDEN_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bfetch\s*\(/, label: "fetch()" },
  { pattern: /\bXMLHttpRequest\b/, label: "XMLHttpRequest" },
  { pattern: /\beval\s*\(/, label: "eval()" },
  { pattern: /\bnew\s+Function\s*\(/, label: "new Function()" },
  { pattern: /\bimport\s*\(/, label: "dynamic import()" },
  { pattern: /\brequire\s*\(/, label: "require()" },
  { pattern: /\bprocess\./, label: "process" },
  { pattern: /\blocalStorage\b/, label: "localStorage" },
  { pattern: /\bsessionStorage\b/, label: "sessionStorage" },
  { pattern: /\bdocument\.cookie\b/, label: "document.cookie" },
  { pattern: /\bwindow\.(top|parent|opener)\b/, label: "window.top/parent/opener" },
  { pattern: /dangerouslySetInnerHTML/, label: "dangerouslySetInnerHTML" },
  { pattern: /\bglobalThis\b/, label: "globalThis" },
];

export async function compileCanvasTsx(tsxCode: string): Promise<CompileResult> {
  // 1. Static safety check
  for (const { pattern, label } of FORBIDDEN_PATTERNS) {
    if (pattern.test(tsxCode)) {
      return { ok: false, error: `Förbjudet API i koden: ${label}` };
    }
  }

  // 2. Strip all import/export statements — the AI sometimes includes them
  //    even when told not to. The scope is injected via `new Function` args.
  const stripped = tsxCode
    .replace(/^\s*import\s+[^;]+;?\s*$/gm, "")
    .replace(/^\s*export\s+default\s+/gm, "")
    .replace(/^\s*export\s+/gm, "");

  // 3. Compile TSX → JS using classic React.createElement (so we don't need
  //    the automatic runtime at execution time — React is injected directly).
  try {
    const result = await transform(stripped, {
      loader: "tsx",
      jsx: "transform",
      jsxFactory: "React.createElement",
      jsxFragment: "React.Fragment",
      target: "es2020",
      format: "cjs",
      // Don't minify — we want readable stack traces for debugging
      minify: false,
    });

    // 4. Verify the code defines a `Scene` identifier.
    if (!/\bfunction\s+Scene\b/.test(result.code) && !/\bconst\s+Scene\b/.test(result.code)) {
      return {
        ok: false,
        error: "Koden måste definiera en komponent som heter 'Scene' (function eller const).",
      };
    }

    return { ok: true, compiledJs: result.code };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `Kompileringsfel: ${message}` };
  }
}
