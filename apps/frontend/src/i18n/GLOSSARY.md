# Glossary

The vocabulary of QuizDock's interface, in the five shipped locales, and the
choices behind it. It extends the canonical glossary ratified in
[ADR 0001](../../../../docs/adr/0001-i18n-et-glossaire.md) (quiz / session /
participant / animateur / PIN) to every term the interface has grown since. Keep it in step with the `locales/*.json` files: when a term
changes, change it here and everywhere it appears (the parity test only checks
keys, not wording). Values below are copied from the dictionaries — `en` is the
reference, the others follow its sense, not its words.

## Roles and places

| Term | en | fr | es | zh | zh-TW | Where |
| --- | --- | --- | --- | --- | --- | --- |
| quiz | quiz | quiz | quiz | 测验 | 測驗 | everywhere |
| my quizzes | My quizzes | Mes quiz | Mis quizzes | 我的测验 | 我的測驗 | topbar, `/quizzes` |
| editor | Editor | Éditeur | Editor | 编辑器 | 編輯器 | `/quizzes/:id` |
| host | Host | Animateur | Anfitrión | 主持人 | 主持人 | live |
| host seat | Host seat | Siège hôte | Asiento de anfitrión | 主持席位 | 主持席位 | local auth mode |
| participant | Participant | Participant | Participante | 参与者 | 參與者 | live, console tab |
| nickname | Nickname | Pseudo | Apodo | 昵称 | 暱稱 | join |
| session | Session | Session | Sesión | 会话 | 會話 | a quiz being played |
| console | Console | Console | Consola | 控制台 | 控制台 | `/session/:pin/console` |
| projection | Projection | Projection | Proyección | 投影 | 投影 | `/session/:pin/projection` |
| join / PIN | Join · PIN code | Rejoindre · Code PIN | Unirse · Código PIN | 加入 · PIN 码 | 加入 · PIN 碼 | `/join` |
| reviews | Reviews | Avis | Opiniones | 评价 | 評價 | `/quizzes/:id/reviews` |
| history | History | Historique | Historial | 历史 | 歷史 | `/quizzes/:id/history` |

## Content

| Term | en | fr | es | zh | zh-TW |
| --- | --- | --- | --- | --- | --- |
| question | Question | Question | Pregunta | 题目 | 題目 |
| slide | Slide | Slide | Diapositiva | 幻灯片 | 投影片 |
| option (answer choice) | Option | Option | Opción | 选项 | 選項 |
| explanation | Explanation | Explication | Explicación | 解析 | 解析 |
| background | Background | Fond | Fondo | 背景 | 背景 |
| outline (text halo) | Outline (halo, like subtitles) | Contour (halo, comme des sous-titres) | Contorno (halo, como subtítulos) | 描边（光晕，如字幕） | 描邊（光暈，如字幕） |
| draft / ready / archived | Draft / Ready / Archived | Brouillon / Prêt / Archivé | Borrador / Listo / Archivado | 草稿 / 就绪 / 已归档 | 草稿 / 就緒 / 已歸檔 |
| publish | Publish (ready) | Publier (prêt) | Publicar (listo) | 发布（就绪） | 發布（就緒） |
| present | Present | Présenter | Presentar | 演示 | 示範 |
| import / export | Import / Export | Importer / Exporter | Importar / Exportar | 导入 / 导出 | 匯入 / 匯出 |

## Play

| Term | en | fr | es | zh | zh-TW |
| --- | --- | --- | --- | --- | --- |
| reveal | Reveal | Révéler | Revelar | 揭晓 | 揭曉 |
| leaderboard | Leaderboard | Classement | Clasificación | 排行榜 | 排行榜 |
| podium | Podium | Podium | Podio | 领奖台 | 領獎台 |
| leave | Leave | Quitter | Salir | 退出 | 離開 |
| looking back | Looking back | Retour en arrière | Mirando atrás | 回顾 | 回顧 |
| back to live | Back to live | Reprendre | Volver al directo | 回到当前 | 回到目前 |
| full answer capture | Full answer capture | Capture intégrale des réponses | Captura completa de respuestas | 完整记录回答 | 完整記錄回答 |

## Scoring

| Term | en | fr | es | zh | zh-TW |
| --- | --- | --- | --- | --- | --- |
| scoring (rule) | Scoring | Barème | Puntuación | 计分规则 | 計分規則 |
| closest wins | Closest answer wins | Le plus proche gagne | Gana la más cercana | 最接近者胜 | 最接近者勝 |
| partial credit | Partial credit | Crédit partiel | Crédito parcial | 部分得分 | 部分得分 |
| tolerate typos | Tolerate typos | Tolérant aux fautes | Tolerar erratas | 容忍拼写错误 | 容忍拼字錯誤 |
| double points | Double | Double | Doble | 双倍 | 雙倍 |
| fixed points | Fixed (no speed bonus) | Fixe (sans bonus vitesse) | Fijo (sin bonus de velocidad) | 固定（无速度加分） | 固定（無速度加分） |

## Decisions

- **quiz, not questionnaire.** Product name and common usage; "questionnaire"
  reads like a survey. Kept as `quiz` in every locale (it is a loanword in
  fr/es); Chinese uses 测验/測驗 (a test one plays), not 问卷 (a survey).
- **session** (a quiz being played) rather than *game* or *party*: neutral
  enough for classrooms and teams. fr *session*, not *partie*.
- **host / animateur**: the person presenting. fr uses *animateur*
  (presenter/facilitator) — *hôte* is kept only in *siège hôte*, where the
  seat is a technical lock, not a person.
- **participant, not player**: the people answering may be students or
  colleagues; *player* only survives in code identifiers and route ids.
- **slide**: kept in French (common in presentation software); es
  *diapositiva*; zh-TW *投影片* (Taiwan usage), zh *幻灯片*.
- **console / projection**: the two host screens. *Console* is the control
  surface (never *dashboard*, which is *My quizzes*); *projection* is the big
  screen (never *display* or *screen*, too generic).
- **reveal**: the moment answers are shown; a verb in the console (*Reveal
  now*) and a state everywhere else. fr *révéler / révélation*, never
  *correction*.
- **explanation**: the note shown at the reveal; not *solution* (there may be
  none, e.g. a poll) nor *feedback* (reserved for reviews).
- **reviews** (participants rating a quiz) vs **feedback** (the API/DB word):
  the interface says *reviews / avis*; `feedback` stays in identifiers only.
- **history** for archived sessions of a quiz (not *sessions*, which is the
  live word).
- **looking back / back to live**: the host showing a played step again;
  nothing is replayed, so no *replay* / *rejouer* wording anywhere.
- **scoring / barème**: the per-question rule. *Points* (standard / double /
  fixed) is the amount; *scoring* is how the answer earns it.
- **closest wins**: ranks numeric answers by distance; say *closest*, never
  *nearest guess* (there is a right value).
- **partial credit** (multiple choice, ordering) vs **all or nothing**: the
  default is all or nothing, and its wording stays explicit in the rules line.
- **tolerate typos / lenient**: *lenient* is the code value; the interface
  always explains it (*tolerate typos*), never says *fuzzy*.
- **host seat**: the single-host lock of local mode; *claim*, *extend*,
  *release* are its verbs (never *login* for the seat itself).
- **Taiwan usage in zh-TW**: 資料 (data), 檔案 (file), 清單 (list), 拖曳
  (drag), 送出 (submit), 自訂 (custom), 置中 (centre), 投影片 (slide), 「」
  quotes. zh-TW is resolved straight to `en`, never through `zh`. The locale
  was contributed by [@noeFly](https://github.com/noeFly) (#1); later keys are
  machine-assisted and follow their choices — native review welcome.
- **No jargon leaks**: tokenised error codes (`quiz.not_found`…) are
  translated in `errors.json`; the interface never shows a code.
