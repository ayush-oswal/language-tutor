import type { WordWithProgress } from "@lt/core";
import { IconBook } from "./Icons";
import { SpeakButton } from "./SpeakButton";

export function VocabularyTable({ words, languageCode }: { words: WordWithProgress[]; languageCode?: string }) {
  if (!Array.isArray(words) || words.length === 0) {
    return (
      <div className="empty-state" style={{ padding: "2.5rem 1rem" }}>
        <div className="empty-state-icon">
          <IconBook className="w-6 h-6" />
        </div>
        <p style={{ fontWeight: 600, color: "var(--text-main)" }}>No words match your search.</p>
        <p className="muted" style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
          Try a different keyword or add a new word above.
        </p>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Word</th>
            <th>Translation</th>
            <th>Part of Speech</th>
            <th>Status</th>
            <th>Mastery</th>
            <th style={{ textAlign: "center" }}>Seen</th>
            <th style={{ textAlign: "center" }}>Accuracy</th>
            <th>Last Reviewed</th>
          </tr>
        </thead>
        <tbody>
          {words.map((word) => {
            const mastery = word.progress?.mastery ?? 0;
            const masteryPct = Math.round(mastery * 100);
            const timesSeen = word.progress?.timesSeen ?? 0;
            const timesCorrect = word.progress?.timesCorrect ?? 0;
            const timesWrong = word.progress?.timesWrong ?? 0;
            const accuracyPct = timesSeen === 0 ? 0 : Math.round((timesCorrect / timesSeen) * 100);
            const status = word.progress?.status ?? "NEW";

            let statusClass = "pill-status-NEW";
            if (status === "MASTERED") statusClass = "pill-status-COMPLETED";
            else if (status === "LEARNING" || status === "FAMILIAR") statusClass = "pill-status-IN_PROGRESS";

            return (
              <tr key={word.id}>
                <td style={{ fontWeight: 700, color: "var(--text-main)", fontSize: "0.95rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span>{word.word}</span>
                    <SpeakButton text={word.word} lang={languageCode} size="sm" />
                  </div>
                </td>
                <td style={{ color: "var(--text-muted)" }}>
                  {word.translation}
                </td>
                <td>
                  {word.partOfSpeech ? (
                    <span className="pill" style={{ fontSize: "0.7rem" }}>
                      {word.partOfSpeech}
                    </span>
                  ) : (
                    <span style={{ color: "var(--text-dim)" }}>—</span>
                  )}
                </td>
                <td>
                  <span className={`pill ${statusClass}`} style={{ fontSize: "0.75rem" }}>
                    {status}
                  </span>
                </td>
                <td style={{ minWidth: "120px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <div className="progress-bar" style={{ flex: 1, height: "6px" }}>
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${masteryPct}%`,
                          background:
                            masteryPct >= 80
                              ? "var(--success)"
                              : masteryPct >= 40
                              ? "var(--info)"
                              : "var(--primary-gradient)",
                        }}
                      />
                    </div>
                    <span className="mono" style={{ fontSize: "0.75rem", color: "var(--text-muted)", width: "32px", textAlign: "right" }}>
                      {masteryPct}%
                    </span>
                  </div>
                </td>
                <td style={{ textAlign: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>
                  {timesSeen}
                </td>
                <td style={{ textAlign: "center" }}>
                  {timesSeen > 0 ? (
                    <span
                      style={{
                        fontSize: "0.8rem",
                        fontFamily: "var(--font-mono)",
                        color: accuracyPct >= 75 ? "#34d399" : accuracyPct >= 50 ? "#fbbf24" : "#fda4af",
                      }}
                    >
                      {timesCorrect}/{timesSeen} ({accuracyPct}%)
                    </span>
                  ) : (
                    <span style={{ color: "var(--text-dim)" }}>—</span>
                  )}
                </td>
                <td style={{ color: "var(--text-dim)", fontSize: "0.8rem" }}>
                  {word.progress?.lastSeenAt ? new Date(word.progress.lastSeenAt).toLocaleDateString() : "Never"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
