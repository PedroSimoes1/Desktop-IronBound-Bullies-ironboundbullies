/**
 * A Node module loader that makes `import photo from "./x.jpg"` work outside
 * Next, so a plain script can import the real content files.
 *
 * Next turns an image import into a StaticImageData object. Node cannot load a
 * JPEG at all, so this stands in for it and reports the real pixel dimensions
 * read from the file, which is what the content files use. The blur
 * placeholder is left undefined: it is generated during the Next build and the
 * database does not store it for repository photographs.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const IMAGE = /\.(jpe?g|png|webp|avif|gif|svg)$/i;

/**
 * A JPEG is a chain of markers. The Start Of Frame one carries the real size.
 * Twenty lines of parsing beats adding an image library to read two numbers.
 */
function jpegSize(buf) {
  if (buf.readUInt16BE(0) !== 0xffd8) return null;
  let offset = 2;
  while (offset < buf.length - 1) {
    if (buf[offset] !== 0xff) return null;
    const marker = buf[offset + 1];
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: buf.readUInt16BE(offset + 5), width: buf.readUInt16BE(offset + 7) };
    }
    offset += 2 + buf.readUInt16BE(offset + 2);
  }
  return null;
}

function pngSize(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

/** Resolve the "@/" alias the app uses to the src directory. */
const alias = (specifier) =>
  specifier.startsWith("@/") ? pathToFileURL(path.resolve(process.cwd(), "src", specifier.slice(2))).href : null;

export async function resolve(specifier, context, next) {
  if (IMAGE.test(specifier)) {
    const resolved = alias(specifier) ?? new URL(specifier, context.parentURL).href;
    return { url: resolved, shortCircuit: true, format: "module" };
  }

  const aliased = alias(specifier);
  if (aliased) return next(aliased.endsWith(".ts") ? aliased : `${aliased}.ts`, context);

  // TypeScript lets a relative import omit the extension; Node does not.
  if (specifier.startsWith(".") && !path.extname(specifier)) {
    return next(`${specifier}.ts`, context);
  }

  return next(specifier, context);
}

export async function load(url, context, next) {
  if (IMAGE.test(url)) {
    const file = fileURLToPath(url);
    const buf = readFileSync(file);
    const size = jpegSize(buf) ?? pngSize(buf) ?? { width: 0, height: 0 };
    const name = path.basename(file, path.extname(file));
    const source = `export default ${JSON.stringify({
      src: name,
      width: size.width,
      height: size.height,
      blurDataURL: undefined,
    })};`;
    return { format: "module", source, shortCircuit: true };
  }
  return next(url, context);
}
