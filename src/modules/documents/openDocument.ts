import { toast } from "sonner";
import { documentService } from "./service";

/**
 * Open a document's file in a new tab.
 *
 * Every View and Download in the console goes through here. None of them may
 * link straight at `document.file_url`: that is the authenticated route, and a
 * tab opened at it sends no `Authorization` header. See `documentService.link`
 * for what that used to produce.
 *
 * The tab is opened synchronously, before the await, and navigated once the
 * signed URL arrives — a `window.open` issued after a round-trip is not
 * attributable to the click that started it, and Safari and Firefox block it.
 */
export async function openDocumentFile(
  documentId: string,
  disposition: "inline" | "attachment" = "inline",
): Promise<void> {
  const target = window.open("", "_blank", "noopener,noreferrer");
  try {
    const { url } = await documentService.link(documentId, disposition);
    if (target) {
      target.location.href = url;
    } else {
      window.location.assign(url);
    }
  } catch {
    target?.close();
    toast.error("Couldn't open that file");
  }
}
