/**
 * Registers the image/alias loader with Node's module system.
 *
 * `--import file.mjs` only preloads a file; it does not make its `resolve` and
 * `load` exports into module hooks. `module.register` is what does that, and it
 * has to run before the script that needs the hooks is imported.
 *
 * Use: node --experimental-strip-types --import ./scripts/register-loader.mjs script.ts
 */
import { register } from "node:module";

// import.meta.url is already a file: URL; wrapping it again doubles the prefix.
register("./image-loader.mjs", import.meta.url);
