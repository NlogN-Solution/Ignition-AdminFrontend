import { FileText } from "lucide-react";
import { ContentList } from "@/modules/website/ContentList";

export function WebsitePagesPage() {
  return (
    <ContentList
      title="Pages"
      description="Standalone pages, and the fragments a coded page pulls its copy from. A fragment has a key and no URL."
      kinds={["page", "fragment"]}
      icon={FileText}
      newLabel="New page"
    />
  );
}
