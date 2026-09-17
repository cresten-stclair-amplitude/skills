# Clean Code at the Function and Implementation Level

Clean code makes a function's purpose, inputs, result, and effects understandable without reconstructing its implementation. Small mistakes in naming, return values, conditions, and comments accumulate: the caller must remember hidden facts, and the next edit becomes harder to reason about.

A function being short, documented, or covered by tests does not establish that its contract is clear. A ten-line function can hide several decisions. A longer function can be straightforward. Length is a useful signal, but responsibility and cognitive load determine whether a reader can work safely.

This document covers individual functions and expressions. [Module architecture](clean-code-modules.md) covers ownership and boundaries. [Function flow](clean-code-function-flow.md) covers composition and nesting. Examples are illustrative fragments, not a complete application.

## Names must describe the operation

A function name should describe what calling it does. Use an operation and the relevant domain concept. A noun such as `quantity` does not tell the reader whether the function parses, validates, calculates, retrieves, or changes a quantity.

| Vague name | Actual operation | Descriptive name |
|---|---|---|
| `quantity(value)` | Reject invalid counts and return the valid count | `validateItemCount(value)` |
| `items(text)` | Parse line items from text | `parseOrderLines(text)` |
| `enough(item, count)` | Check available inventory | `hasEnoughStock(item, count)` |
| `handle(order)` | Build shipping instructions without changing inventory | `createFulfillmentPlan(order)` |

Use verbs for ordinary functions. Noun names belong naturally to values and types, and may fit constructors under the language's conventions. They should not hide parsing, validation, or mutation.

The reader should not need a docstring to discover which of those operations occurs. Documentation can explain the contract's details; it cannot repair a misleading name at every call site. Prefer one consistent term per concept, and distinguish different concepts instead of giving them the same generic name.

Names also need enough context. `valid`, `old`, `ready`, `data`, and `result` may be clear in a tiny local expression, but become ambiguous when several rules or representations are present. `availableStock`, `requestedCount`, and `parsedOrderLines` identify the relevant roles. Do not add words that merely repeat the type or surrounding context.

## A return value must fulfill the name's promise

Predicate names such as `is...`, `has...`, `can...`, and `should...` promise a boolean. Returning an object from a predicate creates a contract trap:

```js
function canShip(order) {
  const shipments = selectShipments(order);
  return { allowed: shipments.length > 0, shipments };
}
```

The object remains truthy even when `allowed` is false. An existing caller may correctly inspect `.allowed`; that does not remove the mismatch for the next caller. This is a maintenance hazard, not evidence that an existing caller already fails.

Choose the contract that the operation actually needs:

```js
function createFulfillmentPlan(order) {
  const shipments = selectShipments(order);
  return { canShip: shipments.length > 0, shipments };
}
```

If a caller needs only a yes/no answer, a separate `canShipOrder` predicate can return a boolean. Do not add a wrapper merely to increase the function count, or recalculate an expensive plan when its result is already available. A plan object containing related decision data is legitimate; hiding that object behind a predicate name is the problem.

Give every return path a coherent meaning. An empty collection should mean a known empty collection. `null` can mean an explicitly documented absence. Neither should silently stand for malformed input, unavailable data, and a normal negative result at once. Use a named result with a status or reason when callers actually need to distinguish those states. Do not introduce a result framework when one documented return type is sufficient.

## Make returned structures readable where they are built

Dense expressions can conceal both the result's shape and the work required to produce it:

```js
return [match[1], Number(match[2])];
```

What do positions zero and one mean? Is the second value a count, price, or identifier? Positional returns make readers inspect the consumer or remember a convention.

Prefer a named result for a domain operation:

```js
return {
  productCode: match.groups.productCode,
  requestedCount: Number(match.groups.requestedCount),
};
```

A two-element entry is appropriate at an `Object.fromEntries` boundary. A tuple, coordinate, or language-defined result can also have a familiar positional contract. The useful distinction is whether the positions are clear and confined to that boundary, or become an undocumented protocol passed between functions.

Name meaningful intermediate values when a return expression combines parsing, indexing, conversion, and assembly. Avoid both extremes: a single expression that requires mental execution, and several variables that merely rename the same value without adding meaning. Named capture groups or a small parser can make regular-expression results readable without replacing every array with a class.

## Keep conditions at one level of meaning

A condition becomes difficult when the reader must decode several unrelated decisions at once:

```js
if (!Number.isInteger(count) || count < 1 || count > remaining || blocked && !override) {
  return false;
}
```

This combines input validity, inventory capacity, and an authorization rule. Parentheses improve precedence visibility, but do not separate the responsibilities. Put validation at the owning boundary, then express the remaining policy in domain terms:

```js
const exceedsAvailableStock = requestedCount > availableStock;
const blockedWithoutOverride = customerBlocked && !hasShippingOverride;
return !exceedsAvailableStock && !blockedWithoutOverride;
```

Named booleans are enough when the rule is local. Extract a predicate when it names a stable concept or deserves independent use and verification. Names such as `firstCheck` and `passesRules` conceal the same problem behind another call.

Use guard clauses to keep the normal path shallow. Do not compress a guard, a complicated condition, and a consequential mutation into one line. Keep comparison boundaries visible: changing `>` to `>=` can alter the policy even when the refactor looks cosmetic.

## Comments explain contracts and reasons

Documentation should explain what a caller cannot safely infer from the signature. For a nontrivial function, that usually includes its input meaning, result shape, mutation or I/O, and important failure or absence behavior. Include units and special values where relevant.

When a project requires documentation on every function, apply that requirement to private helpers too. A helper being small does not waive an explicit documentation standard. Elsewhere, an obvious local function may need no docstring.

Comments inside a function should explain a business rule, guard, ordering constraint, or surprising choice:

```js
// An unknown stock count cannot authorize a shipment.
if (availableStock === null) return false;
```

That states why missing information blocks the operation. `// Return false if null` only repeats the syntax. If the project requires a short comment for each guard clause, provide one that states the guard's reason.

Function-level documentation and local rationale solve different problems. A complete docstring does not necessarily explain why a particular branch treats absence differently from invalid input. Conversely, do not claim documentation is missing when it already exists: identify the precise unanswered question.

Avoid using comments to narrate a long block that deserves a named operation. Fix the structure first, then retain comments that explain policy the structure cannot express. Descriptive names and useful comments reinforce one another.

## Give patterns and constants semantic names

A regular expression is executable parsing policy. A variable named `pattern` tells the reader almost nothing about what is accepted. Prefer names such as `ORDER_LINE_PATTERN`, with a short explanation of any non-obvious grammar constraint.

Keep invariant patterns and domain constants in a visible, appropriate scope. A pattern depending on arguments needs a clearly named builder or parameterized matcher; it cannot be hoisted unchanged into a single constant. Avoid sharing a stateful global regular-expression instance across calls unless its state is deliberately managed.

Name units and sentinels. `priceInCents` is clearer than `price` where dollars and cents coexist. A sentinel such as `-1` needs one authoritative meaning and a validation rule. Do not replace a meaningful distinction between absent, invalid, disabled, and zero with a generic falsy check.

## Make input relationships and effects explicit

Adjacent same-type arguments are easy to exchange. Before/after snapshots, source/target identifiers, and minimum/maximum bounds often benefit from named inputs:

```js
compareInventory({ previousInventory, currentInventory });
```

A parameter object should express a cohesive operation. It should not become a bag containing every local variable from the caller. Passing an entire application context to avoid a long signature usually hides dependencies instead of reducing them.

When an input must satisfy a domain invariant, prefer accepting a type whose construction validates it. `ItemCount` or `OrderId` communicates both meaning and the guarantee the function may rely on. The [module architecture guidance](clean-code-modules.md#give-validation-an-owner) explains validating constructors and restricted construction in languages such as Go.

Distinguish a query from a command. `calculateReservation` should return a result without changing inventory; `reserveStock` makes mutation part of its promise. Returning the same object that a function mutates can look like a pure transformation. Prefer an explicit in-place command or a new calculated value, and document any intentional combined contract.

Do not infer a defect from mutation alone. A documented update operation can be appropriate. The concern is whether the caller can predict the effects, whether ignored return values hide the actual contract, and whether failure can leave a partially changed object.

## What understandable implementation looks like

A reader should be able to answer these questions without tracing unrelated helpers:

1. What operation occurs, and does its name predict the result and effects?
2. What do each input, intermediate value, return field, unit, and absence state mean?
3. Which rule does each condition enforce, and why do unusual guards exist?
4. Does each expression express one understandable step rather than compress several decisions?
5. Can the function's contract be preserved while changing its internal implementation?

These are semantic concerns. Formatting and line length may reveal a problem, but the fix is to expose meaning, not merely rearrange whitespace.
