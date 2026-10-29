// Rich text values are stored as an HTML string produced by the editor, which
// only allows the palette in RichTextEditor (headings 2-3, bold, italic, lists,
// quote, links, tables). A real CMS would store a structured JSON document
// instead; the editor and its limits stay the same.

const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Entries created before the rich text editor hold plain text: paragraphs are
// separated by blank lines, single newlines are line breaks.
export function toEditorHtml(value) {
  if (!value) return "";
  if (value.trimStart().startsWith("<")) return value;
  return value
    .split(/\n{2,}/)
    .map((para) => `<p>${escapeHtml(para).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export function htmlToText(value) {
  if (!value) return "";
  const doc = new DOMParser().parseFromString(toEditorHtml(value), "text/html");
  return (doc.body.textContent ?? "").trim();
}
