// 长尾页种子数据 —— 05-SEO 手册 §4 的数据源（用类型化模块替代 CSV，免转义问题）
// 纪律：每页的 audience 句和 FAQ 必须按人群定制（防批量空壳页惩罚）。
// 新增页面 = 往这里加条目，URL 自动生成为 /<slug>。

export interface LongtailSeed {
  slug: string;
  h1: string;
  tool: 'detect' | 'humanize';
  audience: string; // 首段第三句的人群锚定
  faqs: { q: string; a: string }[];
  related: string[];
}

export const longtailSeeds: LongtailSeed[] = [
  // ============ AI Detector 场景（15） ============
  {
    slug: 'ai-detector-for-teachers',
    h1: 'AI Detector for Teachers',
    tool: 'detect',
    audience: 'Built for teachers grading essays — sentence-level evidence shows exactly which lines triggered the score, so you never accuse on a number alone.',
    faqs: [
      { q: 'Can I check a whole class of essays at once?', a: 'Yes. Use the Batch files tab on the main AI Detector — drop up to 50 .txt files or a .zip and every file gets its own score. Files never leave your browser.' },
      { q: 'How should teachers use AI detection scores?', a: 'As one signal, never as proof. Detectors can misjudge formulaic human writing. Open the sentence breakdown, discuss it with the student, and weigh it against their in-class writing.' },
    ],
    related: ['/ai-detector', '/word-counter', '/ai-detector-for-essays'],
  },
  {
    slug: 'ai-detector-for-essays',
    h1: 'AI Detector for Essays',
    tool: 'detect',
    audience: 'Made for essays specifically — it weighs the formal register, transitions, and sentence rhythm that graders and detectors both look at.',
    faqs: [
      { q: 'How many words do I need for a reliable essay check?', a: 'At least 50 words; 150 or more gives a steadier score. Very short texts are hard for any detector to judge.' },
      { q: 'Will my essay be saved anywhere?', a: 'No. Detection runs instantly and stores nothing. Text is kept for 7 days only if you deliberately create a share link.' },
    ],
    related: ['/ai-detector', '/ai-humanizer', '/ai-detector-for-teachers'],
  },
  {
    slug: 'ai-detector-for-students',
    h1: 'AI Detector for Students',
    tool: 'detect',
    audience: 'Check your own work before you submit — if you used AI for drafts or research, see exactly what a grader detector would flag.',
    faqs: [
      { q: 'Why should students run an AI check themselves?', a: 'Because your teacher probably will. Finding false positives on your own writing before submission gives you time to revise — or to explain.' },
      { q: 'I wrote it myself but it scores high. What now?', a: 'Detectors misjudge formulaic writing. Rewrite the flagged sentences with more varied rhythm, then re-check. The AI Humanizer automates exactly this.' },
    ],
    related: ['/ai-detector', '/ai-humanizer', '/ai-detector-for-essays'],
  },
  {
    slug: 'ai-detector-for-resumes',
    h1: 'AI Detector for Resumes & Cover Letters',
    tool: 'detect',
    audience: 'Recruiters are quietly running resumes through detectors — see what yours looks like before it reaches their inbox.',
    faqs: [
      { q: 'Do employers really check resumes for AI?', a: 'A growing number screen cover letters and LinkedIn summaries, especially for writing-heavy roles. Generic AI phrasing is the most common giveaway.' },
      { q: 'What part of a resume gets flagged most?', a: 'Summary sections written by chatbots — dense with words like "leverage", "passionate", and "results-driven". Rewrite those in your own voice.' },
    ],
    related: ['/ai-detector', '/ai-humanizer', '/ai-detector-for-cover-letters'],
  },
  {
    slug: 'ai-detector-for-cover-letters',
    h1: 'AI Detector for Cover Letters',
    tool: 'detect',
    audience: 'A cover letter is the one page where your voice is the product — make sure it does not read like everyone else\u2019s chatbot draft.',
    faqs: [
      { q: 'Is using AI on a cover letter automatically bad?', a: 'Drafting with AI is common. Submitting unedited AI output is what gets noticed — flat rhythm and stock phrases. Check, then personalize the flagged lines.' },
      { q: 'How do I fix a flagged cover letter?', a: 'Rewrite flagged sentences with a specific detail only you could write: a number, a name, a moment. Specificity reads human.' },
    ],
    related: ['/ai-detector', '/ai-humanizer', '/ai-detector-for-resumes'],
  },
  {
    slug: 'ai-detector-for-seo-content',
    h1: 'AI Detector for SEO Content',
    tool: 'detect',
    audience: 'Writers and agencies check deliverables here before clients do — know what GPTZero-style tools will say about the draft you are about to send.',
    faqs: [
      { q: 'Does Google penalize AI-written content?', a: 'Officially no — Google penalizes unhelpful content regardless of origin. But AI-typical patterns correlate with thin content, and clients often enforce detector scores contractually.' },
      { q: 'What is a safe AI score for client delivery?', a: 'Most agencies aim under 30%. Our humanizer shows the before/after score so you can prove it.' },
    ],
    related: ['/ai-detector', '/ai-humanizer', '/paraphrasing-tool'],
  },
  {
    slug: 'ai-detector-for-blogs',
    h1: 'AI Detector for Blog Posts',
    tool: 'detect',
    audience: 'Bloggers and editors checking guest posts and freelance drafts — catch machine-written submissions before they dilute your site.',
    faqs: [
      { q: 'Can I check a batch of guest posts at once?', a: 'Yes — the Batch files tab on the AI Detector takes up to 50 files or a .zip, entirely in your browser.' },
      { q: 'What signals does the detector weigh?', a: 'Sentence-length uniformity, AI-vocabulary markers ("moreover", "delve", "tapestry"), connective density, and absence of contractions. The sentence breakdown shows each signal in place.' },
    ],
    related: ['/ai-detector', '/ai-humanizer', '/text-summarizer'],
  },
  {
    slug: 'ai-detector-for-emails',
    h1: 'AI Detector for Emails',
    tool: 'detect',
    audience: 'Sales and support leads who sound like templates get ignored — check that your outreach reads like a person wrote it.',
    faqs: [
      { q: 'Do people detect business emails?', a: 'More than you would think — spam-weary recipients recognize chatbot cadence instantly, even without a tool. The patterns are that visible.' },
      { q: 'What makes an email read as AI?', a: 'Perfectly balanced sentences, "I hope this message finds you well", and lists of three. Breaking rhythm and adding one specific detail fixes most of it.' },
    ],
    related: ['/ai-detector', '/ai-humanizer', '/ai-detector-for-blogs'],
  },
  {
    slug: 'ai-detector-for-reports',
    h1: 'AI Detector for Reports & Papers',
    tool: 'detect',
    audience: 'For long-form academic and business reports — paste any section and see which paragraphs carry machine fingerprints.',
    faqs: [
      { q: 'Is checking a section enough, or the whole report?', a: 'Sections work fine. For whole documents, use Batch files with a .zip on the main detector — every file gets its own score.' },
      { q: 'Are citations and quotes flagged as AI?', a: 'Formal quoted text can raise a score slightly. Check with and without quotes to see the difference before drawing conclusions.' },
    ],
    related: ['/ai-detector', '/ai-humanizer', '/text-summarizer'],
  },
  {
    slug: 'ai-detector-for-homework',
    h1: 'AI Detector for Homework',
    tool: 'detect',
    audience: 'Homework answers have their own tells — short, tidy, textbook-perfect paragraphs. This check is tuned for exactly that shape of text.',
    faqs: [
      { q: 'Is it free for checking homework?', a: 'Yes — 5 checks a day with no signup, and unlimited batch scans in your browser.' },
      { q: 'My homework is flagged but I wrote it. What do I do?', a: 'Keep a draft history (Google Docs version history works). Show the process, then use the sentence breakdown to point out the detector\u2019s false positives.' },
    ],
    related: ['/ai-detector', '/ai-detector-for-students', '/ai-humanizer'],
  },
  {
    slug: 'ai-detector-for-linkedin-posts',
    h1: 'AI Detector for LinkedIn Posts',
    tool: 'detect',
    audience: 'The feed is flooded with chatbot posts — check yours stands out as human before you publish, or audit a ghostwriter\u2019s drafts before paying.',
    faqs: [
      { q: 'Do LinkedIn\u2019s own systems penalize AI posts?', a: 'Reach is driven by engagement; formulaic AI posts depress replies. Human-sounding posts simply perform better.' },
      { q: 'How do I check a post fast?', a: 'Paste the draft above and scan — takes under a second because it runs locally.' },
    ],
    related: ['/ai-detector', '/ai-humanizer', '/word-counter'],
  },
  {
    slug: 'ai-detector-for-dissertations',
    h1: 'AI Detector for Dissertations & Theses',
    tool: 'detect',
    audience: 'Chapter-scale checks for grad students and supervisors — verify your literature review reads as your own synthesis, not a model summary.',
    faqs: [
      { q: 'Can it handle a 10,000-word chapter?', a: 'Paste up to 500 words per check, or split the chapter into files and use Batch mode — 50 files per run, all locally in your browser.' },
      { q: 'Is a low AI score enough to satisfy my university?', a: 'No detector score is proof of anything. Use it as a self-check, keep your drafts and notes as your real evidence of authorship.' },
    ],
    related: ['/ai-detector', '/ai-detector-for-reports', '/ai-humanizer'],
  },
  {
    slug: 'ai-detector-for-articles',
    h1: 'AI Detector for Articles',
    tool: 'detect',
    audience: 'Editors commissioning articles — run the draft before publication and see the sentence-level heat map, not just a scary number.',
    faqs: [
      { q: 'What score should make me reject a submission?', a: 'Never reject on a score alone. Open the breakdown: two flagged paragraphs in an otherwise human draft is an editing conversation, not a rejection.' },
      { q: 'Does editing AI text lower the score?', a: 'Yes — even light human editing moves the score. That is why checking the final draft, not the first, matters.' },
    ],
    related: ['/ai-detector', '/ai-detector-for-blogs', '/ai-humanizer'],
  },
  {
    slug: 'ai-detector-for-writers',
    h1: 'AI Detector for Content Writers',
    tool: 'detect',
    audience: 'Freelance writers protecting their reputation — prove your delivery is clean before the client\u2019s tool claims otherwise.',
    faqs: [
      { q: 'A client accused my human writing of being AI. Now what?', a: 'Show them the sentence breakdown and offer your draft history. Then run the flagged sentences through the humanizer-style revision and re-check — false positives respond to rhythm changes.' },
      { q: 'How do I keep my natural style under detector pressure?', a: 'Vary sentence length aggressively and use contractions. Those two habits alone move most human writing to safe scores.' },
    ],
    related: ['/ai-detector', '/ai-detector-for-seo-content', '/ai-humanizer'],
  },
  {
    slug: 'ai-detector-for-applications',
    h1: 'AI Detector for College Applications',
    tool: 'detect',
    audience: 'Application season is detector season — admissions readers screen personal statements, so see yours through their lens first.',
    faqs: [
      { q: 'Do admissions offices run personal statements through AI detectors?', a: 'Many do or plan to. More importantly, seasoned readers recognize chatbot cadence by eye. Either way, your statement should sound like you.' },
      { q: 'Is it cheating to check my own application?', a: 'No — checking is free and private. If you drafted with AI, the flagged sentences tell you exactly where to replace generic phrasing with your own specifics.' },
    ],
    related: ['/ai-detector', '/ai-detector-for-essays', '/ai-humanizer'],
  },

  // ============ Humanizer 场景（15） ============
  {
    slug: 'humanize-chatgpt-text',
    h1: 'Humanize ChatGPT Text',
    tool: 'humanize',
    audience: 'Tuned for ChatGPT\u2019s tells — the balanced sentences, the "delve", the tidy lists of three — with the AI score shown dropping as proof.',
    faqs: [
      { q: 'Will it keep my facts and numbers?', a: 'Yes. Every fact, number, and name survives the rewrite. Spot-check anything critical before use — good practice with any rewriting tool.' },
      { q: 'How do I know it worked?', a: 'The tool runs a detector before and after and shows both scores. If the score did not drop enough, try a stronger rewrite setting.' },
    ],
    related: ['/ai-humanizer', '/ai-detector', '/humanize-gemini-text'],
  },
  {
    slug: 'humanize-gemini-text',
    h1: 'Humanize Gemini Text',
    tool: 'humanize',
    audience: 'Gemini drafts have their own rhythm — heavier transitions and formal closures. This pass targets exactly those patterns.',
    faqs: [
      { q: 'Is it different from humanizing ChatGPT text?', a: 'The core method is the same, but the rewrite watch-list differs — each model leaves slightly different fingerprints in phrasing and structure.' },
      { q: 'Is my Gemini draft uploaded or stored?', a: 'The text is processed to produce your rewrite and then discarded. Nothing is saved unless you create a share link elsewhere.' },
    ],
    related: ['/ai-humanizer', '/ai-detector', '/humanize-chatgpt-text'],
  },
  {
    slug: 'humanize-deepseek-text',
    h1: 'Humanize DeepSeek Text',
    tool: 'humanize',
    audience: 'DeepSeek output runs formal and evenly-paced — the rewrite breaks the cadence and clears the AI vocabulary it leans on.',
    faqs: [
      { q: 'Does it work on Chinese-language DeepSeek output?', a: 'The humanizer is tuned for English text. For Chinese drafts, translate first, humanize, then review the translation quality.' },
      { q: 'What modes are available?', a: 'Standard for most writing, Academic for papers, Casual for posts and emails, Creative for the freest rewrite — each with Light, Balanced, and Strong intensity.' },
    ],
    related: ['/ai-humanizer', '/ai-detector', '/humanize-chatgpt-text'],
  },
  {
    slug: 'humanize-claude-text',
    h1: 'Humanize Claude Text',
    tool: 'humanize',
    audience: 'Claude drafts favor flowing compound sentences and diplomatic hedging — this pass varies the rhythm and trims the qualifiers.',
    faqs: [
      { q: 'Can I humanize a long Claude conversation export?', a: 'Paste up to 300 words per free run. For longer documents, process section by section or upgrade for more capacity.' },
      { q: 'Will the tone stay appropriate for work email?', a: 'Choose the Casual or Standard mode — Academic is for papers. Always give the result a quick read for context the rewriter cannot know.' },
    ],
    related: ['/ai-humanizer', '/ai-detector', '/humanize-chatgpt-text'],
  },
  {
    slug: 'humanize-ai-text',
    h1: 'Humanize AI Text',
    tool: 'humanize',
    audience: 'Works on output from any model — paste the text, pick a mode, and watch the AI score fall before your eyes.',
    faqs: [
      { q: 'What does "humanizing" actually change?', a: 'Sentence rhythm (short mixed with long), AI-vocabulary removal, structure de-templating, and natural quirks like contractions and asides. Meaning stays identical.' },
      { q: 'Is this free?', a: 'Three free rewrites a day, no signup. Your text is never stored.' },
    ],
    related: ['/ai-humanizer', '/ai-detector', '/humanize-ai-essays'],
  },
  {
    slug: 'humanize-ai-essays',
    h1: 'Humanize AI Essays',
    tool: 'humanize',
    audience: 'Academic mode keeps scholarly terms and citation flow while breaking the machine cadence graders notice first.',
    faqs: [
      { q: 'Will humanizing hurt my essay\u2019s argument?', a: 'No — claims, evidence, and order of ideas are preserved. Only wording and rhythm change. Read it through once to confirm flow.' },
      { q: 'Is this allowed at my school?', a: 'Policies differ wildly. Many ban submitting AI-generated work regardless of editing. Know your institution\u2019s rule before you use any humanizer.' },
    ],
    related: ['/ai-humanizer', '/ai-detector-for-essays', '/paraphrasing-tool'],
  },
  {
    slug: 'humanize-ai-emails',
    h1: 'Humanize AI Emails',
    tool: 'humanize',
    audience: 'Outreach and replies that sound like a person, not a template — pick Casual mode and keep the sign-off you actually use.',
    faqs: [
      { q: 'Will it keep names and numbers right?', a: 'Yes — names, numbers, dates, and links survive exactly. Give it one read before sending, as with any draft.' },
      { q: 'What mode is best for cold outreach?', a: 'Casual with Balanced strength. Cold email dies on formality; the rewrite keeps it human without getting sloppy.' },
    ],
    related: ['/ai-humanizer', '/ai-detector-for-emails', '/humanize-ai-text'],
  },
  {
    slug: 'humanize-ai-blogs',
    h1: 'Humanize AI Blog Posts',
    tool: 'humanize',
    audience: 'Blog drafts that keep your keyword targeting and structure while dropping the cadence that readers — and detectors — spot instantly.',
    faqs: [
      { q: 'Will humanizing hurt my SEO?', a: 'The opposite: AI-typical patterns correlate with shallow content. Keep your headings and keywords; the rewrite changes rhythm and wording, not structure.' },
      { q: 'Section by section or the whole post?', a: 'Section by section at the free tier — intro, body, close — then stitch. It also keeps each rewrite focused.' },
    ],
    related: ['/ai-humanizer', '/ai-detector-for-seo-content', '/humanize-ai-text'],
  },
  {
    slug: 'humanize-ai-reports',
    h1: 'Humanize AI Reports',
    tool: 'humanize',
    audience: 'Business and research reports in Academic mode — formal enough for the boardroom, human enough that nobody asks who wrote it.',
    faqs: [
      { q: 'Are figures and findings preserved?', a: 'Every number, name, and claim survives exactly. The rewrite touches prose style, never content.' },
      { q: 'How long can a report section be?', a: 'Up to 300 words per free run — enough for a typical section. Run each section separately for best results.' },
    ],
    related: ['/ai-humanizer', '/ai-detector-for-reports', '/text-summarizer'],
  },
  {
    slug: 'humanize-ai-cover-letters',
    h1: 'Humanize AI Cover Letters',
    tool: 'humanize',
    audience: 'The letter that gets read is the one that sounds like a person — swap the chatbot cadence for your voice before it ships.',
    faqs: [
      { q: 'Should I tell employers I drafted with AI?', a: 'Most care about the result, not the tool. The bigger risk is a letter that reads identical to a thousand others — that is what humanizing fixes.' },
      { q: 'One mode fits all applications?', a: 'Standard for corporate roles, Casual for startups. Swap in one specific detail per company after rewriting — specificity is the real human signal.' },
    ],
    related: ['/ai-humanizer', '/ai-detector-for-cover-letters', '/humanize-ai-text'],
  },
  {
    slug: 'humanize-ai-linkedin-posts',
    h1: 'Humanize AI LinkedIn Posts',
    tool: 'humanize',
    audience: 'Posts that read like you typed them between meetings — Casual mode, contractions on, engagement-bait rhythm off.',
    faqs: [
      { q: 'Will it keep my hook and CTA?', a: 'The opening line and call-to-action survive as ideas; their wording gets the human treatment. Hooks usually get sharper.' },
      { q: 'Any length limits?', a: '300 words per free run — most posts fit. Long thought-pieces can be split.' },
    ],
    related: ['/ai-humanizer', '/ai-detector-for-linkedin-posts', '/word-counter'],
  },
  {
    slug: 'humanize-ai-papers',
    h1: 'Humanize AI Academic Papers',
    tool: 'humanize',
    audience: 'Literature reviews and discussion sections in full academic register — terminology intact, machine cadence gone.',
    faqs: [
      { q: 'Does it work on abstracts?', a: 'Yes, and abstracts benefit most — they are the most detector-scrutinized 200 words in academia.' },
      { q: 'Is humanizing academic work ethical?', a: 'If your institution prohibits AI-generated submissions, editing the text does not change that rule. Use for legitimate drafting within your institution\u2019s policy, and verify citations yourself.' },
    ],
    related: ['/ai-humanizer', '/ai-detector-for-dissertations', '/humanize-ai-essays'],
  },
  {
    slug: 'humanize-ai-assignments',
    h1: 'Humanize AI Assignments',
    tool: 'humanize',
    audience: 'Assignment drafts that keep the rubric\u2019s required content while losing the tells that made your TA suspicious.',
    faqs: [
      { q: 'Is this the same as the AI detector?', a: 'No — the detector measures; the humanizer rewrites. The loop is: check with the detector, humanize what flags, re-check to confirm.' },
      { q: 'Will my grade survive?', a: 'The rewrite preserves content, but grades come from your instructor and your institution\u2019s AI policy. Use within the rules that apply to you.' },
    ],
    related: ['/ai-humanizer', '/ai-detector-for-homework', '/humanize-ai-essays'],
  },
  {
    slug: 'humanize-ai-resumes',
    h1: 'Humanize AI Resumes',
    tool: 'humanize',
    audience: 'Summary lines and bullet points that sound like a career, not a chatbot — keep every metric, lose the template cadence.',
    faqs: [
      { q: 'Will ATS parsing still work?', a: 'Yes — the rewrite changes prose, not formatting or keywords. Your job titles and skills stay intact.' },
      { q: 'Which parts of a resume need it most?', a: 'The summary and any paragraph-style bullets. Pure metric bullets ("Grew X by 12%") are already human-shaped.' },
    ],
    related: ['/ai-humanizer', '/ai-detector-for-resumes', '/humanize-ai-cover-letters'],
  },
  {
    slug: 'humanize-ai-content',
    h1: 'Humanize AI Content',
    tool: 'humanize',
    audience: 'For agencies and site owners shipping volume — every piece gets the same treatment: facts locked, rhythm varied, score verified.',
    faqs: [
      { q: 'Can I process content at scale?', a: 'Batch detection is unlimited in your browser today; batch humanizing arrives with Pro. For now, run section by section — three free rewrites daily.' },
      { q: 'What quality checks should I keep?', a: 'Always run the before/after score, then a human read of the intro. Automation catches patterns; only you catch context.' },
    ],
    related: ['/ai-humanizer', '/ai-detector-for-seo-content', '/humanize-ai-blogs'],
  },
];
