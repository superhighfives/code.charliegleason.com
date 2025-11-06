import { describe, expect, it } from "vitest";
import { processArticleData } from "../posts";

describe("processArticleData", () => {
  it("should return empty metadata and false for old article when no date provided", () => {
    const result = processArticleData({ frontmatter: { data: [] } });

    expect(result.metadata).toEqual([]);
    expect(result.isOldArticle).toBe(false);
  });

  it("should format date correctly and add to metadata", () => {
    const testDate = "2024-01-15";
    const existingMetadata = [{ key: "Author", value: "Charlie" }];

    const result = processArticleData({
      frontmatter: {
        data: existingMetadata,
        date: testDate,
      },
    });

    expect(result.metadata).toHaveLength(2);
    expect(result.metadata[0]).toEqual({
      key: "Last Updated",
      value: "15/01/2024",
    });
    expect(result.metadata[1]).toEqual({
      key: "Author",
      value: "Charlie",
    });
  });

  it("should mark article as old when date is 3+ months ago", () => {
    // Use a date that's definitely more than 3 months old
    const oldDate = "2024-01-01";

    const result = processArticleData({
      frontmatter: { data: [], date: oldDate },
    });

    expect(result.isOldArticle).toBe(true);
  });

  it("should not mark article as old when date is less than 3 months ago", () => {
    // Create a date that's definitely less than 3 months ago
    const recentDate = new Date();
    recentDate.setMonth(recentDate.getMonth() - 1); // 1 month ago
    const dateString = recentDate.toISOString().split("T")[0];

    const result = processArticleData({
      frontmatter: { data: [], date: dateString },
    });

    expect(result.isOldArticle).toBe(false);
  });

  it("should handle edge case of exactly 3 months", () => {
    // Create a date that's exactly 3 months and 1 day ago (to ensure it's >= 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 1);
    const dateString = threeMonthsAgo.toISOString().split("T")[0];

    const result = processArticleData({
      frontmatter: { data: [], date: dateString },
    });

    // Should be marked as old when >= 3 months
    expect(result.isOldArticle).toBe(true);
  });

  it("should handle all parameters together", () => {
    const testDate = "2024-01-15";
    const existingMetadata = [{ key: "Author", value: "Charlie" }];
    const tags = ["tutorial", "ai"];

    const result = processArticleData({
      frontmatter: {
        data: existingMetadata,
        date: testDate,
        tags,
      },
    });

    expect(result.metadata).toHaveLength(3);
    expect(result.metadata[0].key).toBe("Last Updated");
  });
});
