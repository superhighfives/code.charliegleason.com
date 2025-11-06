import { differenceInMonths, format, parseISO } from "date-fns";
import type { MetaData, PostFrontmatter } from "~/mdx/types";

export function processArticleData({
  frontmatter,
  currentDate = new Date(),
}: {
  frontmatter?: PostFrontmatter;
  currentDate?: Date;
}) {
  const metadata: MetaData[] = [];

  if (frontmatter?.description) {
    metadata.push({
      key: "Overview",
      value: frontmatter.description,
    });
  }

  // Add date if provided
  if (frontmatter?.date) {
    const dateObject = parseISO(frontmatter.date);
    metadata.push({
      key: "Last Updated",
      value: format(dateObject, "dd/MM/yyyy"),
    });
  }

  if (frontmatter?.tags) {
    metadata.push({
      key: "Tags",
      value: frontmatter.tags.join(", "),
    });
  }

  // Add existing data
  metadata.push(...(frontmatter?.data || []));

  const isOldArticle = frontmatter?.date
    ? differenceInMonths(currentDate, parseISO(frontmatter.date)) >= 3
    : false;

  return { metadata, isOldArticle };
}
