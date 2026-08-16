import { useAuthStore } from "@/services/authStore";
import { DocumentFolderGrid } from "@/modules/documents/DocumentFolderGrid";
import { StudentDocumentsView } from "@/modules/documents/StudentDocumentsView";
import { UserRole } from "@/types/enums";

export function DocumentsPage() {
  const role = useAuthStore((s) => s.user?.role);

  // Students keep the existing flat document list unchanged; admin/counsellor
  // (and other staff reviewers) get the new one-folder-per-student browser.
  if (role === UserRole.STUDENT) {
    return <StudentDocumentsView />;
  }

  return <DocumentFolderGrid />;
}
