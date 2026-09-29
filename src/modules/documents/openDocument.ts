import { toast } from "sonner";
import { documentService } from "./service";

/**
 * A blank tab to navigate once a signed URL arrives, or null if it was blocked.
 *
 * It has to be opened synchronously, inside the click, before any await — a
 * `window.open` issued after a round-trip is not attributable to the click that
 * started it, and Safari and Firefox block it.
 *
 * It must NOT be opened with the `noopener` feature. That was how every View
 * and Download here used to open it, and per the HTML spec `window.open` with
 * `noopener` returns `null` — so the tab that opened was an orphaned
 * about:blank nobody could navigate, and the fallback sent the console itself
 * away to the file instead. The opener link is cut by hand afterwards, which
 * gives the same protection while keeping the handle.
 */
export function openBlankTab(): Window | null {
  const tab = window.open("", "_blank");
  if (!tab) return null;
  try {
    tab.opener = null;
    tab.document.title = "Opening…";
    tab.document.body.innerHTML =
      '<p style="font:14px system-ui,sans-serif;color:#555;padding:24px">Opening your file…</p>';
  } catch {
    // Cosmetic only; the tab is still ours to navigate.
  }
  return tab;
}

/** Point a tab from `openBlankTab` at `url`, or this tab if the popup was blocked. */
export function navigateTab(tab: Window | null, url: string): void {
  if (tab && !tab.closed) {
    tab.location.href = url;
  } else {
    window.location.assign(url);
  }
}

/**
 * Open a document's file in a new tab.
 *
 * Every View and Download in the console goes through here. None of them may
 * link straight at `document.file_url`: that is the authenticated route, and a
 * tab opened at it sends no `Authorization` header. See `documentService.link`
 * for what that used to produce.
 */
export async function openDocumentFile(
  documentId: string,
  disposition: "inline" | "attachment" = "inline",
): Promise<void> {
  const target = openBlankTab();
  try {
    const { url } = await documentService.link(documentId, disposition);
    navigateTab(target, url);
  } catch {
    target?.close();
    toast.error("Couldn't open that file");
  }
}
