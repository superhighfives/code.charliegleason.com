import { Outlet, useMatches, Link } from "@remix-run/react";
import { MDXProvider } from "@mdx-js/react";
import type { Frontmatter } from "~/.server/posts";
import Metadata from "~/components/metadata";
import Metalinks from "~/components/metalinks";
import type { MetaData as MetaDataType } from "~/components/metadata";
import { parseISO, format, differenceInMonths } from "date-fns";
import CodeBlock from "~/components/code-block";

export default function Post() {
	const params = useMatches().at(-1);
	const { title, data, links } = params?.handle as Frontmatter;

	const metadata: MetaDataType[] =
		(data &&
			Object.entries(data).map(([key, value]) => {
				return { key, value };
			})) ||
		[];

	const metalinks =
		links &&
		Object.entries(links).map(([key, value]) => {
			return { key, value };
		});

	const rawDate = /(?:|)(\d{4}-\d{2}-\d{2})/.exec(params?.id ?? "");
	let oldArticle = false;
	if (rawDate) {
		const dateObject = parseISO(rawDate[0]);
		metadata.unshift({
			key: "Last Updated",
			value: format(dateObject, "dd/MM/yyyy"),
		});

		if (differenceInMonths(Date.now(), dateObject) >= 3) oldArticle = true;
	}

	return (
		<div className="grid gap-y-4">
			<div className="flex flex-wrap gap-y-4 font-medium max-w-[65ch]">
				<Link
					to="/"
					className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 pr-4"
				>
					❯ cd ~/code
					<span className="hidden sm:inline">.charliegleason.com</span>
				</Link>
				<span className="text-gray-300 dark:text-gray-700 max-sm:pr-4">/</span>
				<h1 className="text-gray-900 dark:text-gray-100 leading-relaxed sm:pl-4">
					{title}
				</h1>
			</div>
			<Metadata data={metadata} />
			{oldArticle ? (
				<p className="rounded-md overflow-hidden border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 sm:px-4 py-3 max-w-[65ch]">
					This has not been updated in the last three months, so this
					information miiiiiight be out of date. Here be dragons, etc.
				</p>
			) : null}
			<div className="prose prose-headings:text-sm prose-sm dark:prose-invert prose-a:text-indigo-600 hover:prose-a:text-indigo-500 dark:prose-a:text-indigo-400 dark:hover:prose-a:text-indigo-300 prose-a:no-underline py-3 sm:px-4 border border-transparent max-w-none [&>*:not(.code)]:max-w-[60ch] [&>.code]:overflow-x-scroll [&>.code]:max-w-[calc(100vw)] [&>.code]:-mx-8 sm:[&>.code]:-mx-12 [&>.code_code>*]:px-8 sm:[&>.code_code>*]:px-12 [&>.code]:border-y [&>.code]:py-4 [&>.code]:dark:border-gray-800 [&>.code]:dark:bg-black [&>.code]:bg-gray-50 [&>.code]:text-gray-400 prose-h1:before:content-['#'] prose-h2:before:content-['##'] prose-h3:before:content-['###'] prose-h4:before:content-['####'] prose-h5:before:content-['#####'] prose-h6:before:content-['######'] prose-headings:before:mr-2 prose-headings:before:tracking-widest prose-headings:before:text-indigo-400 prose-h1:border-b-2 prose-h2:border-b prose-h1:border-indigo-500 prose-h2:border-indigo-500 prose-h2:pb-4 prose-h2:mb-4 prose-h1:mt-16 prose-h2:mt-12 prose-h3:mt-8 prose-h4:mt-4 prose-h5:mt-2 prose-h6:mt-2 prose-a:text-wrap prose-a:break-words prose-a:[word-break:break-word] text-pretty">
				<MDXProvider
					components={{
						pre: CodeBlock,
						figure: ({ children, ...props }: any) => (
							<div className="not-prose code" {...props}>
								{children}
							</div>
						),
					}}
				>
					<Outlet />
				</MDXProvider>
			</div>
			<Metalinks links={metalinks} />
		</div>
	);
}
