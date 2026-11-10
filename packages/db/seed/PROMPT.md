
---

You are building vocabulary entries for a French course for English speakers. The words below come from a
French frequency list built from film subtitles. Each input line has three columns — rank, word, frequency:

```
211    prendre    264,970
212    affecter    264,958
```

**Only the rank and the word matter.** The frequency column is not used for anything — ignore it entirely.
The rank is already assigned; don't recompute, re-sort, or renumber it.

## Parameters

- **LEVEL = {level}**. Every entry you output must have `"level": "{level}"`, with no exceptions, whatever
  you think the word's level is.

## Allowed tags

Pick tags only from this list, using the exact `name` values:

[
  { "name": "common", "description": "Core everyday words a learner needs constantly, regardless of topic" },
  { "name": "grammar", "description": "Function words: articles, pronouns, prepositions, conjunctions, auxiliary verbs, determiners" },
  { "name": "questions", "description": "Question words and phrases (what, where, why, how much...)" },
  { "name": "greetings", "description": "Greetings, farewells, politeness and social phrases" },
  { "name": "numbers", "description": "Numbers, quantities, amounts, measurements" },
  { "name": "time", "description": "Days, months, seasons, clock time, frequency, dates, time expressions" },
  { "name": "family", "description": "Family members and family relationships" },
  { "name": "people", "description": "People, relationships, personality, appearance, age, nationality" },
  { "name": "body", "description": "Parts of the body and physical actions" },
  { "name": "health", "description": "Health, illness, medicine, doctors, hospitals" },
  { "name": "emotions", "description": "Feelings, moods, opinions, attitudes" },
  { "name": "food", "description": "Food, drink, cooking, meals, restaurants" },
  { "name": "home", "description": "House, rooms, furniture, household objects and chores" },
  { "name": "clothing", "description": "Clothes, accessories, fashion" },
  { "name": "colors", "description": "Colors and shapes" },
  { "name": "animals", "description": "Animals and pets" },
  { "name": "nature", "description": "Nature, landscape, plants, environment" },
  { "name": "weather", "description": "Weather and climate" },
  { "name": "travel", "description": "Travel, transport, holidays, directions, hotels" },
  { "name": "city", "description": "Places in a town or city, buildings, shops, services" },
  { "name": "work", "description": "Jobs, the workplace, business, office" },
  { "name": "education", "description": "School, university, studying, learning" },
  { "name": "shopping", "description": "Shopping, money, prices, payment" },
  { "name": "sports", "description": "Sports, exercise, games, competitions" },
  { "name": "hobbies", "description": "Leisure, music, art, films, books, entertainment" },
  { "name": "technology", "description": "Computers, phones, the internet, media" },
  { "name": "communication", "description": "Speaking, writing, asking, telling, language itself" },
  { "name": "daily-life", "description": "Daily routines and common everyday actions" },
  { "name": "society", "description": "Government, law, politics, news, religion, social issues" },
  { "name": "history", "description": "Historical events, eras, periods and figures" },
  { "name": "science", "description": "Science, nature phenomena, scientific concepts and discovery" },
  { "name": "finance", "description": "Money, banking, investing, the economy, financial matters" }
]


## Input words

{inputWords}


## Step 1: decide what to output for each input word

1. **Skip words that are not useful vocabulary.** Output nothing for:
   - proper nouns of any kind: names of people, places, countries, nationalities, brands, organizations — only
     output actual dictionary words, never a name
   - fillers and noises, e.g. "euh", "ben", "hein", "haha"
   - tokens that are not French, abbreviations, or stray single letters (real words such as "y" and "a" are kept)
   - profanity and slurs
2. **Use the dictionary form (lemma).** The subtitle list contains inflected forms, so convert them:
   - verbs → infinitive ("ai", "a", "avait" → "avoir")
   - nouns → singular ("maisons" → "maison")
   - adjectives → masculine singular ("bonnes" → "bon")
   - pronouns, articles, determiners, prepositions and contractions stay as they are ("la", "les", "me", "du", "au")
3. **One entry per lemma.** If several input words share a lemma, output it once, using the lowest
   (smallest) rank among those input lines.
4. **Words with more than one part of speech.** If an input word is common in two different parts of speech,
   output one entry for each (maximum two per input word), both with that input word's rank. An example is
   "si": the conjunction "si" (if), plus the adverb "si" (yes, used to contradict a negative question). Only
   do this when both uses are genuinely common.

## Output format

Return **only** a JSON array. Do not wrap it in markdown code fences, and do not add comments or explanations.
Each element must have exactly these fields:

| field          | type                  | rules |
|----------------|-----------------------|-------|
| `word`         | string                | The lemma, in lowercase unless it is always capitalised. Correct accents and the cedilla (é, è, à, ç, ê...). Nouns have no article ("maison", not "la maison"). |
| `translation`  | string                | The most common English meaning(s): up to 3, separated by ", ". Verbs start with "to " ("to have"). No explanations in brackets. |
| `partOfSpeech` | string                | One of: `NOUN`, `VERB`, `ADJECTIVE`, `ADVERB`, `PRONOUN`, `PREPOSITION`, `CONJUNCTION`, `INTERJECTION`, `DETERMINER`, `NUMERAL`, `PHRASE`. Articles and possessive/demonstrative adjectives are `DETERMINER`. Use `PHRASE` only for fixed multi-word expressions. |
| `level`        | string                | Always exactly `"{level}"`. |
| `gender`       | string or null        | Nouns only: `"masculine"`, `"feminine"`, or `"masculine/feminine"` for nouns that keep the same form for both (e.g. "élève"). `null` for every other part of speech. |
| `rank`         | integer               | The rank given on the input line (for a merged lemma, the lowest rank among the input lines merged into it). |
| `tags`         | array of strings      | 1 to 3 tags from the allowed list, most relevant first. Use `common` for core everyday words, and `grammar` for function words (articles, pronouns, prepositions, conjunctions, auxiliary verbs). |
| `sentences`    | array of 2 objects    | Each object is `{ "sentence": string, "translation": string }`. See the rules below. |

### Rules for sentences

- Write exactly 2 sentences, each showing a different, common use of the word.
- Each sentence must contain the word (any inflected form is fine, e.g. "ai" for "avoir").
- Keep them level-appropriate: at A1/A2, 4–10 words using only simple, frequent vocabulary and the present tense
  where possible; at C2 and above, up to 16 words, with more varied grammar.
- Write natural, correct French, including accents and the cedilla (é, è, à, ç, ê, î, ô, û...) and the space
  before `?`, `!`, `:` and `;`.
- `translation` is a natural, accurate English translation of the whole sentence.
- Don't use real people's names; use common first names or pronouns.

## Example

With LEVEL = A1, and these input lines:

```
1    ai    5000
2    euh    4200
3    maisons    3100
4    a    2900
```

"euh" is skipped (it is a filler), and "ai"/"a" merge into "avoir" with the lower rank, 1. Output:

[
  {
    "word": "avoir",
    "translation": "to have",
    "partOfSpeech": "VERB",
    "level": "A1",
    "gender": null,
    "rank": 1,
    "tags": ["common", "daily-life"],
    "sentences": [
      { "sentence": "J'ai deux frères.", "translation": "I have two brothers." },
      { "sentence": "As-tu faim ?", "translation": "Are you hungry?" }
    ]
  },
  {
    "word": "maison",
    "translation": "house, home",
    "partOfSpeech": "NOUN",
    "level": "A1",
    "gender": "feminine",
    "rank": 3,
    "tags": ["home", "common"],
    "sentences": [
      { "sentence": "Ma maison est petite.", "translation": "My house is small." },
      { "sentence": "On rentre à la maison.", "translation": "We're going home." }
    ]
  }
]

## Final check before answering

- Every input word is either represented by an entry or deliberately skipped.
- Every `level` is exactly "{level}".
- Every output `rank` matches the rank given on its input line (the lowest, for a merged lemma).
- No lemma + part of speech appears twice.
- Every tag is from the allowed list.
- The output is valid JSON and nothing else.
