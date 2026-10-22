import Image from "next/image";
import data from "@/data/claimChart.json";
import { ClaimChartExplorer } from "@/components/ClaimChartExplorer";
import fig1a from "../../public/images/us5960411-fig1a.webp";

/**
 * Background for the top of the page: Fig. 1A from the patent itself, the
 * drawing of the original 1-Click button next to the old "Add it to your
 * shopping cart" button. It's lightly blurred and faded so it reads as texture,
 * and it fades out before the chart so the scores stay easy to read. Dark mode
 * inverts the line art to light-on-dark.
 */
function PatentBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] overflow-hidden sm:h-[760px] [mask-image:linear-gradient(to_bottom,black_45%,transparent)]"
    >
      <Image
        src={fig1a}
        alt=""
        fill
        priority
        sizes="100vw"
        placeholder="blur"
        // scale-110 hides the soft edge the blur leaves around the image border.
        // 18% is the ceiling for text contrast: after the 3px blur the darkest
        // stroke is ~70% strength, and at 18% every text color over it still
        // clears 4.5:1 in both modes. Raise it and gray text starts to fail.
        className="scale-110 object-cover object-center opacity-[0.18] blur-[3px] dark:opacity-[0.18] dark:invert"
      />
    </div>
  );
}

// This is a Server Component (no "use client"). It renders the static header
// on the server and hands the interactive part to <ClaimChartExplorer />,
// which runs in the browser and fetches the scores from /api/match.
export default function Home() {
  const { patent, priorArt } = data;
  const filed = new Date(patent.filed).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="relative isolate flex flex-1 flex-col">
      <PatentBackdrop />
      <header className="border-b border-rule">
        <div className="mx-auto flex h-14 w-full max-w-[1280px] items-center justify-between px-4 sm:px-6">
          <p className="text-[15px] font-semibold">Claim Chart Explorer</p>
          <a
            href={patent.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-strong underline underline-offset-4 hover:decoration-2"
          >
            {patent.number}
            <span className="hidden sm:inline"> on Google Patents</span>
          </a>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-10 px-4 py-10 sm:px-6">
        <div className="max-w-3xl">
          <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.01em] sm:text-[30px]">
            {patent.title}
          </h1>
          <p className="mt-2 text-[15px] text-muted">
            {patent.number}, filed {filed} by {patent.assignee} Compared against {priorArt.length} earlier
            patents cited on its face.
          </p>
        </div>

        <ClaimChartExplorer />
      </main>

      <footer className="border-t border-rule">
        <p className="mx-auto w-full max-w-[1280px] px-4 py-5 text-[13px] text-muted sm:px-6">
          Patent text is from USPTO documents via Google Patents. Scores measure shared words, not meaning,
          and are not a legal opinion.
        </p>
      </footer>
    </div>
  );
}
