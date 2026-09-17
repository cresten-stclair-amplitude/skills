---
name: writing-clean-code
description: Use when writing or structuring code to build clear function contracts, validated domain types, cohesive modules, and shallow function flow alongside SOLID and dependency-injection practices.
---

# Writing Clean Code

## Overview

Write code whose names, results, boundaries, and state guarantees are understandable at the call site. Apply this discipline to procedural scripts as well as classes. Prefer meaningful domain types, cohesive operations, and one level of iteration per function; use SOLID and patterns where they solve the current design problem.

## When to Use

- Writing functions, scripts, classes, methods, or features
- Structuring a new module or subsystem
- Deciding how objects should relate to each other
- Choosing between inheritance, composition, or delegation

**When NOT to use:** Reviewing existing code without implementation work (use `adversarial-review`, whose dedicated hunters cover function clarity, module architecture, function flow, SOLID, and smell families).

## The Five Qualities of Clean Code

1. **Obvious to other programmers** — clear naming, no magic numbers, no hidden side effects
2. **No duplication** — one change, one place
3. **Cohesive parts** — each function and type owns a meaningful contract
4. **Verified behavior** — appropriate checks pass; passing tests do not prove clear structure
5. **Cheap to maintain** — consequence of the above four

## Core Discipline

The one-line versions. Full explanations and code examples live in the references below.

| Principle | One-liner | Reference |
|-----------|-----------|-----------|
| **SRP** | Keep responsibilities that change together under one owner | [solid.md](references/solid.md) |
| **OCP** | Isolate variable policy when extending it would scatter changes | [solid.md](references/solid.md) |
| **LSP** | Any implementation swaps in without the caller knowing | [solid.md](references/solid.md) |
| **ISP** | No client depends on methods it doesn't use | [solid.md](references/solid.md) |
| **DIP** | Keep infrastructure dependencies outside domain policy | [solid.md](references/solid.md) |
| **DI** | Receive replaceable service dependencies; constructing domain values is allowed | [dependency-injection.md](references/dependency-injection.md) |
| **Function clarity** | Names predict operations, return shapes, and effects; comments explain contracts and guard rationale | [clean-code-rules.md](references/clean-code-rules.md#function-contracts) |
| **Module architecture** | Parse external input into validated domain types; give policy and transitions explicit owners | [clean-code-rules.md](references/clean-code-rules.md#validated-domain-types-and-module-boundaries) |
| **Function flow** | One level of iteration; extract complete subproblems instead of shared bookkeeping | [clean-code-rules.md](references/clean-code-rules.md#function-flow) |
| **Patterns** | Solve present problems, not imagined ones | [design-patterns.md](references/design-patterns.md) |

## References

- [references/solid.md](references/solid.md) — all five principles with WRONG/RIGHT code examples, plus when to create an interface
- [references/dependency-injection.md](references/dependency-injection.md) — the constructor-injection pattern, redundant coupling, constructor rules
- [references/clean-code-rules.md](references/clean-code-rules.md) — function contracts, module boundaries, validated representations, iteration and decomposition, comments, and error handling
- [references/design-patterns.md](references/design-patterns.md) — pattern selection tables and the inheritance-vs-composition flowchart

Read `clean-code-rules.md` for function or module implementation. Add the other references when their decisions apply; do not load every pattern for a small change. Apply explicit user/repository standards over these defaults. These instructions do not require a particular file layout or a review-agent run.

## Quick Self-Check Before Finishing

1. Do names predict each operation's return shape and effects, with meaningful fields, units, and absence states?
2. Do constructors or equivalent boundaries produce domain types that establish and preserve required invariants?
3. Are parsing, policy, state transitions, and I/O owned by cohesive operations with visible dependencies?
4. Is iteration at most one level per function, including inline callbacks, with each helper owning a complete subproblem?
5. Are required documentation and guard rationale present, and have relevant behavior and boundary checks passed?
