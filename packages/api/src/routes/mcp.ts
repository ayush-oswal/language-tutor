import {
  addInitialVocabulary,
  addWord,
  buildLearnerContext,
  consumeVocabularyChecked,
  createExerciseFromSubmission,
  createLanguage,
  GET_VOCABULARY_CONTEXT_LIMIT,
  getLanguage,
  getVocabularyForDedup,
  INITIAL_VOCABULARY_TARGET_BY_LEVEL,
  listLanguages,
  listWords,
  markVocabularyChecked,
  NEW_WORD_LEARNING_DEFAULT_COUNT,
  normalizeWord,
  requireUser,
  requireVocabularyChecked,
  REVISION_DEFAULT_LIMIT,
  selectRevisionCandidates,
  validateNewWordExerciseIntegrity,
  validateNoDuplicateWords,
  validateRevisionExerciseIntegrity,
  validateStoryExerciseIntegrity,
  ValidationError,
  type InitialVocabularySubmission,
  type NewWordExerciseSubmission,
  type NewWordLearningPayload,
  type RevisionExerciseSubmission,
  type StoryExerciseSubmission,
  type WordStatus,
} from "@lt/core";
import { Router } from "express";
import type { z } from "zod";
import { addWordBodySchema } from "../dto/vocabulary.dto.js";
import {
  createLanguageBodySchema,
  submitInitialVocabularyBodySchema,
  submitNewWordExerciseBodySchema,
  submitRevisionExerciseBodySchema,
  submitStoryExerciseBodySchema,
} from "../dto/mcp.dto.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { validateBody } from "../middleware/validate.js";

export const mcpRouter = Router();

function throwValidation(errors: string[]): never {
  throw new ValidationError(`Validation failed:\n- ${errors.join("\n- ")}`, errors);
}

// ---------- languages (userId-scoped — no languageId exists yet) ----------

mcpRouter.post(
  "/languages",
  validateBody(createLanguageBodySchema),
  asyncHandler(async (req, res) => {
    const { userId, ...input } = req.body as z.infer<typeof createLanguageBodySchema>;
    await requireUser(userId);
    const language = await createLanguage(userId, input);
    const target = INITIAL_VOCABULARY_TARGET_BY_LEVEL[input.currentLevel];
    res.json({
      language,
      initialVocabularyTarget: target,
      instructions:
        `REQUIRED: this language needs ${target} initial vocabulary words — a real starting vocabulary for ` +
        `${input.currentLevel}, not a token sample. Generate ${target} common, level-appropriate words now and ` +
        `call submitInitialVocabulary. If you split this across multiple calls, do not stop or report ` +
        `completion until submitInitialVocabulary reports 0 words remaining.`,
    });
  }),
);

mcpRouter.get(
  "/languages",
  asyncHandler(async (req, res) => {
    const userId = typeof req.query.userId === "string" ? req.query.userId : "";
    res.json(await listLanguages(userId));
  }),
);

// ---------- everything below is scoped by languageId alone ----------

mcpRouter.get(
  "/languages/:languageId",
  asyncHandler(async (req, res) => {
    res.json(await getLanguage(req.params.languageId));
  }),
);

mcpRouter.post(
  "/languages/:languageId/initial-vocabulary",
  validateBody(submitInitialVocabularyBodySchema),
  asyncHandler(async (req, res) => {
    const { languageId } = req.params;
    const { submission } = req.body as { submission: InitialVocabularySubmission };
    const language = await addInitialVocabulary(languageId, submission.words);
    const target = INITIAL_VOCABULARY_TARGET_BY_LEVEL[language.currentLevel];
    const remaining = Math.max(0, target - language.wordCount);
    res.json({
      language,
      initialVocabularyTarget: target,
      remaining,
      instructions:
        remaining > 0
          ? `NOT DONE: ${remaining} more words needed to reach the ${target}-word target. Generate another ` +
            `batch of at least 50 new words now and call submitInitialVocabulary again.`
          : `Target reached — vocabulary is ready.`,
    });
  }),
);

mcpRouter.get(
  "/languages/:languageId/vocabulary",
  asyncHandler(async (req, res) => {
    const { languageId } = req.params;
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const status = typeof req.query.status === "string" ? (req.query.status as WordStatus) : undefined;
    const unfiltered = !search && !status;
    const result = await listWords(
      languageId,
      unfiltered ? { sortBy: "mastery", page: 1, pageSize: GET_VOCABULARY_CONTEXT_LIMIT } : { search, status },
    );
    if (unfiltered) markVocabularyChecked(languageId);
    res.json({
      words: result.words.map((w) => ({
        id: w.id,
        word: w.word,
        mastery: w.progress?.mastery ?? 0,
        status: w.progress?.status ?? "NEW",
        timesSeen: w.progress?.timesSeen ?? 0,
      })),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    });
  }),
);

mcpRouter.post(
  "/languages/:languageId/words",
  validateBody(addWordBodySchema),
  asyncHandler(async (req, res) => {
    const word = await addWord(req.params.languageId, req.body);
    res.status(201).json(word);
  }),
);

mcpRouter.get(
  "/languages/:languageId/progress",
  asyncHandler(async (req, res) => {
    res.json(await buildLearnerContext(req.params.languageId));
  }),
);

mcpRouter.get(
  "/languages/:languageId/new-words",
  asyncHandler(async (req, res) => {
    const { languageId } = req.params;
    const language = await getLanguage(languageId);
    const existingVocabulary = await getVocabularyForDedup(languageId);
    const count = req.query.count ? Number(req.query.count) : NEW_WORD_LEARNING_DEFAULT_COUNT;
    const topic = typeof req.query.topic === "string" ? req.query.topic : undefined;
    res.json({
      language: { name: language.name, languageCode: language.languageCode, level: language.currentLevel },
      count,
      topic,
      existingVocabulary,
    });
  }),
);

mcpRouter.post(
  "/languages/:languageId/new-word-exercises",
  validateBody(submitNewWordExerciseBodySchema),
  asyncHandler(async (req, res) => {
    const { languageId } = req.params;
    const { submission } = req.body as { submission: NewWordExerciseSubmission };
    const existing = await getVocabularyForDedup(languageId);

    const dedup = validateNoDuplicateWords(submission.candidates, existing);
    if (!dedup.valid) throwValidation(dedup.errors);

    const integrity = validateNewWordExerciseIntegrity(submission);
    if (!integrity.valid) throwValidation(integrity.errors);

    const candidates = submission.candidates.map((c) => ({ ...c, normalizedWord: normalizeWord(c.word) }));
    const payload: NewWordLearningPayload = {
      schemaVersion: 1,
      candidates,
      stage1: { presentations: candidates.map((c) => ({ tempId: c.tempId })) },
      stage2: submission.stage2,
      stage3: submission.stage3,
    };

    const exercise = await createExerciseFromSubmission(
      languageId,
      "NEW_WORD_LEARNING",
      payload,
      { schemaVersion: 1, ...submission.answerKey },
      submission.generationContext,
    );
    res.json(exercise);
  }),
);

mcpRouter.get(
  "/languages/:languageId/revision",
  asyncHandler(async (req, res) => {
    const { languageId } = req.params;
    const preferredType = typeof req.query.preferredType === "string" ? req.query.preferredType : "ANY";
    requireVocabularyChecked(languageId);
    const learnerContext = await buildLearnerContext(languageId);
    const revisionCandidates = await selectRevisionCandidates(languageId, { limit: REVISION_DEFAULT_LIMIT });
    consumeVocabularyChecked(languageId);
    res.json({
      learnerContext,
      revisionCandidates,
      instructions:
        preferredType === "ANY"
          ? "No type preference given — pick whichever of MATCHING/MULTIPLE_CHOICE/TRANSLATION/FILL_BLANK best fits these words."
          : `Build a ${preferredType} exercise using these words (and only these words), then call submitRevisionExercise with type: "${preferredType}".`,
    });
  }),
);

mcpRouter.post(
  "/languages/:languageId/revision-exercises",
  validateBody(submitRevisionExerciseBodySchema),
  asyncHandler(async (req, res) => {
    const { languageId } = req.params;
    const { submission } = req.body as { submission: RevisionExerciseSubmission };
    const { words } = await listWords(languageId);
    const allowedWordIds = new Set(words.map((w) => w.id));

    const integrity = validateRevisionExerciseIntegrity(submission, allowedWordIds);
    if (!integrity.valid) throwValidation(integrity.errors);

    const exercise = await createExerciseFromSubmission(
      languageId,
      submission.type,
      { schemaVersion: 1, ...submission.payload },
      { schemaVersion: 1, ...submission.answerKey },
      submission.generationContext,
    );
    res.json(exercise);
  }),
);

mcpRouter.get(
  "/languages/:languageId/story",
  asyncHandler(async (req, res) => {
    const { languageId } = req.params;
    const topic = typeof req.query.topic === "string" ? req.query.topic : undefined;
    requireVocabularyChecked(languageId);
    const learnerContext = await buildLearnerContext(languageId);
    const revisionCandidates = await selectRevisionCandidates(languageId, { limit: REVISION_DEFAULT_LIMIT });
    consumeVocabularyChecked(languageId);
    res.json({ learnerContext, revisionCandidates, topic });
  }),
);

mcpRouter.post(
  "/languages/:languageId/story-exercises",
  validateBody(submitStoryExerciseBodySchema),
  asyncHandler(async (req, res) => {
    const { languageId } = req.params;
    const { submission } = req.body as { submission: StoryExerciseSubmission };
    const { words } = await listWords(languageId);
    const allowedWordIds = new Set(words.map((w) => w.id));

    const integrity = validateStoryExerciseIntegrity(submission, allowedWordIds);
    if (!integrity.valid) throwValidation(integrity.errors);

    const exercise = await createExerciseFromSubmission(
      languageId,
      "STORY",
      { schemaVersion: 1, ...submission.payload },
      { schemaVersion: 1, ...submission.answerKey },
      submission.generationContext,
    );
    res.json(exercise);
  }),
);
