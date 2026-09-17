# Clean Code at the Module Level

A clean module gives related behavior a clear owner and exposes a small, understandable contract. A reader can identify what the module knows, which decisions it makes, and which details its callers do not need to know.

A module may be a file, a group of functions, or a cohesive package. Good architecture does not require classes, interfaces, dependency-injection containers, or many files. Functions can own policy and hide representations just as effectively. Moving code into more files does not, by itself, improve the design.

[Function-level clarity](clean-code-functions.md) makes individual operations understandable. [Function flow](clean-code-function-flow.md) makes their composition understandable. Module architecture determines whether those operations belong together and whether changes stay within the right boundary.

## Organize around responsibilities that change together

A useful module has a coherent purpose: parsing an input format, calculating a business decision, maintaining a domain history, or adapting an operation to a command-line interface. Several functions can serve one responsibility. One function can violate several responsibilities.

The practical question is which changes should require editing the module. Consider an order-processing script:

| Concern | Example reason to change | Information it owns |
|---|---|---|
| Input parsing | An order-file column changes | File syntax and conversion rules |
| Fulfillment policy | A shipping restriction changes | Eligibility and selection rules |
| Reservation state | Inventory reservation behavior changes | State transitions and invariants |
| CLI adapter | Arguments or output format change | Process, files, stdout, and exit behavior |

These are possible logical boundaries, not a requirement to create four files. In a small script, named functions in one file may provide enough separation. Split files when it makes ownership or use clearer, not to satisfy a directory diagram.

A claim that something "does too much" should identify the distinct responsibilities and their consequences. For example, changing a file format should not require rewriting stock eligibility. A function name containing `and` is a useful prompt for inspection, not proof of a design violation.

## Keep external representation at the boundary

Policy should operate on the data it needs. If an eligibility function accepts an entire configuration-file string and parses it internally, file syntax has become a policy dependency. Testing one decision now requires manufacturing a valid file.

Prefer an explicit flow:

```text
Read external input
Parse and validate its representation
Apply the business operation to domain values
Format or persist the result
```

The parsing boundary can return ordinary objects. A schema library, domain class, or repository abstraction is optional; introduce one only when it solves a present problem.

Keeping filesystem calls in `main` is a good start, but it is not the whole boundary. A pure function can still mix syntax parsing with policy. Conversely, a top-level coordinator is allowed to call parsers, policy functions, and writers: composition is its responsibility. The problem appears when it implements those details inline or forces lower-level functions to know about the process environment.

Dependencies should be visible in inputs. Give policy the current time, necessary settings, or required domain records when those values affect its decision. Default values can be provided at a deliberate boundary. Avoid hidden reads of global state that make the same apparent input produce different results.

## Give validation an owner

Validation should happen where data enters a trusted contract. Parse CLI arguments at the CLI boundary. Validate a public API's inputs at that API boundary. Keep business invariants near the behavior that maintains them.

Repeated checks are not automatically wrong. Two independently callable public entry points may both need validation. Two checks on the same uninterrupted path, with no possible intervening invalidation, may be a redundant obligation. Before removing one, establish how callers reach the function.

Use an explicit ownership model:

| Boundary | What it establishes | Downstream assumption |
|---|---|---|
| CLI argument parser | Recognized operation and region | Internal coordinator receives a valid request |
| File parser | Expected syntax and required fields | Policy receives normalized records |
| Domain update | Valid state transition | Stored state continues to satisfy its invariants |

Avoid simultaneously claiming that a helper trusts validated input and exporting it as an unqualified public entry point. Either keep it internal with a documented precondition, or validate its public contract. Shared validation code can keep a rule consistent without requiring every internal function to repeat the check.

An absent value may be legitimate domain information. Do not erase it by inventing a default that changes the decision. Distinguish malformed input from a valid record whose optional information is unknown.

## Encapsulate decisions and representations

A boundary is weak when callers must know the module's internal array positions, configuration paths, sentinel values, or update order. They are then coupled to the implementation despite calling a named function.

For example, a consumer should not need to know that the second element of an intermediate parser tuple is an item count. A policy consumer should not need to know the nesting of a raw file representation merely to ask for a shipping decision.

Encapsulation does not mean wrapping every property access in a getter. Ordinary named records are often the clearest contract. Hide details when they create a repeated obligation or prevent one concern from changing independently.

Keep shared policy authoritative. If several modules independently list the same supported product categories, adding a category requires coordinated edits. A single registry may help. However, preserving separate workflows or independently deployed components can be intentional. Share the actual policy where appropriate without turning every similar sequence into a generic execution framework.

## Separate different policies without manufacturing a framework

Generality becomes harmful when an operation accepts a mode and then repeatedly asks what that mode means. Several `mode === ...` branches spread across parsing, selection, and updating force readers to reconstruct multiple behaviors at once.

Prefer one visible dispatch point when the modes represent meaningfully different operations. Each operation should receive the inputs it needs and call shared lower-level rules where the rules really are shared.

A small stable switch at a boundary is often clearer than a class hierarchy or plugin registry. A configuration table is appropriate for differences that are genuinely data. Neither should hide distinct algorithms behind a pile of flags and optional fields.

The useful test is concrete: when one policy changes, can it be changed and verified without untangling unrelated policies? If the answer is already yes, more abstraction may add navigation without improving ownership.

## Own state transitions explicitly

State-changing operations should own a complete domain transition. Callers should not have to remember a secret sequence of deleting old entries, inserting new entries, changing summary fields, and resetting flags.

Choose a clear contract: calculate a new state, or update a specified state in place. Document the mutation target and preserve invariants such as unchanged records keeping their metadata. If a failure can occur after partial mutation, make the recovery or atomicity requirement explicit.

Avoid splitting a single invariant across unrelated helpers. For example, updating reserved stock and its reservation ledger belongs under one coherent operation, even if that operation delegates the arithmetic and record construction. A reusable arithmetic helper should not unexpectedly write the ledger.

I/O belongs at a deliberate boundary. Domain code can calculate an updated record; the adapter persists it. A coordinator may own the transaction or atomic write when needed. The architecture should make that ownership visible without forcing a heavyweight persistence layer into a small script.

## Use a small, intentional public surface

Export operations that callers need. Exporting every helper turns implementation choices into apparent public contracts and makes later cleanup harder. A test needing a helper is a reason to examine its boundary, not automatic justification for publishing all internals.

Good public operations can be tested with meaningful domain inputs and outputs. They should not require a full process, network, or filesystem setup to exercise a small policy decision. Boundary tests still matter for parsing and I/O, but they answer different questions.

Testability is evidence of separation, not a reason to create an interface for every function. Passing existing tests proves only the properties those tests check. It does not prove names are honest, responsibilities are cohesive, or callers are insulated from representation details.

## What coherent architecture looks like

1. Each module has an identifiable purpose and owns the rules that change for that purpose.
2. Parsing, policy, state changes, and I/O have visible contracts, even when they share a file.
3. Validation and invariants have deliberate owners, with independently callable boundaries accounted for.
4. Callers depend on named operations and meaningful values rather than internal layouts or hidden call order.
5. A concrete policy or representation change can be made without unrelated edits or a new framework.

Architecture improves when fewer hidden facts cross boundaries. File count, class count, and pattern count do not measure that improvement.
