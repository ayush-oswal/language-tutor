import type { Exercise } from "@lt/core";

export interface ExerciseComponentProps {
  exercise: Exercise;
  onSubmit: (answers: unknown) => Promise<void>;
  /** BCP-47-ish code for the language being learned (e.g. "es") — used to pick a voice for the speak-aloud buttons. */
  languageCode?: string;
}
