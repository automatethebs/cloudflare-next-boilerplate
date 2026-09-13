const fs = require("fs");
const path = require("path");

const target = path.join(
  __dirname,
  "..",
  "node_modules",
  "@opennextjs",
  "aws",
  "dist",
  "build",
  "copyTracedFiles.js",
);

if (!fs.existsSync(target)) process.exit(0);

let src = fs.readFileSync(target, "utf8");
if (src.includes("Windows: copy instead of symlink")) process.exit(0);

const needle = `        if (symlink) {
            try {
                symlinkSync(symlink, to);
            }
            catch (e) {
                if (e.code !== "EEXIST") {
                    throw e;
                }
            }
        }`;

const insert = `        if (symlink) {
            try {
                symlinkSync(symlink, to);
            }
            catch (e) {
                // Windows: copy instead of symlink (EPERM without Developer Mode)
                if (e.code === "EPERM" || e.code === "EACCES") {
                    const st = statSync(from);
                    if (st.isDirectory()) {
                        cpSync(from, to, { recursive: true, dereference: true });
                    }
                    else {
                        copyFileAndMakeOwnerWritable(from, to);
                    }
                }
                else if (e.code !== "EEXIST") {
                    throw e;
                }
            }
        }`;

if (!src.includes(needle)) {
  console.warn("OpenNext copyTracedFiles.js shape changed; Windows symlink patch skipped.");
  process.exit(0);
}

fs.writeFileSync(target, src.replace(needle, insert));
console.log("Patched OpenNext copyTracedFiles.js for Windows symlink fallback.");
