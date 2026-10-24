---
"num-fns": minor
---

**Breaking:** require Node.js 20 or newer (`engines.node: >=20`). Node 18 is end-of-life
and is no longer in the smoke matrix (now 20, 22, 24). The README has a new
"Runtime support" section: ES2018 output, `BigInt` required, which browsers,
Bun, Deno, edge runtimes and React Native (Hermes 0.70+) that covers. Nothing
in the code changed; a Node 18 user very likely still works, but is no longer
promised.
