import { Outlet } from "react-router";
import ignitionMark from "@/assets/ignition-mark.png";

/**
 * The sign-in screen is the one place the ambient field is allowed to be seen
 * for its own sake: a single card of glass, centred, with the light behind it.
 */
export function AuthLayout() {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden px-4">
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-9 flex items-center justify-center gap-2.5">
          <img src={ignitionMark} alt="" aria-hidden className="h-8 w-8 object-contain" />
          <span className="text-[15px] font-semibold tracking-[-0.022em]">Ignition</span>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
