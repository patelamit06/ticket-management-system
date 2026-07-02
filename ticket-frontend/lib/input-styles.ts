/**
 * Global form field styles – consistent h-9 height across inputs, selects, and password fields.
 */
// [color-scheme] makes native pickers (the datetime-local calendar/clock icon) render in the
// current theme so the icon stays visible in dark mode instead of drawing dark-on-dark.
export const inputClass =
  'h-9 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground shadow-sm transition-colors [color-scheme:light] dark:[color-scheme:dark] focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20';

export const selectClass =
  'h-9 shrink-0 rounded-lg border border-input bg-background px-2 py-1.5 text-sm text-foreground shadow-sm [color-scheme:light] dark:[color-scheme:dark] focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20';
