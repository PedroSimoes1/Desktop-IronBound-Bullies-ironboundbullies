/**
 * The Supabase storage driver, against a stand-in Supabase.
 *
 *   npm run test:storage
 *
 * The driver that will hold the owner's photographs had never once run when
 * this was written: every upload in development goes to a folder on disk, and
 * the bucket path only wakes up on a deployed site. That is a bad place to
 * find out the request was shaped wrong.
 *
 * So this stands up a small HTTP server that answers like Supabase Storage,
 * points the driver at it, and checks what actually arrives: the method, the
 * path, both authorisation headers, the content type, and the bytes. It also
 * checks the failure answers, because "the bucket does not exist" and "the key
 * is wrong" are the two mistakes anyone setting this up will make, and they
 * have to say which.
 *
 * It cannot prove Supabase accepts the request. It can prove we are not
 * sending an obviously wrong one, which is the part we control.
 */

import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import path from "node:path";

const received = [];
let reply = { status: 200, body: '{"Key":"ok"}' };

const server = createServer((request, response) => {
  const chunks = [];
  request.on("data", (chunk) => chunks.push(chunk));
  request.on("end", () => {
    received.push({
      method: request.method,
      url: request.url,
      headers: request.headers,
      body: Buffer.concat(chunks),
    });
    response.writeHead(reply.status, { "Content-Type": "application/json" });
    response.end(reply.body);
  });
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;

process.env.PHOTO_STORAGE = "supabase";
process.env.SUPABASE_URL = origin;
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
process.env.SUPABASE_STORAGE_BUCKET = "dog-photos";

const { storePhotoFile, deletePhotoFile } = await import("../src/lib/storage.ts");

const results = [];
const check = (name, ok, detail = "") => results.push({ ok, name, detail });

/* A real JPEG from the project, so the size really is parsed from real bytes. */
const bytes = readFileSync(path.join(process.cwd(), "src/photos/missy-01.jpg"));
const file = new File([new Uint8Array(bytes)], "whatever-the-phone-called-it.jpg", { type: "image/jpeg" });

/* ---------------------------------------------------------------------------
   A GOOD UPLOAD
   -------------------------------------------------------------------------- */
const stored = await storePhotoFile(file, "ironbound");
check("the upload succeeds", !("error" in stored), "error" in stored ? stored.error : "");

const upload = received[0];
check("it is a POST", upload?.method === "POST", upload?.method);
check("...to the bucket path", upload?.url === `/storage/v1/object/dog-photos/${stored.key}`, upload?.url);
check("...with the service key as apikey", upload?.headers.apikey === "test-service-role-key");
check("...and as a bearer token", upload?.headers.authorization === "Bearer test-service-role-key");
check("...declaring the real content type", upload?.headers["content-type"] === "image/jpeg", upload?.headers["content-type"]);
check("...telling caches it never changes", /immutable/.test(upload?.headers["cache-control"] ?? ""), upload?.headers["cache-control"]);
check("...carrying every byte of the file", upload?.body.length === bytes.length, `${upload?.body.length} of ${bytes.length}`);
check("...unchanged", upload?.body.equals(bytes));

check("the key is prefixed with the kennel", stored.key?.startsWith("ironbound/"), stored.key);
check("...and contains nothing the uploader named", !stored.key?.includes("whatever-the-phone-called-it"), stored.key);
check("...ending in the real extension", stored.key?.endsWith(".jpg"), stored.key);
check("the public URL is the public one", stored.url === `${origin}/storage/v1/object/public/dog-photos/${stored.key}`, stored.url);
check("the size was read from the bytes", stored.width === 2560 && stored.height === 2046, `${stored.width}x${stored.height}`);

/* ---------------------------------------------------------------------------
   DELETING
   -------------------------------------------------------------------------- */
received.length = 0;
await deletePhotoFile(stored.key);
const removal = received[0];
check("a delete is a DELETE", removal?.method === "DELETE", removal?.method);
check("...at the same key", removal?.url === `/storage/v1/object/dog-photos/${stored.key}`, removal?.url);
check("...authorised the same way", removal?.headers.apikey === "test-service-role-key" && removal?.headers.authorization === "Bearer test-service-role-key");

/* ---------------------------------------------------------------------------
   THE TWO MISTAKES EVERYONE MAKES
   -------------------------------------------------------------------------- */
reply = { status: 404, body: '{"error":"Bucket not found"}' };
const noBucket = await storePhotoFile(file, "ironbound");
check(
  "a missing bucket says so, and says to make it public",
  "error" in noBucket && /bucket/i.test(noBucket.error) && /public/i.test(noBucket.error),
  "error" in noBucket ? noBucket.error : "no error",
);

reply = { status: 401, body: '{"message":"Invalid JWT"}' };
const badKey = await storePhotoFile(file, "ironbound");
check(
  "a rejected key names the key, not the photograph",
  "error" in badKey && /SUPABASE_SERVICE_ROLE_KEY/.test(badKey.error),
  "error" in badKey ? badKey.error : "no error",
);

reply = { status: 500, body: "" };
const broken = await storePhotoFile(file, "ironbound");
check(
  "any other failure says nothing was changed",
  "error" in broken && /nothing was changed/i.test(broken.error),
  "error" in broken ? broken.error : "no error",
);

/* ---------------------------------------------------------------------------
   THINGS THAT MUST NOT BE STORED AT ALL
   -------------------------------------------------------------------------- */
reply = { status: 200, body: '{"Key":"ok"}' };
received.length = 0;

const script = new File([new Uint8Array(Buffer.from("<?php echo 'hello'; ?>"))], "picture.jpg", { type: "image/jpeg" });
const refused = await storePhotoFile(script, "ironbound");
check("a file that only claims to be a photograph is refused", "error" in refused);
check("...and nothing was sent to storage", received.length === 0, `${received.length} request(s)`);

const wrongType = new File([new Uint8Array(bytes)], "x.gif", { type: "image/gif" });
const refusedType = await storePhotoFile(wrongType, "ironbound");
check("an unsupported type is refused", "error" in refusedType);

const huge = new File([new Uint8Array(13 * 1024 * 1024)], "big.jpg", { type: "image/jpeg" });
const refusedSize = await storePhotoFile(huge, "ironbound");
check("a file over the limit is refused, with the size in the message", "error" in refusedSize && /13\.0MB/.test(refusedSize.error), "error" in refusedSize ? refusedSize.error : "");

server.close();

const failed = results.filter((r) => !r.ok);
console.log("");
for (const r of results) console.log(`  ${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.detail ? `   [${r.detail}]` : ""}`);
console.log(`\n  ${results.length - failed.length} passed, ${failed.length} failed\n`);
process.exit(failed.length === 0 ? 0 : 1);
