import { getPrismaClient } from "../../../infrastructure/database/prisma";
import { agentProfileService } from "../../agent-management/dependencies";
import { memoryService } from "../../memory/dependencies";
import { pythonCognitiveServiceAdapter } from "../../cognitive/dependencies";
import { PlaybookSuggestionService } from "./application/PlaybookSuggestionService";
import { PythonEpisodeSuggestionAnalyzer } from "./application/PythonEpisodeSuggestionAnalyzer";
import { LearnFromEpisodesJob } from "./infrastructure/LearnFromEpisodesJob";
import { PrismaPlaybookSuggestionRepository } from "./infrastructure/PrismaPlaybookSuggestionRepository";
import { PlaybookSuggestionsController } from "./interfaces/http/PlaybookSuggestionsController";
import { createPlaybookSuggestionsRouter } from "./interfaces/http/playbook-suggestions.routes";

const prisma = getPrismaClient();

export const playbookSuggestionRepository = new PrismaPlaybookSuggestionRepository(prisma);
export const playbookSuggestionAnalyzer = new PythonEpisodeSuggestionAnalyzer(pythonCognitiveServiceAdapter);
export const playbookSuggestionService = new PlaybookSuggestionService(
    playbookSuggestionRepository,
    playbookSuggestionAnalyzer,
    memoryService,
    agentProfileService,
);

const playbookSuggestionsController = new PlaybookSuggestionsController(playbookSuggestionService);
export const playbookSuggestionsRouter = createPlaybookSuggestionsRouter(playbookSuggestionsController);

export const learnFromEpisodesJob = new LearnFromEpisodesJob(playbookSuggestionService);

void learnFromEpisodesJob.schedule().catch((error) => {
    console.error("[playbook.learn-from-episodes.schedule.failed]", error);
});
