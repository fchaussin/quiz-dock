# Quiz bundle (import / export)

A quiz leaves and enters QuizDock as a **bundle**: a `quiz.json` manifest next
to a `media/` folder, zipped (`<title>.quizdock.zip`). The same layout, unzipped,
is what a Quiz Store repository holds.

- **Export** — editor header → *Export*, or `GET /api/v1/quizzes/:id/export`.
- **Import** — dashboard → *Import* (zip, or a bare `quiz.json` when there is
  no media), or `POST /api/v1/quizzes/import` (multipart field `file`). The
  result is a **new draft** owned by the importer, with its own copies of the
  media. Nothing is merged or overwritten.

## `quiz.json`

```json
{
  "format": "quizdock/quiz",
  "version": 1,
  "quiz": {
    "title": "Capitals",
    "description": "Markdown, inline images allowed: ![map](media/map.png)",
    "language": "en",
    "feedbackEnabled": true,
    "cover": "media/cover.jpg"
  },
  "items": [
    {
      "kind": "slide",
      "blocks": [
        { "type": "heading", "id": "h1", "text": "Welcome", "level": 1 },
        { "type": "image", "id": "i1", "media": "media/map.png", "size": "large", "align": "center" }
      ],
      "backgroundGradient": { "angle": 135, "colors": ["#1e3a8a", "#0f172a"] },
      "textTone": "light",
      "displayDelayS": 0
    },
    {
      "kind": "question",
      "type": "single_choice",
      "prompt": "Capital of France?",
      "media": "media/eiffel.jpg",
      "answerExplanation": "Paris has been the capital since 987.",
      "timeLimitS": 20,
      "pointsMode": "standard",
      "options": [
        { "text": "Paris", "color": "red", "shape": "triangle", "isCorrect": true },
        { "text": "Lyon", "color": "blue", "shape": "diamond" }
      ]
    },
    { "kind": "question", "type": "text_input", "prompt": "Capital of Italy?", "acceptedAnswers": ["Rome", "Roma"] },
    { "kind": "question", "type": "numeric", "prompt": "Departments in France?", "numericValue": 101, "numericTolerance": 0 },
    { "kind": "question", "type": "numeric", "prompt": "Height of the Eiffel Tower (m)?", "numericValue": 330, "numericTolerance": 5, "scoring": "closest", "pointsMode": "fixed" }
  ]
}
```

- `items` lists slides and questions **in sequence order**; a slide sits before
  the next question, or at the end.
- Media are referenced by relative path under `media/` (flat, no
  sub-folders), including inline Markdown images. Accepted types: png, jpg,
  gif, webp, avif, mp3, ogg, wav, m4a — each within `MEDIA_MAX_BYTES`, the
  whole zip within `IMPORT_MAX_BYTES`.
- Questions and slides follow the API content rules (question types and their
  fields, block types, colour/shape names, limits). Defaults apply when a
  field is omitted: `timeLimitS` 20, `pointsMode` standard, `textTone` light,
  `displayDelayS` null (engine default; `0` = the host clicks).
- `scoring` picks a per-type rule (`standard` when omitted): numeric `closest`
  (answers ranked by distance, scored at the reveal), multiple_choice /
  ordering `partial` (credit per right element), text_input `lenient`
  (typos tolerated). `pointsMode` accepts `standard`, `double`, `none`, `fixed`
  (full points, no speed weighting).
- An invalid bundle is refused as a whole, with the offending item and field.
