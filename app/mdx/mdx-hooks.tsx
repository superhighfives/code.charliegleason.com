import { useCallback, useMemo, useRef } from "react";
import { useLoaderData } from "react-router";
import { type MyRootContent, SafeMdxRenderer } from "safe-mdx";
import Command from "~/components/command";
import LiveCodeBlock from "~/components/live-code-block";
import { Code } from "~/components/static-code-block";
import { customMdxParse } from "./custom-mdx-parser";
import mermaidManifest from "./mermaid-manifest.json";
import type { MDXComponents, MdxAttributes, PostLoaderData } from "./types";

function normalizeMermaidSource(source: string): string {
  return source.replace(/\r\n/g, "\n").trim();
}

function MermaidDiagram({ source, width }: { source: string; width?: string }) {
  const hash = (mermaidManifest as Record<string, string>)[
    normalizeMermaidSource(source)
  ];
  if (!hash) {
    return (
      <pre className="not-prose mermaid-missing">
        <code>{source}</code>
      </pre>
    );
  }
  const style = width
    ? { maxWidth: /^\d+(\.\d+)?$/.test(width) ? `${width}px` : width }
    : undefined;
  return (
    <figure className="mermaid-diagram not-prose" style={style}>
      <img
        className="mermaid-light"
        src={`/diagrams/${hash}.svg`}
        alt="Diagram"
        loading="lazy"
        decoding="async"
      />
      <img
        className="mermaid-dark"
        src={`/diagrams/${hash}.dark.svg`}
        alt="Diagram"
        loading="lazy"
        decoding="async"
      />
    </figure>
  );
}

function parseMetaString(
  meta?: string | null,
): Record<string, boolean | string> {
  if (!meta) return {};

  const result: Record<string, boolean | string> = {};

  // Match key="value" or key
  const regex = /(\w+)(?:="([^"]*)")?/g;
  let match = regex.exec(meta);

  while (match !== null) {
    const [, key, value] = match;
    result[key] = value !== undefined ? value : true;
    match = regex.exec(meta);
  }

  return result;
}

export function useMdxComponent(components?: MDXComponents) {
  const { attributes, __raw, highlightedBlocks } =
    useLoaderData<PostLoaderData>();

  const blockIndexRef = useRef(0);

  const renderNode = useCallback(
    (node: MyRootContent) => {
      if (node.type === "code") {
        const meta = parseMetaString(node.meta);
        if (node.lang === "mermaid") {
          // The server-side highlighter in post.tsx also skips mermaid, so we
          // mustn't increment the index here either.
          const width = typeof meta.width === "string" ? meta.width : undefined;
          return <MermaidDiagram source={node.value} width={width} />;
        }
        if (meta.live) {
          return (
            <div className="not-prose code">
              <LiveCodeBlock live code={node.value} />
            </div>
          );
        }
        const key = `code-block-${blockIndexRef.current}`;
        blockIndexRef.current++;
        const highlightedHtml =
          highlightedBlocks?.[key] || `<pre><code>${node.value}</code></pre>`;

        if (meta.command) {
          return (
            <div className="not-prose command">
              <Command highlightedHtml={highlightedHtml} />
            </div>
          );
        }

        return (
          <div className="not-prose code">
            <Code highlightedHtml={highlightedHtml} />
          </div>
        );
      }
    },
    [highlightedBlocks],
  );

  return useMemo(() => {
    return () => {
      // Reset blockIndex for each render
      blockIndexRef.current = 0;

      const ast = customMdxParse(__raw);

      return (
        <SafeMdxRenderer
          markdown={__raw}
          components={components}
          mdast={ast}
          allowClientEsmImports={true}
          renderNode={renderNode}
          {...attributes}
        />
      );
    };
  }, [__raw, components, renderNode, attributes]);
}

export const useMdxFiles = () => {
  return useLoaderData<MdxAttributes[]>();
};

export const useMdxAttributes = () => {
  const { attributes } = useLoaderData<PostLoaderData>();

  return attributes;
};
