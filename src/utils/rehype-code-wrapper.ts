import type { Element, Root } from "hast";
import { visit } from "unist-util-visit";

/**
 * Rehype plugin that wraps <pre> elements (code blocks) in a div with class "not-prose code"
 * and adds padding via py-4 class on the pre element itself (simpler than nested wrappers).
 */
export function rehypeCodeWrapper() {
  return (tree: Root) => {
    visit(tree, "element", (node, index, parent) => {
      if (
        node.tagName === "pre" &&
        parent &&
        typeof index === "number" &&
        // Don't wrap if already wrapped
        !(
          parent.type === "element" &&
          (parent as Element).properties?.className?.toString().includes("code")
        )
      ) {
        // Add py-4 class to the pre element for vertical padding
        const existingClasses = node.properties?.className;
        let classes: (string | number)[];
        if (Array.isArray(existingClasses)) {
          classes = [
            ...existingClasses.filter(
              (c): c is string | number =>
                typeof c === "string" || typeof c === "number",
            ),
            "py-4",
          ];
        } else if (
          typeof existingClasses === "string" ||
          typeof existingClasses === "number"
        ) {
          classes = [existingClasses, "py-4"];
        } else {
          classes = ["py-4"];
        }
        node.properties = { ...node.properties, className: classes };

        // Outer wrapper with code block styling
        const wrapper: Element = {
          type: "element",
          tagName: "div",
          properties: { className: ["not-prose", "code"] },
          children: [node],
        };

        (parent as Element).children[index] = wrapper;
      }
    });
  };
}
