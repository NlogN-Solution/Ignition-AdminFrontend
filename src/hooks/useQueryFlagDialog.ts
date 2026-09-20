import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router";

/**
 * Opens a dialog whenever `?<flag>=1` is present in the URL, and strips the
 * flag once the dialog is dismissed.
 *
 * Two things here are load-bearing, and each one is a bug this has already had.
 *
 * **The dialog opens from an effect, never during render.** Deriving `open`
 * straight from the search params reads well and is wrong: the dialog is then
 * already mounted on the component's very first render, and React's
 * `StrictMode` — which this app runs under in development — mounts, tears down
 * and remounts that first pass. The dialog opened, closed and opened again, so
 * every Create menu item showed its form twice. Opening a tick later, from an
 * effect, puts it past that cycle and it appears once.
 *
 * **The flag stays in the URL until the dialog is closed.** It used to be
 * consumed on sight — read it, open, delete it, all in the same effect — which
 * made the request a one-shot: anything that dropped the component's state
 * between the flag being read and the dialog being painted lost it silently,
 * and you landed on the list page with no form. Leaving the flag until dismissal
 * means the request survives, is re-read by whatever renders next, and is
 * cleared at the one moment where clearing it cannot lose anything.
 */
export function useQueryFlagDialog(flag = "new") {
  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const flagged = searchParams.get(flag) === "1";

  useEffect(() => {
    if (flagged) setOpen(true);
  }, [flagged]);

  const setDialogOpen = useCallback(
    (next: boolean) => {
      setOpen(next);
      if (!next && searchParams.get(flag) === "1") {
        const params = new URLSearchParams(searchParams);
        params.delete(flag);
        setSearchParams(params, { replace: true });
      }
    },
    [flag, searchParams, setSearchParams],
  );

  return [open, setDialogOpen] as const;
}
