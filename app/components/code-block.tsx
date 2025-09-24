import { ReactNode } from "react";
import * as React from "react";
import Playground from "./playground";
import { MeshGradient } from "@paper-design/shaders-react";

interface PreProps {
	children?: ReactNode;
	live?: boolean;
	[key: string]: any;
}

export default function CodeBlock({ children, live, ...props }: PreProps) {
	if (!live) {
		// Filter out non-DOM props before passing to pre element
		const { dataLanguage, style, dataTheme, ...domProps } = props;
		void dataLanguage;
		void dataTheme;
		void style;
		return <pre {...domProps}>{children}</pre>;
	}

	let codeString = "";

	// Extract code string using a recursive approach that handles both arrays and single objects
	const extractAllText = (element: any): string => {
		if (typeof element === "string") {
			return element;
		}

		if (Array.isArray(element)) {
			return element.map(extractAllText).join("");
		}

		if (
			element &&
			typeof element === "object" &&
			element.props &&
			element.props.children
		) {
			return extractAllText(element.props.children);
		}

		return "";
	};

	codeString = extractAllText(children).trim();

	if (!codeString) {
		// Filter out non-DOM props before passing to pre element
		const { dataLanguage, dataTheme, ...domProps } = props;
		void dataLanguage;
		void dataTheme;
		return <pre {...domProps}>{children}</pre>;
	}

	// Extract imports and build scope dynamically, then remove imports from code
	const buildScopeAndCleanCode = (code: string) => {
		const scope: Record<string, any> = {
			React,
			render: (element: React.ReactElement) => element,
		};

		// Parse import statements
		const importRegex =
			/import\s+(?:{([^}]+)}|\*\s+as\s+(\w+)|(\w+))\s+from\s+['"]([^'"]+)['"];?\s*\n?/g;
		let match;

		while ((match = importRegex.exec(code)) !== null) {
			const [, namedImports, , , moduleName] = match;

			if (moduleName === "@paper-design/shaders-react") {
				if (namedImports) {
					// Handle named imports: import { MeshGradient, Other } from "..."
					const imports = namedImports.split(",").map((imp) => imp.trim());
					imports.forEach((imp) => {
						if (imp === "MeshGradient") {
							scope[imp] = MeshGradient;
						}
						// Add other named imports as needed
					});
				}
			}
			// Add other module handlers here
		}

		// Remove import statements from code
		const cleanCode = code.replace(importRegex, "").trim();

		return { scope, cleanCode };
	};

	const { scope, cleanCode } = buildScopeAndCleanCode(codeString);

	return <Playground code={cleanCode} scope={scope} />;
}
