# Clean Code Across Function Boundaries

Clean function flow lets a reader understand a larger operation from a small number of meaningful steps. Each function owns a complete subproblem, receives the information needed for it, and returns or changes something its name makes predictable.

Splitting one large function into many small functions is not enough. If the pieces share hidden state, pass a bag of local variables, or depend on a secret execution order, the original large function still exists conceptually. It has merely become harder to see.

This document complements [function-level clarity](clean-code-functions.md) and [module architecture](clean-code-modules.md). The examples are illustrative; their helper names express the intended boundaries rather than a required framework.

## Keep iteration one level deep within each function

The standard here is **at most one level of iteration inside a function**. Two sequential loops do not violate that depth rule, although they may reveal separate responsibilities. A loop inside another loop does violate it.

Count iteration by meaning, not by the `for` keyword. An inline `map`, `filter`, `reduce`, `forEach`, `some`, or `every` callback that traverses a collection inside an outer traversal is nested iteration. Nested comprehensions have the same issue. Replacing the inner loop with `filter` does not reduce the depth.

```js
function calculateDepartmentTotals(departments) {
  const totals = {};
  for (const department of departments) {
    let total = 0;
    for (const purchase of department.purchases) {
      if (purchase.approved) total += purchase.amountInCents;
    }
    totals[department.id] = total;
  }
  return totals;
}
```

The outer traversal concerns departments; the inner traversal concerns purchases and approval policy. The function makes readers track both units of work at once. An outer `for` containing `department.purchases.filter(...).reduce(...)` still places purchase traversal inside department traversal.

`Object.keys(records)` materializes keys; it is not itself an inline callback body. Do not invent an extra source-level nesting count for every library implementation. The relevant concern is the repeated collection operation and the nested work the reader must understand. Likewise, do not expand the hidden internals of sorting into additional source-level loop depths.

Calling a named helper that scans one department's purchases is different when the helper owns that complete subproblem. The total algorithm still traverses two dimensions, but each function presents one understandable unit. This is an explicit readability standard, not a claim that every nested-loop algorithm is computationally wrong.

## Extract a complete subproblem

A useful boundary in the example is the approved purchase total for one department:

```js
/** Sum approved purchase amounts in cents for one collection. */
function sumApprovedPurchases(purchases) {
  let totalInCents = 0;
  for (const purchase of purchases) {
    // Unapproved purchases do not count toward departmental spending.
    if (!purchase.approved) continue;
    totalInCents += purchase.amountInCents;
  }
  return totalInCents;
}

/** Calculate each department's approved spending in cents. */
function calculateDepartmentTotals(departments) {
  const totalsByDepartment = {};
  for (const department of departments) {
    totalsByDepartment[department.id] = sumApprovedPurchases(department.purchases);
  }
  return totalsByDepartment;
}
```

Each function now has one traversal and a meaningful result. `sumApprovedPurchases` does not need the department index, the outer output object, or a callback that mutates its caller. Its behavior can be understood with one collection as input.

A function need not have multiple callers to deserve extraction. A single-use helper is valuable when it names a real subproblem and removes concepts from its caller. Equally, reuse alone does not make a vague helper a good abstraction.

## Recognize artificial decomposition

Names such as `processPartTwo`, `handleInnerLoop`, and `continueProcessing` describe placement rather than purpose. A helper with a signature like this still carries the parent function around:

```js
handleInnerLoop({ departments, index, totals, currentTotal, options, flags });
```

It knows the traversal mechanism, receives a shared accumulator, and depends on partially completed work. A reader must inspect both functions to understand either. Renaming it to a domain word does not solve those dependencies.

A complete extracted operation has a clear input, output or mutation target, and invariant. It can be explained without "first the caller must have set these three locals." It may depend on a documented precondition, but that precondition should describe meaningful domain state rather than the caller's temporary execution position.

Closures can be useful for small adapters. They become misleading when a supposedly independent helper silently reads and writes many outer variables. A parameter object can group related inputs; it should not be used to smuggle all of the parent's state across a boundary.

## Compose functions at one level of abstraction

An orchestration function should read as a sequence of domain steps:

```text
createInvoice
  validateInvoiceRequest
  calculateInvoiceLines
  calculateInvoiceTotal
  assembleInvoice
```

The coordinator expresses the operation. Its children own the detailed rules. It should not alternate between a high-level instruction and an inline regular expression, storage update, or deeply indexed record lookup.

Not every line needs a helper. Straightforward assignments, returning the result, and passing data between named operations are normal orchestration. A wrapper that merely forwards all arguments and introduces no useful contract adds a navigation step without removing a concept.

Keep call depth explainable. A reader may need to go deeper to understand tax arithmetic, but should not need six levels of generic `process` functions to learn which invoice lines qualify. There is no universal numeric call-depth limit here: look for repeated delegation, opaque names, and rules scattered across the chain.

## Keep each decision and invariant together

A subproblem can have several checks while still being one thing. A shipping-eligibility predicate may enforce stock availability and a destination restriction if those checks jointly answer one clear question. It should not also choose a carrier, mutate inventory, and print a message.

When selecting an item from a collection, make the roles distinct: determining whether one item qualifies, selecting among qualifying items, and coordinating selections for a larger operation. Do not force all three into one function just because their code fits on a screen.

Do not split one decision so aggressively that nobody owns it. If each tiny helper checks an arbitrary fragment of a compound expression, callers must reconstruct the rule. Keep a clear owner for the whole decision, with subordinate predicates only where they represent named concepts.

The same principle applies to mutation. A state transition should own the complete invariant it promises. Breaking it into `deleteEntries`, `insertEntry`, and `setFlag` calls is fragile if every caller must remember their order. A named transition can compose those details while preserving one external contract.

## Reduce branching without hiding it

Prefer early exits for invalid, unavailable, or irrelevant cases when that keeps the normal path visible. Each guard should express a clear condition, with a short explanation when its policy is not obvious or the project requires one.

Do not replace deeply nested `if` statements with an equally opaque expression containing ternaries, `&&`, and `||`. Named conditions and cohesive predicates expose the decision. They do not remove it.

Repeated mode checks are another form of hidden flow. If a function repeatedly asks whether it is operating in mode A or B, consider selecting the appropriate operation once and giving each operation its own inputs. Keep truly shared calculations shared. A small dispatch function is sufficient; a hierarchy or strategy framework is not automatically necessary.

Recursion and helper chains can also hide traversal or complexity. Treat them according to their actual contracts and algorithm. Replacing an inner loop with recursive calls solely to evade the one-level rule does not create a meaningful boundary.

## Preserve behavior while improving the flow

Extraction should preserve ordering, mutation, errors, and selection semantics. Moving code is not safe merely because each new function is shorter. Pay particular attention to the following:

1. Selection retains the same ordering, tie behavior, and empty-result meaning.
2. Comparisons preserve inclusive and exclusive boundaries and the treatment of unknown values.
3. State updates preserve no-op behavior, rollback behavior, and which object owns mutation.
4. Validation and exceptions remain at deliberate boundaries rather than disappearing during extraction.
5. Side effects occur at the same intended point and do not leak into predicates or calculations.

A structural refactor need not improve algorithmic complexity. Extracting a nested scan into a cohesive helper makes the code easier to understand but leaves the amount of work unchanged. An index or a one-pass algorithm may reduce repeated scanning, but that is a separate design choice with its own correctness obligations. Do not claim a performance defect from nesting alone without the relevant scale and evidence.

## What good composition looks like

The parent names the overall operation. Its children name complete subproblems. Each function contains at most one level of iteration, and callbacks do not conceal another level. Inputs and outputs describe domain values rather than the parent's local bookkeeping.

The decisive question is whether a reader can understand a function from its own contract and the contracts it calls. If understanding requires mentally stitching all of the function bodies back together, the decomposition has not achieved its purpose.
