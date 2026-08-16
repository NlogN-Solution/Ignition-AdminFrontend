import { useEffect } from "react";
import { Link, useLocation } from "react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ALL_NAV_ITEMS } from "@/constants/navigation";
import { useBreadcrumbStore } from "@/hooks/useBreadcrumbStore";

export function Breadcrumbs() {
  const location = useLocation();
  const label = useBreadcrumbStore((s) => s.label);
  const setLabel = useBreadcrumbStore((s) => s.setLabel);

  // Detail-page label only applies to the page that set it — clear on route change.
  useEffect(() => {
    return () => setLabel(null);
  }, [location.pathname, setLabel]);

  const match = ALL_NAV_ITEMS.filter((item) => (item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path))).sort(
    (a, b) => b.path.length - a.path.length,
  )[0];

  const segments = location.pathname.split("/").filter(Boolean);
  const hasDetail = match && match.path !== "/" && segments.length > match.path.split("/").filter(Boolean).length;

  return (
    <Breadcrumb>
      <BreadcrumbList className="text-[13px]">
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/">Workspace</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {match && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {hasDetail ? (
                <BreadcrumbLink asChild>
                  <Link to={match.path}>{match.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{match.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </>
        )}
        {hasDetail && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{label ?? "Detail"}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
