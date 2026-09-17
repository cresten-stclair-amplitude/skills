# skills

Claude Code skills for writing and reviewing clean code.

| Skill | Use when |
|-------|----------|
| [writing-clean-code](writing-clean-code/SKILL.md) | Writing new code — SOLID, dependency injection, naming, pattern selection |
| [adversarial-review](adversarial-review/SKILL.md) | Reviewing existing code — multi-agent smell hunt with adversarial verification |

## adversarial-review at a glance

Diff-agnostic: reviews a PR, a branch diff, staged changes, a commit range, a pasted diff, or plain files/directories — every mode reduces to the same review set.

```
review set ──▶ 6 hunters (blind, parallel) ──▶ merge + dedup ──▶ finding-skeptic (kill mandate) ──▶ report
```

- Five hunters cover the [refactoring.guru smell families](https://refactoring.guru/refactoring/smells) (Bloaters, OO Abusers, Change Preventers, Dispensables, Couplers); a sixth, `clean-code-reviewer`, covers SOLID.
- Every smell has a C# and a pseudocode example in `adversarial-review/references/smells-*.md`.
- Every finding needs file:line + quoted evidence + a harm scenario, and must survive a skeptic agent whose job is to refute it. Design rationale and sources: [prior-art.md](adversarial-review/references/prior-art.md).

## Clean code documents

- [Function and implementation clarity](adversarial-review/references/clean-code-functions.md): descriptive names, honest return contracts, readable conditions, comments, and explicit effects.
- [Module architecture](adversarial-review/references/clean-code-modules.md): cohesive responsibilities, representation boundaries, validation ownership, and public contracts.
- [Function flow](adversarial-review/references/clean-code-function-flow.md): one level of iteration per function, meaningful extraction, and understandable composition.

## Install

Skills (both):

```bash
git clone <this repo>
ln -s "$PWD/skills/writing-clean-code" ~/.claude/skills/writing-clean-code
ln -s "$PWD/skills/adversarial-review" ~/.claude/skills/adversarial-review
```

Optional — use the reviewer agents standalone (`@agent-bloater-hunter`, `@agent-clean-code-reviewer`, ...):

```bash
for f in skills/adversarial-review/agents/*.md; do
  ln -s "$PWD/$f" ~/.claude/agents/"$(basename "$f")"
done
```

The adversarial-review skill does not require the standalone install; its orchestrator spawns the roles as subagents directly from the `agents/` files.

## Layout

```
writing-clean-code/
  SKILL.md                 # core discipline, links out
  references/              # solid, dependency-injection, clean-code-rules, design-patterns
adversarial-review/
  SKILL.md                 # the pipeline: scope → hunt → dedup → skeptic → report
  agents/                  # 7 roles: 5 smell hunters, clean-code-reviewer (SOLID), finding-skeptic
  references/              # smell catalogs (code + pseudocode), SOLID violations,
                           # scope-collection, refactoring-techniques, prior-art
```
