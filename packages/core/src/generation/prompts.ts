/**
 * Sentence-quality rules for every practice exercise (standalone and story). Shared by the MCP tool
 * description and the API's generation instructions so the two never drift apart.
 */
export const NATURAL_SENTENCE_RULES =
  "SENTENCE QUALITY — NON-NEGOTIABLE. Every sentence you write (prompts, fill-in-the-blank sentences, story " +
  "text, translations, options) must be something a native speaker would actually say or write in a real, " +
  "everyday situation: ordering food, shopping, making plans, asking for directions, talking about family, " +
  "work, school, health, the weather, travel. It must be grammatically correct, make complete sense on its " +
  "own, and suit the learner's level.\n" +
  "- Picture the situation first, then write what a real person would say in it. Prefer short, useful, " +
  "conversational sentences (questions, requests, replies, everyday statements).\n" +
  "- Build each question around ONE listed word (two only when they naturally belong together). Put only the " +
  "word(s) the question really tests in `wordIds`. Never cram several listed words into one sentence.\n" +
  "- If a listed word doesn't fit a natural sentence, skip it and use the next one. Fewer words in natural " +
  "sentences always beats more words in forced ones.\n" +
  "- Never write abstract, philosophical, vague or nonsensical statements, word salad, or sentences that " +
  "exist only to contain a word. Small function words (articles, prepositions, pronouns) belong inside a " +
  "useful everyday sentence, never as the point of an odd one.\n" +
  "- Fill-in-the-blank: exactly one answer fits, given the sentence and its translation. Distractors must " +
  "clearly not fit (wrong meaning or wrong grammatical form), never be equally valid.\n" +
  "- Multiple choice: one clearly correct option; distractors are the same kind of word but plainly wrong in " +
  "context.\n" +
  "- Translations: the source sentence is natural in its own language, and the accepted answers are natural, " +
  "idiomatic translations (list the common correct variants), never word-for-word renderings.\n" +
  "- Before submitting, re-read every sentence and ask: would a native speaker say this in real life? If " +
  "not, rewrite it.";
