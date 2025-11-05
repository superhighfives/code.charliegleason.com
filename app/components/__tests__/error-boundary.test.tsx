import { render, screen } from "@testing-library/react";
import { createRoutesStub } from "react-router";
import { describe, expect, it } from "vitest";
import GeneralErrorBoundary from "../error-boundary";

describe("GeneralErrorBoundary", () => {
  it("should render route error response", () => {
    const error = {
      status: 404,
      statusText: "Not Found",
      data: null,
      internal: false,
    };

    const RemixStub = createRoutesStub([
      {
        path: "/",
        Component: () => <GeneralErrorBoundary error={error} />,
      },
    ]);

    render(<RemixStub />);

    expect(screen.getByText("404: Not Found")).toBeInTheDocument();
  });

  it("should render Error instance message", () => {
    const error = new Error("Something went wrong");

    const RemixStub = createRoutesStub([
      {
        path: "/",
        Component: () => <GeneralErrorBoundary error={error} />,
      },
    ]);

    render(<RemixStub />);

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("should render unknown error message", () => {
    const error = "string error";

    const RemixStub = createRoutesStub([
      {
        path: "/",
        Component: () => <GeneralErrorBoundary error={error} />,
      },
    ]);

    render(<RemixStub />);

    expect(screen.getByText("Unknown Error")).toBeInTheDocument();
  });

  it("should render heading and skull icon", () => {
    const error = new Error("Test error");

    const RemixStub = createRoutesStub([
      {
        path: "/",
        Component: () => <GeneralErrorBoundary error={error} />,
      },
    ]);

    const { container } = render(<RemixStub />);

    expect(
      screen.getByText(/cd ~\/code.charliegleason.com/),
    ).toBeInTheDocument();

    // Check for skull icon (svg element)
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("should handle null error", () => {
    const RemixStub = createRoutesStub([
      {
        path: "/",
        Component: () => <GeneralErrorBoundary error={null} />,
      },
    ]);

    render(<RemixStub />);

    expect(screen.getByText("Unknown Error")).toBeInTheDocument();
  });

  it("should handle undefined error", () => {
    const RemixStub = createRoutesStub([
      {
        path: "/",
        Component: () => <GeneralErrorBoundary error={undefined} />,
      },
    ]);

    render(<RemixStub />);

    expect(screen.getByText("Unknown Error")).toBeInTheDocument();
  });
});
