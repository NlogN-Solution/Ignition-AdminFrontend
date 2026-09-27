import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UniversityEditor } from "@/modules/website/UniversityEditor";

/**
 * A new university, on the same editor and tabs as an existing one. Courses
 * are optional and can be queued on the Courses tab; they are created right
 * after the university, which then opens on its own page.
 */
export function WebsiteUniversityNewPage() {
  const navigate = useNavigate();

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

      <div className="mb-5">
        <h1 className="text-[19px] font-semibold tracking-tight text-foreground">New university</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Only the name and country are needed to create it. Publishing needs the fields listed on the Publish tab.
        </p>
      </div>

      <UniversityEditor onCreated={(id) => navigate(`/website/universities/${id}`, { replace: true })} />
    </div>
  );
}
