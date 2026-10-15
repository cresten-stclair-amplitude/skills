---
name: write-rfc
description: Write or revise technical RFCs for engineering peer review, including architecture proposals and component design documents. Use for concise, source-grounded design prose, explicit system interactions, and editable Mermaid diagrams; produce HTML when requested. Not for marketing pages, project status reports, or operational runbooks.
---

# Write RFC

Write for coworkers who understand the domain and need to evaluate the design. The deliverable is a technical proposal: direct, dense, and precise. Explain the system as a whole before describing its parts.

## Establish scope and evidence

Read the request, linked issue, and relevant source/configuration. Use the user's latest design decisions to define the proposal; use source material to verify existing names, interfaces, and excerpts. Do not silently substitute current implementation for the requested future architecture.

Separate established facts, proposed choices, and unresolved decisions in the wording where they matter. Do not turn an architecture RFC into an implemented/unimplemented inventory. Keep familiar prerequisites brief; spend detail on ownership, integration boundaries, non-obvious mechanisms, and decisions reviewers need to assess.

Preserve the requested format and destination. An RFC request does not authorize implementing the design, operating infrastructure, or sending review messages. Follow the session's existing publication and repository instructions.

## Use an RFC template

Use the user's template or the repository's established RFC format. Otherwise use this structure, adapted from the [React RFC template](https://github.com/reactjs/rfcs/blob/main/0000-template.md):

| Section | Content |
| --- | --- |
| Metadata | Literal project title followed by `RFC`; known author, date, status, issue, and review link. Omit unknown fields. |
| Summary | One short paragraph stating the proposed change and main responsibilities. |
| Motivation | The technical problem, constraints, and required behavior. |
| Detailed design | High-level flow, system boundaries, component responsibilities, interactions, and important mechanisms. |
| Drawbacks | Concrete costs and limitations of this design. |
| Alternatives | Plausible alternatives and the trade-offs that determine the choice. |
| Adoption strategy | Compatibility and transition steps relevant to adopting the design. |
| Unresolved questions | Decisions that still need an answer; omit if there are none. |

Omit inapplicable sections; do not invent material to fill a template. Add API examples or other sections only when the proposal needs them. Credit the template used. For HTML, read [references/html.md](references/html.md) and adapt [assets/rfc.html](assets/rfc.html).

## Explain flow, then components

Start Detailed design with the natural end-to-end flow in a short paragraph or numbered sequence. Identify the configuration source, the component that reads it, any generation or transformation, the component that executes the action, and the system that reports the result. Distinguish background reconciliation from an operator-triggered request when both exist.

For architecture proposals, place the system-boundaries diagram next, followed immediately by the corresponding component descriptions. Use the same names throughout. For each component, explain its responsibility, inputs, outputs, interfaces, and ownership of state or policy. Do not force every component into a long questionnaire: a simple component may need one paragraph, while a central adapter or renderer may need several subsections.

Trace important interactions precisely. State who calls whom, through which interface, and what is returned or changed. Separate desired configuration, execution requests, and observed results. Do not insert an intermediary merely because it appears elsewhere in the system. When the user corrects a path, update prose, diagrams, examples, and summaries together.

Use Mermaid for architecture and sequence diagrams. Label arrows with operations or data exchanged; use boundaries for real ownership or execution boundaries. Preserve editable `.mmd` source. Add a sequence diagram when ordering or reconciliation is central to a design decision, rather than duplicating every diagram in multiple forms.

Include short, verified configuration or code excerpts where they explain a mechanism. Identify omitted context and temporary migration switches. Do not invent API fields or present an illustrative snippet as existing code. Put source links near the relevant component; avoid a large evidence catalog unless requested.

## Edit for technical density

Use literal headings such as `Inputs`, `Rendering and ownership`, or `Failure behavior`. State concrete behavior with a named subject and verb: “The controller reads the policy and renders one child configuration per service.” Avoid slogans such as “From configuration to production,” rhetorical questions, benefit claims, and promotional conclusions.

Describe what changes, why the mechanism is necessary, and its consequences. Explain failure, authorization, or recovery behavior when it affects the design; do not append an exhaustive operating manual. Avoid repeating the same mechanism in the summary, component text, examples, and a closing recap.

Keep persisted prose grammatical, even when chat uses compressed shorthand. Short means removing unnecessary information, not removing words needed to understand causality. There is no fixed word count: allocate detail according to the review decisions.

## Verify and deliver

Check that the overview, arrows, component descriptions, and examples describe the same architecture. Every important action needs an explicit caller and owner; every proposed guarantee needs a mechanism. A request being accepted is not evidence that a downstream change has taken effect.

For HTML, render and inspect the page and diagrams, including narrow-screen and print behavior. Verify navigation, source/render consistency, and absence of clipping or accidental runtime dependencies. Report the artifact and the checks actually performed; keep implementation status and review logistics out of the design unless requested.
