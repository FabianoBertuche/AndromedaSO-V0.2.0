import { CognitiveRoutingSignalService } from "./application/CognitiveRoutingSignalService";
import { loadCognitiveServiceConfig } from "./infrastructure/cognitive-service.config";
import { PythonCognitiveServiceAdapter } from "./infrastructure/python/PythonCognitiveServiceAdapter";

export const cognitiveServiceConfig = loadCognitiveServiceConfig();
export const pythonCognitiveServiceAdapter = new PythonCognitiveServiceAdapter(cognitiveServiceConfig);
export const cognitiveRoutingSignalService = new CognitiveRoutingSignalService(
    pythonCognitiveServiceAdapter,
    cognitiveServiceConfig,
);
