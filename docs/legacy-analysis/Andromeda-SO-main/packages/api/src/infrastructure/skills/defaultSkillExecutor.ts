import { ExecuteSkill } from "@andromeda/core";
import { sandboxService } from "../../modules/sandbox/dependencies";
import { SandboxedSkillExecutor } from "./SandboxedSkillExecutor";

export const globalSkillExecutor = new SandboxedSkillExecutor(sandboxService, new ExecuteSkill());
