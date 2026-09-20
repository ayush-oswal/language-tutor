import type {
  Exercise,
  FillBlankPayload,
  MatchingPayload,
  MultipleChoicePayload,
  NewWordLearningPayload,
  QuestionResult,
  StoryPayload,
  TranslationPayload,
} from "@lt/core";

export interface ResolvedQuestionDisplay {
  questionId: string;
  prompt: string;
  submittedLabel: string;
  expectedLabel: string;
  correct: boolean;
}

function labelOr(value: unknown, fallback = "—"): string {
  if (value === undefined || value === null || value === "") return fallback;
  if (Array.isArray(value)) return value.join(" / ");
  return String(value);
}

export function resolveQuestionResults(exercise: Exercise, questionResults: QuestionResult[]): ResolvedQuestionDisplay[] {
  switch (exercise.type) {
    case "MULTIPLE_CHOICE": {
      const payload = exercise.payload as unknown as MultipleChoicePayload;
      return questionResults.map((r) => {
        const question = payload.questions.find((q) => q.id === r.questionId);
        const optionText = (id: unknown) => question?.options.find((o) => o.id === id)?.text;
        return {
          questionId: r.questionId,
          prompt: question?.prompt ?? r.questionId,
          submittedLabel: labelOr(optionText(r.submitted) ?? r.submitted),
          expectedLabel: labelOr(optionText(r.expected) ?? r.expected),
          correct: r.correct,
        };
      });
    }
    case "MATCHING": {
      const payload = exercise.payload as unknown as MatchingPayload;
      return questionResults.map((r) => {
        const item = payload.items.find((i) => i.id === r.questionId);
        const optionText = (id: unknown) => payload.options.find((o) => o.id === id)?.text;
        return {
          questionId: r.questionId,
          prompt: item ? `Match: ${item.text}` : r.questionId,
          submittedLabel: labelOr(optionText(r.submitted) ?? r.submitted),
          expectedLabel: labelOr(optionText(r.expected) ?? r.expected),
          correct: r.correct,
        };
      });
    }
    case "TRANSLATION": {
      const payload = exercise.payload as unknown as TranslationPayload;
      return questionResults.map((r) => {
        const question = payload.questions.find((q) => q.id === r.questionId);
        return {
          questionId: r.questionId,
          prompt: question?.prompt ?? r.questionId,
          submittedLabel: labelOr(r.submitted),
          expectedLabel: labelOr(r.expected),
          correct: r.correct,
        };
      });
    }
    case "FILL_BLANK": {
      const payload = exercise.payload as unknown as FillBlankPayload;
      return questionResults.map((r) => {
        const question = payload.questions.find((q) => q.id === r.questionId);
        return {
          questionId: r.questionId,
          prompt: question?.sentence ?? r.questionId,
          submittedLabel: labelOr(r.submitted),
          expectedLabel: labelOr(r.expected),
          correct: r.correct,
        };
      });
    }
    case "STORY": {
      const payload = exercise.payload as unknown as StoryPayload;
      const questionNodes = payload.nodes.filter((n) => n.kind === "question");

      return questionResults.map((r) => {
        // Direct match: node.id === questionId (MULTIPLE_CHOICE / TRANSLATION / FILL_BLANK).
        const directNode = questionNodes.find((n) => n.kind === "question" && n.id === r.questionId);
        if (directNode && directNode.kind === "question" && directNode.questionType !== "MATCHING") {
          const prompt = directNode.questionType === "FILL_BLANK" ? directNode.sentence : directNode.prompt;
          const optionText =
            directNode.questionType === "MULTIPLE_CHOICE"
              ? (id: unknown) => directNode.options.find((o) => o.id === id)?.text
              : undefined;
          return {
            questionId: r.questionId,
            prompt,
            submittedLabel: labelOr(optionText ? (optionText(r.submitted) ?? r.submitted) : r.submitted),
            expectedLabel: labelOr(optionText ? (optionText(r.expected) ?? r.expected) : r.expected),
            correct: r.correct,
          };
        }

        // Otherwise this result is a single pair from a MATCHING node (questionId = item id).
        for (const node of questionNodes) {
          if (node.kind === "question" && node.questionType === "MATCHING") {
            const item = node.items.find((i) => i.id === r.questionId);
            if (item) {
              const optionText = (id: unknown) => node.options.find((o) => o.id === id)?.text;
              return {
                questionId: r.questionId,
                prompt: `Match: ${item.text}`,
                submittedLabel: labelOr(optionText(r.submitted) ?? r.submitted),
                expectedLabel: labelOr(optionText(r.expected) ?? r.expected),
                correct: r.correct,
              };
            }
          }
        }

        return {
          questionId: r.questionId,
          prompt: r.questionId,
          submittedLabel: labelOr(r.submitted),
          expectedLabel: labelOr(r.expected),
          correct: r.correct,
        };
      });
    }
    case "NEW_WORD_LEARNING": {
      const payload = exercise.payload as unknown as NewWordLearningPayload;
      return questionResults.map((r) => {
        const stage2Item = payload.stage2.items.find((i) => i.id === r.questionId);
        const stage3Question = payload.stage3.questions.find((q) => q.id === r.questionId);
        if (stage2Item) {
          const optionText = (id: unknown) => payload.stage2.options.find((o) => o.id === id)?.text;
          return {
            questionId: r.questionId,
            prompt: `Match: ${stage2Item.text}`,
            submittedLabel: labelOr(optionText(r.submitted) ?? r.submitted),
            expectedLabel: labelOr(optionText(r.expected) ?? r.expected),
            correct: r.correct,
          };
        }
        const optionText = (id: unknown) => stage3Question?.options.find((o) => o.id === id)?.text;
        return {
          questionId: r.questionId,
          prompt: stage3Question?.prompt ?? r.questionId,
          submittedLabel: labelOr(optionText(r.submitted) ?? r.submitted),
          expectedLabel: labelOr(optionText(r.expected) ?? r.expected),
          correct: r.correct,
        };
      });
    }
    default:
      return questionResults.map((r) => ({
        questionId: r.questionId,
        prompt: r.questionId,
        submittedLabel: labelOr(r.submitted),
        expectedLabel: labelOr(r.expected),
        correct: r.correct,
      }));
  }
}
