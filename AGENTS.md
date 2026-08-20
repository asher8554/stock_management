# AGENTS.md

## Context Compaction Recovery

When this thread resumes after context compaction, summary replacement, context transition, or interrupted work, immediately load `$caveman` from `C:\Users\asher\.codex\skills\caveman\SKILL.md`, invoke `$caveman ultra`, load `$ponytail:ponytail` from `C:\Users\asher\.codex\plugins\cache\ponytail\ponytail\4.9.0\skills\ponytail\SKILL.md`, and invoke `$ponytail ultra`, before progress updates, planning, file reads, edits, validation, or final response. Do not treat a summary saying these modes were active as enough; reload and re-apply them after compression. No plain `$caveman` or `$ponytail` fallback.

Until the user says `stop caveman` or `normal mode`, every progress update and final response must stay in ultra mode: short fragments, no filler, no long rationale. Treat long explanatory status messages as a recovery-rule violation unless normal clear prose is required for safety or precision.

Until the user says `stop ponytail` or `normal mode`, keep `$ponytail ultra` active: shortest safe path, deletion over addition, stdlib/native/existing code before new code or dependencies, no speculative features.

Use English as the internal working language for analysis, scratch planning, command reasoning, and implementation notes. Do not expose private chain-of-thought. Final user-facing result must be Korean only, except paths, code, commands, package names, error strings, and quoted file content. Re-read and re-apply this language policy after every context compaction together with `$caveman ultra` and `$ponytail ultra`.

After invoking `$caveman ultra` and `$ponytail ultra`, read the newest user request, the available summary, `checklist.md`, and `context-notes.md`. Continue the active task from the latest verified state instead of restarting from scratch.

Use normal clear prose when compression could cause ambiguity, especially for security warnings, irreversible operations, multi-step instructions, code, commands, generated files, validation errors, and user interview questions. Resume `$caveman ultra` for concise conversational updates after those clear sections unless the user says `stop caveman` or `normal mode`.

For non-trivial work, keep `plan.md`, `checklist.md`, and `context-notes.md` current. Record decisions, assumptions, verification results, and resume-critical details before long operations or final response.

## Language Policy

Use English as the internal working language for analysis, scratch planning, search terms, command reasoning, and implementation notes unless the user explicitly asks otherwise.

Do not expose private chain-of-thought. If reasoning must be summarized for the user, summarize briefly in Korean.

Final user-facing result must be Korean only. Paths, code, commands, package names, error strings, and quoted file content may remain in their original language.

After context compaction, summary replacement, context transition, or interrupted work, re-read and re-apply this language policy together with `$caveman ultra` and `$ponytail ultra` before continuing work.
