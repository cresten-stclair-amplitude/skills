# Clean Code Rules

## Function contracts

Name the operation and its domain meaning. Use `parseOrderLines`, `validateItemCount`, or `hasEnoughStock` rather than a noun hiding parsing or validation. Nouns suit values, types, and constructors under the language's conventions. Use consistent terminology, named units, and semantic names for patterns and constants. Dynamic patterns need named builders or matchers rather than an incorrectly shared constant.

Predicate names (`is`, `has`, `can`, `should`) promise booleans. A function returning a decision plus selected data should have a name such as `createFulfillmentPlan`. Preserve one coherent result contract across successful paths, with named fields and explicit absence behavior. An entry pair at `Object.fromEntries` is appropriate when its roles are clear; avoid passing unexplained positional records between domain operations.

Keep parsing, indexing, conversion, and result construction understandable. Use meaningful intermediate names or cohesive helpers for dense expressions. Split compound conditions along the business rules they express; preserve short-circuit behavior, units, and inclusive/exclusive comparisons. Parentheses alone do not name those rules.

Make effects explicit. A query should not unexpectedly mutate state or perform I/O. An update operation may intentionally mutate a documented target; returning that same object must not suggest a pure transformation. Prefer named inputs for easily swapped before/after or source/target values. A parameter object should describe one operation, not contain all of the caller's locals.

## Function flow

Functions should own complete subproblems at one level of abstraction. A coordinator names the domain steps; its helpers own their details. Extract a function when it removes a concept from its caller, even if it has only one caller. Do not create wrappers that merely add navigation.

**Keep iteration at most one level deep per function**, unless an explicit user/repository standard says otherwise. Count nested `for`/`while`, inline `map`/`filter`/`reduce` callbacks, and comprehensions. Two sequential loops are depth one. Do not count hidden library internals as additional source-level loops. A named helper may own an inner traversal when its input, result, and effects describe a complete subproblem.

Moving the inner loop into `processPartTwo(state)` is insufficient if `state` carries the outer index, flags, current item, and accumulator. Avoid closures that hide the same dependency. Keep complete decisions and state transitions under one owner instead of distributing a secret call order across helpers. Recursion and terse expressions should not conceal the original complexity.

Use guard clauses to keep the normal path visible and meaningful predicates for dense policy. Dispatch between different operations at a deliberate boundary instead of repeatedly checking a mode throughout the call chain. A stable dispatch switch can be appropriate; a class hierarchy is not required for it.

Use **80 physical lines as the default maximum** for a function, including the signature, internal comments/blanks, and closing line, excluding preceding documentation. Follow explicit user/repository overrides. Below that ceiling, mixed responsibilities and dense logic still need attention; shortening a function does not establish good structure. Extraction must preserve ordering, error behavior, mutation, and no-op semantics.

## Validated domain types and module boundaries

Types label data and intention. Prefer converting raw input into a domain representation whose construction establishes its invariants. Downstream operations should accept that representation and rely on its preserved guarantees. Checking a primitive and passing it around unchanged leaves the validation state implicit.

Where classes are available, prefer a small class with a validating constructor. Successful construction yields a valid instance; invalid input fails. Keep invariant-bearing state private and preferably immutable, or provide only operations that preserve validity. Protect retained mutable inputs and validate again when reconstructing values from serialized data. A cast, alias, or `validated` flag alone does not establish the guarantee.

Use the language's equivalent when appropriate. In Go, an unexported struct with unexported fields and an exported `New` or `NewItemCount` function can control ordinary construction by other packages. Handle errors and account for possible zero/nil values; naming a function `New` does not itself enforce validation, and built-in `new` does not validate. A constructor's structural guarantees do not prove changing external facts such as current inventory or permissions.

Give representation parsing, policy decisions, complete state transitions, and I/O explicit owners. These may be separate functions in one file. Pass policy the domain values it needs rather than file text, process state, or an entire configuration tree. Keep replaceable infrastructure at a deliberate boundary and provide time or other decision inputs explicitly when they affect behavior.

Independently callable entry points that accept raw input each establish the domain contract. Prefer having them construct the same validated type and share operations over it. Do not remove validation by assuming every caller goes through `main`. Limit exports to intended contracts, and keep shared policy authoritative without overriding requirements for separate workflows or components.

## Comments and documentation

Document nontrivial input meanings, return shapes, absence states, effects, units, and important failures. Follow explicit requirements for documentation on all functions, including private helpers. A clear name cannot replace a required contract comment; a docstring cannot repair a misleading name at every call site.

Explain why a guard, sentinel, ordering constraint, or surprising choice exists. If the project requires a short comment on each guard, provide its policy rationale. Otherwise an obvious local guard may need none. Do not replace useful rationale with an extraction merely because a comment exists.

| Keep | Improve or remove |
|---|---|
| Required function/API documentation | Comments that contradict behavior |
| Non-obvious guard and policy rationale | Restatements such as `// increment i` |
| Invariants, units, and consequences | Narrative hiding an incoherent block |
| Legal notices and actionable TODOs | Commented-out code and changelog entries |

## Errors and absence

Use the language's error conventions, including returned errors where idiomatic. Distinguish malformed data from known empty results, missing information, and disabled states. A documented `null` or optional value can represent absence; do not replace it with a fabricated default that changes policy. Handle failures at the boundary that owns recovery or reporting.

## Avoid mechanical cleanups

| Temptation | Better decision |
|---|---|
| Treat every `new` as hidden coupling | Construct validated domain values; inject replaceable service/I/O dependencies |
| Forbid validation in constructors | Establish invariants there; keep external I/O and long-running workflows out |
| Add an interface for every class | Introduce one for an actual substitutable dependency or consumer boundary |
| Declare short functions clean | Inspect their contracts, nesting, and responsibilities |
| Split until every function has only a few lines | Extract meaningful subproblems without shared parent bookkeeping |
