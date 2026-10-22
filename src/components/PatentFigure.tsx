// Patent-sheet style schematic of claim 1, shown in the side panel's empty state.

// Plain ASCII only, max 52 cols, no trailing spaces.
const FIGURE = [
  "     +--------------------+",
  "1a --| CLIENT             |",
  "     | DISPLAY ITEM       |",
  "     +---------+----------+",
  "               |",
  "     +---------v----------+           .- - - - - -.",
  "1b --| SINGLE ACTION      |- - -X- - >: SHOPPING  :",
  "     +---------+----------+           :   CART    :",
  "               |                      '- - - - - -'",
  "               | ORDER REQUEST + ID    1g  NO CART",
  "     +---------v----------+",
  "1c --| SERVER             |",
  "     | SINGLE-ACTION RECV |",
  "     +---------+----------+",
  "               |                   ___________",
  "     +---------v----------+       (___________)",
  "1e --| GENERATE ORDER     |<------|  STORED   |-- 1d",
  "     +---------+----------+       | PURCHASER |",
  "               |                  |   INFO    |",
  "     +---------v----------+       '-----------'",
  "1f --| FULFILL            |",
  "     +--------------------+",
  "",
  "                       FIG. 1",
  "               US 5,960,411  claim 1",
].join("\n");

export function PatentFigure({ className = "" }: { className?: string }) {
  return (
    <figure className={className}>
      <pre
        aria-hidden="true"
        className="font-mono text-[11px] leading-[1.35] text-faint whitespace-pre overflow-x-auto select-none"
      >
        {FIGURE}
      </pre>
      <figcaption className="sr-only">
        Figure 1, a schematic of claim 1 of US 5,960,411: the client displays
        an item (1a), a single action sends an order request with a purchaser
        identifier (1b) to the server (1c), which retrieves stored purchaser
        information (1d), generates an order (1e), and fulfills it (1f).
        No shopping cart is used (1g).
      </figcaption>
    </figure>
  );
}
