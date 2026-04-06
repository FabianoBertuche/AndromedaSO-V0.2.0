import { Router } from "express";
import { KnowledgeController } from "./KnowledgeController";
import { CreateCollectionUseCase } from "../../application/use-cases/CreateCollectionUseCase";
import { AddDocumentUseCase } from "../../application/use-cases/AddDocumentUseCase";
import { KnowledgeLanguageService } from "../../application/use-cases/KnowledgeLanguageService";
import { PrismaKnowledgeRepository } from "../../infrastructure/persistence/PrismaKnowledgeRepository";
import { getPrismaClient } from "../../../../infrastructure/database/prisma";

const prisma = getPrismaClient();
const knowledgeRepository = new PrismaKnowledgeRepository(prisma);
const createCollectionUseCase = new CreateCollectionUseCase(knowledgeRepository);
const languageService = new KnowledgeLanguageService();
const addDocumentUseCase = new AddDocumentUseCase(knowledgeRepository, languageService);

const controller = new KnowledgeController(
    knowledgeRepository,
    createCollectionUseCase,
    addDocumentUseCase
);

const router = Router();

// Collections
router.post("/collections", (req, res) => void controller.createCollection(req, res));
router.get("/collections", (req, res) => void controller.listCollections(req, res));

// Documents
router.post("/collections/:collectionId/documents", (req, res) => void controller.addDocument(req, res));
router.get("/collections/:collectionId/documents", (req, res) => void controller.listDocuments(req, res));
router.delete("/documents/:documentId", (req, res) => void controller.deleteDocument(req, res));

export default router;
