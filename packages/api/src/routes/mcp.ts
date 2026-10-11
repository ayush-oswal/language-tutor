import {
  collectNewWordIds,
  buildLearnerContext,
  createExerciseFromSubmission,
  EXERCISE_CANDIDATE_LIMIT,
  GET_VOCABULARY_CONTEXT_LIMIT,
  getNewWordsForLearning,
  getRevisableWordIds,
  getSession,
  getSessionOverview,
  listSessions,
  listTagsForLevel,
  listWords,
  NEW_WORD_LEARNING_DEFAULT_COUNT,
  pickNewWords,
  requireUser,
  selectRevisionCandidates,
  validateExerciseIntegrity,
  validateNewWordExerciseIntegrity,
  ValidationError,
  type ExerciseSubmission,
  type NewWordExerciseSubmission,
  type NewWordLearningPayload,
} from "@lt/core";
import { WordStatus } from "@lt/db";
import { Router } from "express";
import { submitExerciseBodySchema, submitNewWordExerciseBodySchema } from "../dto/mcp.dto.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { queryEnum, validateBody } from "../middleware/validate.js";

export const mcpRouter = Router();

const NEW_WORD_LEARNING_MAX_COUNT = 30;

const PRACTICE_EXERCISE_TYPES = {
  MATCHING: "MATCHING",
  MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
  TRANSLATION: "TRANSLATION",
  FILL_BLANK: "FILL_BLANK",
  STORY: "STORY",
} as const;

const NO_KNOWN_WORDS_MESSAGE =
  "User does not know any words yet. Call requestNewWords to teach the user new words (a new-word lesson) " +
  "before generating any practice exercise.";

function throwValidation(errors: string[]): never {
  throw new ValidationError(`Validation failed:\n- ${errors.join("\n- ")}`, errors);
}

function queryString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

// ---------- sessions (userId-scoped — the learner's enrollments) ----------

mcpRouter.get(
  "/sessions",
  asyncHandler(async (req, res) => {
    const userId = queryString(req.query.userId) ?? "";
    await requireUser(userId);
    res.json(await listSessions(userId));
  }),
);

// ---------- everything below is scoped by sessionId alone ----------

mcpRouter.get(
  "/sessions/:sessionId",
  asyncHandler(async (req, res) => {
    const overview = await getSessionOverview(req.params.sessionId);
    const availableTags = await listTagsForLevel(overview.language.id, overview.currentLevel);
    res.json({ ...overview, availableTags });
  }),
);

mcpRouter.get(
  "/sessions/:sessionId/vocabulary",
  asyncHandler(async (req, res) => {
    const session = await getSession(req.params.sessionId);
    const search = queryString(req.query.search);
    const status = queryEnum(req.query.status, WordStatus);
    const unfiltered = !search && !status;
    const result = await listWords(
      session.id,
      session.currentLevel,
      unfiltered
        ? { sortBy: "mastery", excludeNew: true, page: 1, pageSize: GET_VOCABULARY_CONTEXT_LIMIT }
        : { search, status },
    );
    // An unfiltered result already excludes NEW words, so an empty one means nothing has been taught yet.
    const knowsNoWords =
      result.total === 0 && (unfiltered || (await getRevisableWordIds(session.id, session.currentLevel)).size === 0);
    res.json({
      ...(knowsNoWords && { message: NO_KNOWN_WORDS_MESSAGE }),
      level: session.currentLevel,
      words: result.words.map((w) => ({
        id: w.id,
        word: w.word,
        level: w.level,
        mastery: w.progress.mastery,
        status: w.progress.status,
        timesSeen: w.progress.timesSeen,
      })),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    });
  }),
);

mcpRouter.get(
  "/sessions/:sessionId/progress",
  asyncHandler(async (req, res) => {
    res.json(await buildLearnerContext(req.params.sessionId));
  }),
);

// ---------- new-word learning ----------

mcpRouter.get(
  "/sessions/:sessionId/new-words",
  asyncHandler(async (req, res) => {
    const session = await getSession(req.params.sessionId);
    const count = Math.min(
      NEW_WORD_LEARNING_MAX_COUNT,
      Math.max(1, Number(req.query.count) || NEW_WORD_LEARNING_DEFAULT_COUNT),
    );
    const tag = queryString(req.query.tag);
    const { words, remaining } = await pickNewWords(session.id, session.currentLevel, count, { tag });

    res.json({
      session: {
        id: session.id,
        languageName: session.language.name,
        languageCode: session.language.code,
        level: session.currentLevel,
      },
      tag,
      words,
      remainingNewWordsAtLevel: remaining,
      instructions:
        words.length === 0
          ? tag
            ? `There are no un-introduced ${session.currentLevel} words tagged "${tag}". Offer the learner a ` +
              `different topic, no topic, or a practice exercise instead.`
            : `There are no un-introduced ${session.currentLevel} words left (every word at this level has been ` +
              `introduced, or the rest are already in an unfinished new-word lesson). Suggest finishing any ` +
              `pending lesson, doing a practice exercise, or moving up a level from the web app.`
          : `Build the 3-stage new-word lesson for exactly these ${words.length} words, referencing them by the ` +
            `wordId given, and call submitNewWordExercise. Stage 1 (shown automatically) presents each word with ` +
            `its meaning and example sentences. Stage 2: match each word to its English translation. Stage 3: ` +
            `one fill-in-the-gap question per word, built from one of that word's example sentences — copy the ` +
            `sentence, replace the word with "___" (exactly once), give the sentence's English translation, and ` +
            `offer the removed form plus distractors drawn from the other words in this lesson. Shuffle all ` +
            `answer options: stage 2 translations in a random order (not the order of the words), and the ` +
            `correct stage 3 option at a random position in each question, so no answer is predictable from ` +
            `its position.`,
    });
  }),
);

mcpRouter.post(
  "/sessions/:sessionId/new-word-exercises",
  validateBody(submitNewWordExerciseBodySchema),
  asyncHandler(async (req, res) => {
    const session = await getSession(req.params.sessionId);
    const { submission } = req.body as { submission: NewWordExerciseSubmission };

    const wordIds = collectNewWordIds(submission);
    const newWords = await getNewWordsForLearning(session.id, session.currentLevel, wordIds);

    const integrity = validateNewWordExerciseIntegrity(submission, new Set(newWords.keys()));
    if (!integrity.valid) throwValidation(integrity.errors);

    const words = wordIds.map((id) => newWords.get(id)!);
    const payload: NewWordLearningPayload = {
      schemaVersion: 1,
      words,
      stage1: { presentations: words.map((w) => ({ wordId: w.wordId })) },
      stage2: submission.stage2,
      stage3: submission.stage3,
    };

    const exercise = await createExerciseFromSubmission(
      session.id,
      "NEW_WORD_LEARNING",
      payload,
      { schemaVersion: 1, ...submission.answerKey },
      submission.generationContext,
    );
    res.json(exercise);
  }),
);

// ---------- practice exercises (matching, multiple choice, translation, fill-in-the-blank, story) ----------

mcpRouter.get(
  "/sessions/:sessionId/exercise-words",
  asyncHandler(async (req, res) => {
    const session = await getSession(req.params.sessionId);
    const type = queryEnum(req.query.type, PRACTICE_EXERCISE_TYPES);
    if (!type) {
      throw new ValidationError(`type must be one of ${Object.keys(PRACTICE_EXERCISE_TYPES).join(", ")}`);
    }
    const topic = type === "STORY" ? queryString(req.query.topic) : undefined;

    const words = await selectRevisionCandidates(session.id, session.currentLevel, {
      limit: EXERCISE_CANDIDATE_LIMIT,
    });
    res.json({
      session: {
        id: session.id,
        languageName: session.language.name,
        languageCode: session.language.code,
        level: session.currentLevel,
      },
      type,
      topic,
      words,
      instructions:
        words.length === 0
          ? NO_KNOWN_WORDS_MESSAGE
          : type === "STORY"
            ? `Write a short story${topic ? ` about "${topic}"` : ""} in ${session.language.name} at ` +
              `${session.currentLevel} level, weaving in as many of these words as fit naturally, with 3-6 ` +
              `embedded questions (mixing MULTIPLE_CHOICE, FILL_BLANK, TRANSLATION and MATCHING) that test words ` +
              `from near the top of the list. Reference only wordIds from this list, then call submitExercise ` +
              `with type "STORY".`
            : `Build a ${type} exercise testing 6-10 of these words, taken from the top of the list (the list is ` +
              `ordered by how much each word needs practice). Reference only wordIds from this list, then call ` +
              `submitExercise with type "${type}".`,
    });
  }),
);

mcpRouter.post(
  "/sessions/:sessionId/exercises",
  validateBody(submitExerciseBodySchema),
  asyncHandler(async (req, res) => {
    const session = await getSession(req.params.sessionId);
    const { submission } = req.body as { submission: ExerciseSubmission };
    const allowedWordIds = await getRevisableWordIds(session.id, session.currentLevel);

    const integrity = validateExerciseIntegrity(submission, allowedWordIds);
    if (!integrity.valid) throwValidation(integrity.errors);

    const exercise = await createExerciseFromSubmission(
      session.id,
      submission.type,
      { schemaVersion: 1, ...submission.payload },
      { schemaVersion: 1, ...submission.answerKey },
      submission.generationContext,
    );
    res.json(exercise);
  }),
);
