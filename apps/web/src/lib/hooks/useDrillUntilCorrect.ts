"use client";

import { useMemo, useState } from "react";

/**
 * Duolingo-style "drill until correct": wrong questions stay in rotation
 * (re-presented) until answered correctly, but only the learner's FIRST
 * attempt per question counts toward scoring/mastery. Callers submit once,
 * when `isComplete` becomes true, using `firstAttempt`.
 */
export function useDrillUntilCorrect<TAnswer>(questionIds: string[]) {
  const [roundItems, setRoundItems] = useState<string[]>(questionIds);
  const [firstAttempt, setFirstAttempt] = useState<Record<string, TAnswer>>({});

  const submitAnswer = (id: string, answer: TAnswer, isCorrect: boolean) => {
    setFirstAttempt((prev) => (id in prev ? prev : { ...prev, [id]: answer }));
    if (isCorrect) {
      setRoundItems((prev) => prev.filter((itemId) => itemId !== id));
    } else {
      // move to the back of the round so the same item isn't immediately repeated
      setRoundItems((prev) => [...prev.filter((itemId) => itemId !== id), id]);
    }
  };

  const isComplete = useMemo(() => roundItems.length === 0, [roundItems]);

  return { roundItems, firstAttempt, submitAnswer, isComplete };
}
