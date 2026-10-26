## What and why

<!-- One or two sentences. Link the issue or the task id (for example 0.9-2). -->

## Checklist (definition of done)

- [ ] Tests: the default behaviour, at least one option, and every throw
- [ ] `bun run test:coverage` passes (100 % per file)
- [ ] JSDoc: summary, `@param`, `@returns`, `@throws`, `@example`, `@since` (`bun run check:jsdoc`)
- [ ] README and `site/src/registry.ts` updated (new or changed function)
- [ ] Changeset added (`bun changeset`), bump per `docs/versioning.md`
- [ ] `bun run size` passes
- [ ] Locale output changed? The golden snapshot diff touches only the intended lines, and the changeset shows before/after
- [ ] Hot code changed? `bun run bench` compared with `bench/BASELINE.md`
