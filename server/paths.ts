/** Every path in the server resolves from this module, not from process.cwd().
 *  Running `tsx server/index.ts` from a sub-folder, from VS Code's debugger, or
 *  from a Windows shell that starts elsewhere must not change what we read. */
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

/** Project root — one level above /server. */
export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export const dataFile = (name: string) => resolve(ROOT, "data", name);
