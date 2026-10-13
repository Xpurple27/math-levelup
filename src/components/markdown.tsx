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

function normalizePlainMath(input: string) {
  const chunks = input.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g);
  return chunks
    .map((chunk, index) => {
      if (index % 2 === 1) return chunk;

      const math: string[] = [];
      const hold = (value: string) => {
        const token = `@@LU_MATH_${math.length}@@`;
        math.push(value);
        return token;
      };

      let text = chunk;

      text = text.replace(/\bsqrt\(([^()\n]+)\)/g, (_, value: string) => hold(`$\\sqrt{${value}}$`));

      text = text.replace(/\b([A-Z])=\[\[([^\]\n]+)\],\[([^\]\n]+)\]\]/g, (_, name: string, row1: string, row2: string) => {
        const first = row1.split(",").map((item: string) => item.trim()).join(" & ");
        const second = row2.split(",").map((item: string) => item.trim()).join(" & ");
        return hold(`$${name}=\\begin{pmatrix}${first}\\\\${second}\\end{pmatrix}$`);
      });

      text = text.replace(/\(([^()\n]+)\)\/\(([^()\n]+)\)/g, (_, numerator: string, denominator: string) =>
        hold(`$\\frac{${numerator}}{${denominator}}$`),
      );

      text = text.replace(/\b(\d+)\/(\d+)\b/g, (_, numerator: string, denominator: string) =>
        hold(`$\\frac{${numerator}}{${denominator}}$`),
      );

      text = text.replace(/\b([a-zA-Z])\^([0-9]+)\b/g, (_, base: string, power: string) =>
        hold(`$${base}^{${power}}$`),
      );

      text = text.replace(/\b([a-zA-Z])([+-]\d+)\b/g, (_, variable: string, offset: string) =>
        hold(`$${variable}${offset}$`),
      );

      text = text.replace(/\b([A-Za-z])\s*([=<>])\s*(-?\d+(?:[.,]\d+)?)\b/g, (_, variable: string, operator: string, value: string) =>
        hold(`$${variable}${operator}${value}$`),
      );

      return text.replace(/@@LU_MATH_(\d+)@@/g, (_, rawIndex: string) => math[Number(rawIndex)] || "");
    })
    .join("");
}

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
        {normalizePlainMath(text || "")}
      </ReactMarkdown>
    </div>
  );
}
