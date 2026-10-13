// ── JSON Patch (RFC 6902, delmängd) för riktade ändringar i en VideoConfig ──
//
// Chatten och självgranskningen låter AI:n svara med små operationer i stället
// för en hel ny config: snabbare, och det som inte ska ändras kan inte ändras
// av misstag. Stöder add, remove, replace, move och test.

export type PatchOp =
  | { op: "add"; path: string; value: unknown }
  | { op: "replace"; path: string; value: unknown }
  | { op: "remove"; path: string }
  | { op: "move"; from: string; path: string }
  | { op: "test"; path: string; value: unknown };

export class PatchError extends Error {}

type Container = Record<string, unknown> | unknown[];

function parsePath(path: string): string[] {
  if (path === "") return [];
  if (!path.startsWith("/")) throw new PatchError(`Ogiltig sökväg "${path}"`);
  return path
    .slice(1)
    .split("/")
    .map((p) => p.replace(/~1/g, "/").replace(/~0/g, "~"));
}

function isContainer(v: unknown): v is Container {
  return typeof v === "object" && v !== null;
}

function arrayIndex(arr: unknown[], key: string, allowEnd: boolean): number {
  if (key === "-" && allowEnd) return arr.length;
  if (!/^\d+$/.test(key)) throw new PatchError(`Ogiltigt index "${key}"`);
  const i = Number(key);
  if (i > arr.length || (!allowEnd && i >= arr.length)) {
    throw new PatchError(`Index ${i} utanför listan (${arr.length})`);
  }
  return i;
}

/** Följer sökvägen till föräldern och returnerar den plus sista nyckeln. */
function resolveParent(doc: unknown, path: string): { parent: Container; key: string } {
  const parts = parsePath(path);
  if (parts.length === 0) throw new PatchError("Roten kan inte ändras med en operation");
  let node: unknown = doc;
  for (const part of parts.slice(0, -1)) {
    if (Array.isArray(node)) node = node[arrayIndex(node, part, false)];
    else if (isContainer(node)) node = (node as Record<string, unknown>)[part];
    else throw new PatchError(`Sökvägen "${path}" finns inte`);
    if (!isContainer(node)) throw new PatchError(`Sökvägen "${path}" finns inte`);
  }
  return { parent: node as Container, key: parts[parts.length - 1] };
}

function get(doc: unknown, path: string): unknown {
  const { parent, key } = resolveParent(doc, path);
  if (Array.isArray(parent)) return parent[arrayIndex(parent, key, false)];
  if (!(key in parent)) throw new PatchError(`Sökvägen "${path}" finns inte`);
  return (parent as Record<string, unknown>)[key];
}

function add(doc: unknown, path: string, value: unknown) {
  const { parent, key } = resolveParent(doc, path);
  if (Array.isArray(parent)) parent.splice(arrayIndex(parent, key, true), 0, value);
  else (parent as Record<string, unknown>)[key] = value;
}

function remove(doc: unknown, path: string): unknown {
  const { parent, key } = resolveParent(doc, path);
  if (Array.isArray(parent)) return parent.splice(arrayIndex(parent, key, false), 1)[0];
  if (!(key in parent)) throw new PatchError(`Sökvägen "${path}" finns inte`);
  const old = (parent as Record<string, unknown>)[key];
  delete (parent as Record<string, unknown>)[key];
  return old;
}

/**
 * Tillämpar operationerna på en kopia av dokumentet. Kastar PatchError om
 * någon operation inte går att tillämpa — då ändras ingenting.
 */
export function applyPatch<T>(doc: T, ops: PatchOp[]): T {
  if (!Array.isArray(ops)) throw new PatchError("Patchen måste vara en lista");
  const copy = structuredClone(doc) as unknown;
  for (const op of ops) {
    switch (op?.op) {
      case "add":
        add(copy, op.path, structuredClone(op.value));
        break;
      case "replace": {
        const { parent, key } = resolveParent(copy, op.path);
        if (Array.isArray(parent)) parent[arrayIndex(parent, key, false)] = structuredClone(op.value);
        else (parent as Record<string, unknown>)[key] = structuredClone(op.value);
        break;
      }
      case "remove":
        remove(copy, op.path);
        break;
      case "move": {
        const value = remove(copy, op.from);
        add(copy, op.path, value);
        break;
      }
      case "test":
        if (JSON.stringify(get(copy, op.path)) !== JSON.stringify(op.value)) {
          throw new PatchError(`Test misslyckades för "${op.path}"`);
        }
        break;
      default:
        throw new PatchError(`Okänd operation ${JSON.stringify(op)}`);
    }
  }
  return copy as T;
}
