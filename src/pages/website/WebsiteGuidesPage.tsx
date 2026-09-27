import { BookMarked } from "lucide-react";
import { ContentList } from "@/modules/website/ContentList";

export function WebsiteGuidesPage() {
  return (
    <ContentList
      title="Guides"
      description="Long-form guides shown under /resources/guides on the public site. Only published guides appear there."
      kinds={["guide"]}
      icon={BookMarked}
      newLabel="New guide"
      editorBase="/website/guides"
    />
  );
}
