import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import ptBRCommon from "./locales/pt-BR/common.json";
import ptBRAgents from "./locales/pt-BR/agents.json";
import ptBRTasks from "./locales/pt-BR/tasks.json";
import ptBRErrors from "./locales/pt-BR/errors.json";

import enUSCommon from "./locales/en-US/common.json";
import enUSAgents from "./locales/en-US/agents.json";
import enUSTasks from "./locales/en-US/tasks.json";
import enUSErrors from "./locales/en-US/errors.json";

export const defaultNS = "common";
export const resources = {
    "pt-BR": {
        common: ptBRCommon,
        agents: ptBRAgents,
        tasks: ptBRTasks,
        errors: ptBRErrors,
    },
    "en-US": {
        common: enUSCommon,
        agents: enUSAgents,
        tasks: enUSTasks,
        errors: enUSErrors,
    },
} as const;

i18n.use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: "en-US",
        supportedLngs: ["pt-BR", "en-US"],
        ns: ["common", "agents", "tasks", "errors"],
        defaultNS,
        detection: {
            order: ["localStorage", "navigator"],
            caches: ["localStorage"],
        },
        interpolation: {
            escapeValue: false,
        },
        resources,
    });

export default i18n;