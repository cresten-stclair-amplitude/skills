# Technical HTML output

Use [assets/document.html](../assets/document.html) when the user requests standalone technical HTML and has not supplied another format. The shell provides document styling, an opening overview, and arbitrary content sections. It does not impose an RFC structure.

## Adapt the shell

Copy the asset into the requested destination. Replace all `{{...}}` fields and authoring comments with actual content, omitting unknown metadata and inapplicable sections. The fields ending in `_HTML` accept authored HTML; escape plain text and attribute values before insertion. Keep source links beside the relevant design text.

Use a literal subject title, necessary metadata, a white background, restrained headings, and ordinary paragraphs. Make the requested overview, result, or high-level flow the first substantive content. Choose the remaining headings for the document type. Add component navigation only when it improves access to a substantial section. Avoid hero sections, taglines, cards, decorative badges, gradients, or oversized typography.

Use tables for mappings and trade-offs, code blocks for verified excerpts, and semantic headings for the document hierarchy. The shell includes a skip link, print styles, narrow-screen navigation, and optional diagram controls. Remove unused controls or diagram markup rather than shipping placeholders.

## Mermaid rendering

Keep each diagram's `.mmd` source beside the HTML. For a standalone page, generate SVG with Mermaid tooling and embed it so the artifact opens offline. Link or expose the editable source. For an established documentation site, follow its Mermaid rendering convention instead.

For an embedded SVG, add a figure with `data-diagram`, a `.diagram-canvas` containing the SVG, and optional buttons with `data-zoom="fit"`, `data-zoom="detail"`, and `data-fullscreen`. Fit, Detail, and Full screen controls operate on that figure; they are optional for small diagrams. Render multiple diagrams with distinct IDs, including their internal SVG IDs, so references and markers cannot collide.

Match the render-time and display-time font. Mermaid measures labels before generating SVG; a different inherited font, paragraph margin, or font size can clip labels even when the diagram renders without an error. Scope prose CSS so it does not affect SVG labels. Avoid generic diagram class names such as `source` or `note` that collide with document CSS.

Change the Mermaid source or layout configuration to resolve overlaps. Do not hand-draw a replacement SVG or adjust individual generated node positions: the source must remain authoritative. Use a separate sequence diagram when interaction ordering is too detailed for the component diagram. Prefer a readable diagram to a large diagram squeezed to unreadable text.

## Output checks

Open the populated HTML in a browser. Inspect the first page, both dense text and diagram sections, a narrow viewport, and print output. Check internal anchors, local source links, label clipping, diagram controls, page overflow, browser errors, and any unexpected network requests. Source and rendered diagrams must agree.

A valid HTML file is not proof that its diagrams are legible. Conversely, a screenshot is not a substitute for checking that the prose and diagram describe the same design. Keep temporary screenshots and test fixtures outside the deliverable unless requested.
