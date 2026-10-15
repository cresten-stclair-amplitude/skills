# skills

Skills for code design and review, domain-driven design, and technical RFC writing with Claude Code and Codex.

| Skill | Use when |
|-------|----------|
| [write-rfc](write-rfc/SKILL.md) | Engineering RFCs — concise technical prose, end-to-end flow, component ownership, Mermaid diagrams, and an HTML template |
| [writing-clean-code](writing-clean-code/SKILL.md) | Writing new code — SOLID, dependency injection, naming, pattern selection |
| [adversarial-review](adversarial-review/SKILL.md) | Reviewing existing code — multi-agent smell hunt with adversarial verification |
| [domain-driven-design](domain-driven-design/SKILL.md) | Codex domain modeling — sequential subagents from discovery and strategic design through tactical modeling, adversarial skepticism, and parent reconciliation |

`domain-driven-design` supports greenfield and existing systems. Each phase builds on accepted upstream conclusions and can challenge them with new evidence. It uses ordinary Codex runtime subagents, requires no custom agent installation, and treats “no DDD abstraction needed” as a valid outcome.

## adversarial-review at a glance

Diff-agnostic: reviews a PR, a branch diff, staged changes, a commit range, a pasted diff, or plain files/directories — every mode reduces to the same review set.

```
review set ──▶ 9 hunters (blind, parallel within capacity) ──▶ merge + dedup ──▶ finding-skeptic ──▶ report
```

- Five hunters cover the [refactoring.guru smell families](https://refactoring.guru/refactoring/smells) (Bloaters, OO Abusers, Change Preventers, Dispensables, Couplers); `clean-code-reviewer` covers SOLID. Three dedicated hunters cover [function clarity](adversarial-review/agents/function-clarity-hunter.md), [module architecture](adversarial-review/agents/module-architecture-hunter.md), and [function flow](adversarial-review/agents/function-flow-hunter.md).
- Every smell has a C# and a pseudocode example in `adversarial-review/references/smells-*.md`.
- Every finding needs file:line + quoted evidence + a harm scenario. The skeptic attempts evidence-based disproof while retaining supported maintenance findings; unresolved evidence and incomplete hunter coverage stay visible. Design rationale and sources: [prior-art.md](adversarial-review/references/prior-art.md).

## Clean code documents

- [Function and implementation clarity](adversarial-review/references/clean-code-functions.md): descriptive names, honest return contracts, readable conditions, comments, and explicit effects.
- [Module architecture](adversarial-review/references/clean-code-modules.md): cohesive responsibilities, representation boundaries, validation ownership, and public contracts.
- [Function flow](adversarial-review/references/clean-code-function-flow.md): one level of iteration per function, meaningful extraction, and understandable composition.

## Install

Claude Code skills (writing and review):

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

Codex skill (run from the cloned repository root):

```bash
mkdir -p ~/.agents/skills
ln -s "$PWD/domain-driven-design" ~/.agents/skills/domain-driven-design
```

Invoke `$domain-driven-design` for substantive DDD work in a Codex session with subagents available.

Invoke `$write-rfc` to draft or revise an engineering RFC from an issue and its source material. It includes an HTML shell; other requested formats and repository templates take precedence.

## Layout

```
write-rfc/
  SKILL.md                 # RFC structure, flow, component design, technical prose
  agents/openai.yaml       # Codex discovery metadata
  assets/rfc.html          # standalone HTML shell
  references/html.md       # rendering and Mermaid verification
writing-clean-code/
  SKILL.md                 # core discipline, links out
  references/              # solid, dependency-injection, clean-code-rules, design-patterns
adversarial-review/
  SKILL.md                 # the pipeline: scope → hunt → dedup → skeptic → report
  agents/                  # 10 roles: 5 smell hunters, SOLID, 3 clean-code hunters, skeptic
  references/              # smell catalogs (code + pseudocode), SOLID violations,
                           # scope-collection, refactoring-techniques, prior-art
domain-driven-design/
  SKILL.md                 # sequential Codex orchestration, skeptic, reconciliation
  references/              # strategic and tactical phase contracts with source grounding
```
