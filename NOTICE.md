# Third-party notices

The MIT license in `LICENSE` covers the source code of Title Fight only. The
material below is not ours to license.

## Deezer

Song metadata, album artwork and audio previews are fetched at request time from
the [Deezer public API](https://developers.deezer.com) and streamed directly from
Deezer's CDN to the listener's browser. This project stores none of it: no audio
is cached or proxied, no more than 15 seconds is ever played, and only numeric
track IDs are persisted.

All of that content remains the property of its respective rights holders. Every
track links back to its page on Deezer. Title Fight is an unaffiliated fan
project and is not endorsed by Deezer.

## Instrument Serif

`assets/fonts/InstrumentSerif-Regular.ttf` is bundled so the server can draw the
"TF" monogram and Open Graph cards (`next/og` cannot read woff2 and has no access
to the CSS font stack).

Copyright 2022 The Instrument Serif Project Authors
<https://github.com/Instrument/instrument-serif>

Licensed under the SIL Open Font License, Version 1.1. The full text is included
at `assets/fonts/OFL.txt`.

## Webfonts

Instrument Serif, Inter and JetBrains Mono are served to the browser through
`next/font`, which self-hosts them at build time. All three are under the SIL
Open Font License, Version 1.1.

## Dependencies

Runtime and build dependencies carry their own licenses, recorded in
`pnpm-lock.yaml`. Run `pnpm licenses list` to enumerate them.
