import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/constants/queryKeys";
import { getErrorMessage } from "@/utils/errors";
import { documentService } from "./service";
import type { DocumentFolderListParams, DocumentListParams, DocumentUpdatePayload, DocumentUploadPayload } from "./types";

export function useDocuments(params: DocumentListParams) {
  return useQuery({
    queryKey: queryKeys.documents.list(params),
    queryFn: () => documentService.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useDocumentFolders(params: DocumentFolderListParams) {
  return useQuery({
    queryKey: queryKeys.documents.folders(params),
    queryFn: () => documentService.folders(params),
    placeholderData: (prev) => prev,
  });
}

export function useDocumentFolder(studentId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.documents.folder(studentId ?? ""),
    queryFn: () => documentService.folder(studentId as string),
    enabled: Boolean(studentId),
  });
}

function useInvalidateDocuments() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
}

export function useUploadDocument() {
  const invalidate = useInvalidateDocuments();
  return useMutation({
    mutationFn: (payload: DocumentUploadPayload) => documentService.upload(payload),
    onSuccess: () => {
      invalidate();
      toast.success("Document uploaded");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Upload failed")),
  });
}

export function useUpdateDocument(id: string) {
  const invalidate = useInvalidateDocuments();
  return useMutation({
    mutationFn: (payload: DocumentUpdatePayload) => documentService.update(id, payload),
    onSuccess: () => {
      invalidate();
      toast.success("Document updated");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't update document")),
  });
}

export function useVerifyDocument(id: string) {
  const invalidate = useInvalidateDocuments();
  return useMutation({
    mutationFn: (remarks?: string) => documentService.verify(id, remarks),
    onSuccess: () => {
      invalidate();
      toast.success("Document verified");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't verify document")),
  });
}

export function useRejectDocument(id: string) {
  const invalidate = useInvalidateDocuments();
  return useMutation({
    mutationFn: ({ reason, remarks }: { reason: string; remarks?: string }) => documentService.reject(id, reason, remarks),
    onSuccess: () => {
      invalidate();
      toast.success("Document rejected");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't reject document")),
  });
}

export function useCommentDocument(id: string) {
  const invalidate = useInvalidateDocuments();
  return useMutation({
    mutationFn: (remarks: string) => documentService.comment(id, remarks),
    onSuccess: () => {
      invalidate();
      toast.success("Comment added");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't add comment")),
  });
}

export function useExtractDocument() {
  return useMutation({
    mutationFn: (id: string) => documentService.extract(id),
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't extract document data")),
  });
}

export function useDeleteDocument() {
  const invalidate = useInvalidateDocuments();
  return useMutation({
    mutationFn: (id: string) => documentService.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("Document deleted");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't delete document")),
  });
}
