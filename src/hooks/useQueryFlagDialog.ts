import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";

/**
 * Opens a dialog whenever `?<flag>=1` is present in the URL, then strips the flag —
 * driven by a `useEffect` (not a `useState` initializer) so it re-fires every time the
 * query param changes, including repeat navigations to a page that's already mounted
 * (e.g. clicking the same "Create" menu item while already on that page).
 */
export function useQueryFlagDialog(flag = "new") {
  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get(flag) === "1") {
      setOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete(flag);
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, flag, setSearchParams]);

  return [open, setOpen] as const;
}
