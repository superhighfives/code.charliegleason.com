import { HandMetal } from "lucide-react";
import type { MDXComponents } from "~/mdx/types";
import Command from "../command";
import InlineCode from "../inline-code";
import LinkInline from "../link-inline";
import CodeBlock from "../live-code-block";
import Picture from "../picture";
import Visual from "../visual";
import YouTube from "../youtube";

export const components: MDXComponents = {
  // HTML components
  a: LinkInline,
  code: InlineCode,
  // MDX components
  CodeBlock,
  Command,
  Picture,
  Visual,
  HandMetal,
  YouTube,
};
