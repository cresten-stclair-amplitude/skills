---
name: technical-writing
description: Write or revise technical documentation for engineers, including architecture guides, design proposals, RFCs, procedures, reference documentation, and technical explanations. Use for direct, concise, source-grounded prose, clear system flow, component ownership, and precise diagrams. Choose the document structure for the task; do not force an RFC format or marketing presentation.
---

# Technical Writing

Write for the reader's task and existing knowledge. Use direct, dense, precise prose: explain the system, decision, contract, or procedure without selling it. Preserve the user's requested format, destination, and emphasis.

## Choose the structure for the task

Identify what the reader needs to understand, decide, or do. Use the user's structure or the repository's established document convention. Otherwise choose a structure that fits the content:

| Document | Useful progression |
| --- | --- |
| Architecture guide | High-level flow, system boundaries, components and interactions, important constraints. |
| Design proposal or RFC | Proposal, problem and constraints, design, trade-offs, adoption, unresolved decisions. For an RFC, read [references/rfc.md](references/rfc.md). |
| Procedure | Intended outcome, prerequisites, ordered actions, expected results, relevant failure handling. |
| Reference | Contract or scope, fields/interfaces, behavior, examples, limits. |
| Investigation or technical decision | Finding or decision first, supporting evidence, causal explanation, consequences and remaining uncertainty. |

These are options, not mandatory section lists. A short explanation may need only paragraphs. Do not add RFC metadata, alternatives, rollout plans, or an unresolved-questions section to unrelated documents. Use a literal subject title; append `RFC` only when writing an RFC.

For HTML output, read [references/html.md](references/html.md) and adapt [assets/document.html](assets/document.html). The HTML shell supplies presentation, not a required document outline.

## Put the essential explanation first

Lead with the answer, result, action, or high-level process the reader needs. For a system or process document, show its natural end-to-end flow before component details. Identify the source, the reader or trigger, transformations, execution, and observation. Distinguish configuration generation, background reconciliation, and explicit requests when that distinction matters.

If the user asks for an overview or flow first, make it the first substantive content after the title and necessary metadata. Do not bury it under background, motivation, or Detailed design. Make the navigation order match the reading order, and verify that the opening view shows it.

Follow the overview with the details needed to interpret it. For architecture documents, place the boundaries diagram near the flow, then describe the corresponding components. Explain each component's responsibility, inputs, outputs, interfaces, and ownership of state or policy. Keep familiar components brief; give important adapters, transformations, and design decisions enough detail to review.

## Ground claims and trace interactions

Read the request, linked material, and relevant source/configuration. Use the user's latest decisions to define proposed behavior and the source to verify existing names, interfaces, and excerpts. State uncertainty or unresolved design choices where they affect the explanation. Do not silently substitute the current implementation for a requested future design.

Name who calls whom, through which interface, and what is returned or changed. Separate desired configuration, execution requests, and observed results. Do not insert an intermediary merely because it appears elsewhere in the system. When an interaction changes, update the overview, diagrams, component text, and examples together.

Use short, verified configuration or code excerpts when they explain a mechanism. Identify omitted context, temporary switches, and illustrative examples. Do not invent API fields or present proposed code as an existing implementation. Put source links beside the claims they support; avoid an evidence catalog unless the task needs one.

An architecture guide should describe the architecture. Include implementation status, recovery procedures, or exhaustive state tables only when they serve the requested document. For a procedure or operational reference, include the conditions and failure behavior needed to execute it correctly.

## Write precisely

Use concrete subjects and verbs: “The controller reads the policy and creates a configuration for each service.” Use literal headings such as `Inputs`, `Ownership`, or `Failure behavior`. Avoid slogans, rhetorical questions, benefit claims, sales language, and decorative conclusions.

Explain mechanisms and consequences rather than asserting that something is simple, robust, seamless, or powerful. A claimed guarantee needs an enforcement mechanism. A successful request is not evidence that its downstream effect has completed.

Remove repetition and unnecessary background. Use tables for comparisons or mappings, numbered steps for ordered work, and paragraphs for connected explanation. Keep prose grammatical even when chat uses compressed shorthand. Concision removes unnecessary information, not words needed to understand causality. There is no fixed word count.

## Diagrams and presentation

Use diagrams when they clarify relationships or sequence. Prefer editable Mermaid for system and interaction diagrams; preserve the source. Label arrows with operations or data exchanged, and use boundaries for actual ownership or execution boundaries. Add a sequence diagram when ordering is material; do not diagram every paragraph.

Keep presentation subordinate to the text. For technical HTML, use restrained typography, compact spacing, ordinary headings, and readable code blocks. Avoid hero sections, taglines, presentation cards, decorative badges, and oversized type. Respect an explicit user template or visual requirement.

## Verify and deliver

Check that the opening explanation, diagram arrows, component descriptions, and examples agree. Verify claims and excerpts against their sources, and check that references resolve. For procedures, verify prerequisites, order, and observable outcomes at the level authorized by the task.

Render HTML and inspect the opening view, diagrams, narrow-screen layout, and print behavior. Check navigation, clipping, source/render consistency, and unintended network dependencies. Report the actual artifact and validation performed. Follow existing publication instructions; writing a document does not itself authorize implementing its proposal, operating infrastructure, or sending messages.
