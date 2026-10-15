# RFC structure

Read this only when the requested document is an RFC or a formal design proposal. Use the user's template or the repository's RFC convention first. Otherwise adapt the [React RFC template](https://github.com/reactjs/rfcs/blob/main/0000-template.md):

| Section | Content |
| --- | --- |
| Metadata | Literal project title followed by `RFC`; known author, date, status, issue, and review link. Omit unknown fields. |
| Summary | Proposed change and main responsibilities in one short paragraph. An explicit high-level flow can serve this role. |
| Motivation | Technical problem, constraints, and required behavior. |
| Detailed design | System boundaries, component responsibilities, interfaces, and important mechanisms. |
| Drawbacks and alternatives | Concrete costs, limitations, plausible alternatives, and deciding trade-offs. |
| Adoption strategy | Relevant compatibility and transition steps. |
| Unresolved questions | Decisions that still need an answer. |

Omit inapplicable sections and credit the template used. Add API examples only when needed. If the user requests the high-level flow first, place it before the other substantive sections; a template must not override the requested reading order.

This structure is specific to RFCs. Do not impose it on architecture guides, procedures, references, or ordinary technical explanations.
