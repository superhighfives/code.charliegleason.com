export interface MdxOptions {
  path?: string;
  paths?: string[];
  alias?: string;
  aliases?: string[];
}

export interface MdxFile {
  path: string;
  slug: string;
  url: string;
  attributes: PostFrontmatter;
  rawContent: string;
}

export interface MdxManifest {
  files: MdxFile[];
}

export interface Post {
  slug: string;
  path: string;
  url: string;
  title: string;
  description?: string;
  date?: Date;
  tags?: string[];
  frontmatter: PostFrontmatter;
}

export interface PostFrontmatter {
  title?: string;
  description?: string;
  tags?: string[];
  image?: boolean | string;
  data?: MetaData[];
  slug?: string;
  date?: string;
  links?: MetaData[];
  author?: string;
}

// biome-ignore lint/suspicious/noExplicitAny: we don't know the type
export type MDXComponents = Record<string, React.ComponentType<any>>;

export interface MdxRuntimeData {
  content: unknown;
  frontmatter: PostFrontmatter;
}

export interface PostLoaderData {
  __raw: string;
  attributes: PostFrontmatter;
  highlightedBlocks?: Record<string, string>;
  kudosTotal?: number;
  kudosYou?: number;
  randomVideo?: number;
}

export type MdxAttributes = {
  path: string;
  slug: string;
  [key: string]: string;
};

export type MetaData = { key: string; value: string };
