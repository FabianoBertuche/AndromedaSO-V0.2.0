process.env.COGNITIVE_SERVICE_ENABLED = process.env.COGNITIVE_SERVICE_ENABLED || "true";
process.env.COGNITIVE_SERVICE_URL = process.env.COGNITIVE_SERVICE_URL || "http://127.0.0.1:8008";

await import("../packages/api/src/index.ts");
