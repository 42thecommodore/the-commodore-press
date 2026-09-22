/* Where Chrome is. `npm run card` renders with it and `npm run test` drives pages with it.
   Any Chromium will do; CHROME=/path overrides. Local tools only — CI never needs it. */
import fs from "node:fs";

export const CHROME = [
  process.env.CHROME,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/opt/pw-browsers/chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
].find(c => c && fs.existsSync(c)) || null;
