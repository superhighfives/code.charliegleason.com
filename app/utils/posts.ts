import { differenceInMonths, format, parseISO } from "date-fns";
import type { MetaData } from "~/mdx/types";

export function processArticleDate(
  data: MetaData[] = [],
  date?: string,
  currentDate: Date = new Date(),
) {
  if (!date) {
    return { metadata: data, isOldArticle: false };
  }

  const dateObject = parseISO(date);
  const metadata = [
    {
      key: "Last Updated",
      value: format(dateObject, "dd/MM/yyyy"),
    },
    ...data,
  ];

  const isOldArticle = differenceInMonths(currentDate, dateObject) >= 3;

  return { metadata, isOldArticle };
}
