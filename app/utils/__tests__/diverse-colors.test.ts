import { describe, expect, it } from "vitest";
import { selectDiverseIndices } from "~/utils/diverse-colors";

describe("selectDiverseIndices", () => {
  it("returns a valid index for every post", () => {
    const result = selectDiverseIndices([
      { slug: "a", colors: [{ background: "#ff0000", text: "#000" }] },
      { slug: "b", colors: [{ background: "#00ff00", text: "#000" }] },
    ]);

    expect(Object.keys(result).sort()).toEqual(["a", "b"]);
    expect(result.a).toBe(0);
    expect(result.b).toBe(0);
  });

  it("keeps indices within the palette bounds", () => {
    const colors = Array.from({ length: 9 }, (_, i) => ({
      background: `#${i}${i}${i}${i}${i}${i}`,
      text: "#000",
    }));

    for (let run = 0; run < 50; run++) {
      const result = selectDiverseIndices([{ slug: "a", colors }]);
      expect(result.a).toBeGreaterThanOrEqual(0);
      expect(result.a).toBeLessThan(colors.length);
    }
  });

  it("falls back to a random index for posts without colours", () => {
    const result = selectDiverseIndices([
      { slug: "a", colors: [] },
      { slug: "b" },
    ]);

    expect(result.a).toBeGreaterThanOrEqual(0);
    expect(result.a).toBeLessThan(9);
    expect(result.b).toBeGreaterThanOrEqual(0);
    expect(result.b).toBeLessThan(9);
  });

  it("favours a contrasting colour when the palette offers one", () => {
    // One post is red-only; the other has a red and a distinct green option.
    // Across many runs the second post should pick green more often than red,
    // because green is the more contrasting choice against the red neighbour.
    let greenPicks = 0;
    const runs = 400;

    for (let run = 0; run < runs; run++) {
      const result = selectDiverseIndices([
        { slug: "red", colors: [{ background: "#f94935", text: "#000" }] },
        {
          slug: "mixed",
          colors: [
            { background: "#f94935", text: "#000" }, // red (index 0)
            { background: "#4caf50", text: "#000" }, // green (index 1)
          ],
        },
      ]);
      if (result.mixed === 1) greenPicks++;
    }

    // With SHARPNESS biasing toward contrast, green should dominate. It won't be
    // 100% because the red post is sometimes placed first (or not at all before
    // the mixed post), leaving the mixed post free to pick randomly.
    expect(greenPicks / runs).toBeGreaterThan(0.6);
  });
});
