/** Saves text as a file. CSVs get a UTF-8 BOM so Excel shows Ñ and accents correctly. */
export function downloadText(filename: string, text: string, mime = "text/csv;charset=utf-8") {
  const body = mime.startsWith("text/csv") ? `﻿${text}` : text;
  const url = URL.createObjectURL(new Blob([body], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
