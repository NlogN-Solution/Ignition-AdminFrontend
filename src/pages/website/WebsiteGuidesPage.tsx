import { BookMarked } from "lucide-react";
import { ContentList } from "@/modules/website/ContentList";

export function WebsiteGuidesPage() {
  return (
    <ContentList
      title="Guides"
      description="The long-form guidance under /resources. The index the public site shows is a query over these, not a hardcoded list."
      kinds={["guide"]}
      icon={BookMarked}
      newLabel="New guide"
    />
  );
}
