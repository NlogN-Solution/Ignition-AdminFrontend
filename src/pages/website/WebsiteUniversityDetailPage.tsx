import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Building2, ExternalLink, Loader2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { UniversityEditor } from "@/modules/website/UniversityEditor";
import { useDeleteWebsiteUniversity, useWebsiteUniversity } from "@/modules/website/hooks";

/**
 * One university, at the width the record actually needs.
 *
 * The list used to open this in a drawer. Forty fields across ten tabs, plus a
 * requirements matrix that is a grid by nature, do not fit in 768px — so the
 * record gets a page and the list goes back to being a list.
 *
 * **Delete lives here and nowhere else.** Removing a university cascades to
 * its courses, entry routes and scholarships, and a destructive action that
 * cascades has no business sitting on a row that a mis-click can reach. Here
 * the person pressing it has the whole record in front of them, and the
 * confirmation names what goes with it.
 */
export function WebsiteUniversityDetailPage() {
  const { universityId } = useParams();
  const navigate = useNavigate();
  const { data: university, isLoading } = useWebsiteUniversity(universityId);
  const remove = useDeleteWebsiteUniversity();
  const [confirming, setConfirming] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-[70vh] w-full" />
      </div>
    );
  }

  if (!university) {
    return (
      <EmptyState
        icon={Building2}
        title="University not found"
        description="It may have been deleted."
      />
    );
  }

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className="mb-3 -ml-2 gap-1.5 text-muted-foreground"
        onClick={() => navigate("/website/universities")}
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to universities
      </Button>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[19px] font-semibold tracking-tight text-foreground">
              {university.name}
            </h1>
            <Badge variant={university.is_published ? "default" : "secondary"}>
              {university.is_published ? "Published" : "Draft"}
            </Badge>
            {university.is_partner && <Badge variant="outline">Partner</Badge>}
          </div>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
            {university.slug ?? "no slug"}
            {university.city ? ` · ${university.city}` : ""}
            {university.region ? ` · ${university.region}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {university.is_published && university.slug && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={`/api/v1/public/universities/${university.slug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Public record
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setConfirming(true)}>
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
        </div>
      </div>

      <UniversityEditor university={university} />

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {university.name}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This removes the university and everything hanging off it — its courses, its entry
            routes and its scholarships. It cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button
              disabled={remove.isPending}
              onClick={() =>
                remove.mutate(university.id, {
                  onSuccess: () => navigate("/website/universities"),
                })
              }
            >
              {remove.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete university
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
