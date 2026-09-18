# Neighbourhood Exit Safety

## Goal
Reframe the flood experience around whether each neighbourhood exit remains usable, while preserving the existing dark visual system and Gurugram demo setting.

## Changes
- Add shared Gurugram exit data and mode-aware Open, Risky, and Cut-off rules.
- Build `/exits` with neighbourhood and travel-mode selectors, an exit summary, ordered status cards, report links, and the Palam Vihar isolation warning with emergency actions.
- Add Exits beside Home in the bottom navigation.
- Replace the first Home content card with a Sector 29 exit summary linking to `/exits`, and use the greeting “Good morning”.
- Update `/map` so zone colors and its legend use the three exit statuses, controlled by the existing travel-mode selector.
- Update `/routes` to reject route alternatives touching cut-off roads, rank only usable alternatives, and display avoided cut-offs plus time added over the shortest route.
- Let `/reports` read an exit from the URL and prefill the blocked-location field.

## Technical details
- Exit status derives from the existing editable water-depth thresholds: Open at or below the safe threshold, Risky through the moderate threshold, and Cut-off above it.
- Route alternatives remain fetched once; travel-mode changes reclassify and reorder them locally.
- A safe route will never be presented for navigation if it intersects a Cut-off zone.
- Each affected route will retain unique page metadata and the final experience will be checked on mobile and desktop widths.
