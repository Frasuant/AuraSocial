import { readFileSync, writeFileSync } from "fs";
import path from "path";

const clientPath = path.join(process.cwd(), "node_modules", ".prisma", "client", "index.js");
let content = readFileSync(clientPath, "utf-8");

if (content.includes("config.engineWasm = undefined")) {
  content = content.replace(
    "config.engineWasm = undefined",
    `config.engineWasm = {
  getRuntime: async () => require('./query_engine_bg.js'),
  getQueryEngineWasmModule: async () => {
    const { readFileSync } = require('fs');
    const { join } = require('path');
    const wasmPath = join(__dirname, 'query_engine_bg.wasm');
    const wasmBuffer = readFileSync(wasmPath);
    return await WebAssembly.compile(wasmBuffer);
  }
}`
  );
  writeFileSync(clientPath, content, "utf-8");
  console.log("✓ Patched .prisma/client/index.js with WASM engine");
} else {
  console.log("⊘ Already patched or pattern not found");
}
