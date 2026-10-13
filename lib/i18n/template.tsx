import { Fragment, type ReactNode } from "react";

// Fills {name} tokens in a translated string with React elements, so word
// order can differ between languages: "Use {button} on the {link}".
export function renderTemplate(template: string, parts: Record<string, ReactNode>): ReactNode {
  return template.split(/(\{\w+\})/g).map((piece, i) => {
    const match = piece.match(/^\{(\w+)\}$/);
    return <Fragment key={i}>{match && match[1] in parts ? parts[match[1]] : piece}</Fragment>;
  });
}
