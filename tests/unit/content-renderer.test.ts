import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Markdown } from "../../src/components/markdown";
describe("shared sanitized Markdown and math", () => {
  it("renders inline and display KaTeX for student and admin use", () => {
    const html = renderToStaticMarkup(
      createElement(Markdown, { text: "Solve $x+1=3$.\n\n$$\nx=2\n$$" }),
    );
    expect(html).toContain('class="katex"');
    expect(html).toContain("katex-display");
  });
  it("drops raw HTML, executable links and untrusted math commands", () => {
    const html = renderToStaticMarkup(
      createElement(Markdown, {
        text: "<script>alert(1)</script>\n\n[bad](javascript:alert(1))\n\n$\\href{javascript:alert(1)}{bad}$",
      }),
    );
    expect(html).not.toContain("<script");
    expect(html).not.toContain('href="javascript:');
  });
  it("keeps function arguments and numbered mathematical expressions intact", () => {
    const html = renderToStaticMarkup(
      createElement(Markdown, {
        text: "Gunakan $f(1)+f(2)$ dan $g(1)=g(2)$ untuk menjawab.",
      }),
    );
    expect(html).not.toContain("<strong>(1)</strong>");
    expect(html).not.toContain("<strong>(2)</strong>");
    expect(html).not.toContain("katex-error");
    expect(html).toContain("f(1)+f(2)");
  });
});
