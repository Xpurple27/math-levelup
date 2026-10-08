"use client";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
const schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [
      ...(defaultSchema.attributes?.code || []),
      ["className", /^language-./, "math-inline", "math-display"],
    ],
  },
};
export function Markdown({ text }: { text?: string }) {
  return (
    <div className="content-markdown">
      <ReactMarkdown
        skipHtml
        remarkPlugins={[remarkMath]}
        rehypePlugins={[
          [rehypeSanitize, schema],
          [rehypeKatex, { trust: false, strict: "warn" }],
        ]}
      >
        {text || ""}
      </ReactMarkdown>
    </div>
  );
}
