import { useEffect } from "react";
import { Navigate, useParams } from "react-router";
import { useBreadcrumbStore } from "@/hooks/useBreadcrumbStore";
import { useAuthStore } from "@/services/authStore";
import { useDocumentFolder } from "@/modules/documents/hooks";
import { StudentDocumentWorkspace } from "@/modules/documents/StudentDocumentWorkspace";
import { UserRole } from "@/types/enums";

export function StudentDocumentWorkspacePage() {
  const { studentId } = useParams();
  const role = useAuthStore((s) => s.user?.role);
  const setLabel = useBreadcrumbStore((s) => s.setLabel);
  const { data: folder } = useDocumentFolder(role === UserRole.STUDENT ? undefined : studentId);

  useEffect(() => {
    if (folder) setLabel(`${folder.first_name} ${folder.last_name}`.trim());
  }, [folder, setLabel]);

  // The folder browser is an admin/counsellor surface — a student landing here
  // (bookmark, typed URL) goes back to their own unchanged Documents view.
  if (role === UserRole.STUDENT) {
    return <Navigate to="/documents" replace />;
  }

  if (!studentId) {
    return <Navigate to="/documents" replace />;
  }

  return <StudentDocumentWorkspace studentId={studentId} />;
}
