// TypeDoc 0.28 supports TypeScript up to 6.0, and it needs the TypeScript
// JavaScript API, which the native TypeScript 7 package does not have. This
// file runs TypeDoc with every `import 'typescript'` resolved to the
// TypeScript 6 package (`@typescript/old`, installed with
// `@typescript/typescript6`). Remove it when TypeDoc supports TypeScript 7.
//
// Usage: node scripts/typedoc.mjs [typedoc flags]
import { register } from 'node:module'

const target = import.meta.resolve('@typescript/old')
const hooks = `
const target = ${JSON.stringify(target)}
export async function resolve(specifier, context, next) {
  if (specifier === 'typescript') return { url: target, shortCircuit: true }
  return next(specifier, context)
}`
register(`data:text/javascript,${encodeURIComponent(hooks)}`, import.meta.url)

// Import the CLI module by path: it is not in TypeDoc's `exports` map, and
// `bin/typedoc` forks a child process, which would not get the hook above.
const cli = new URL('dist/cli.js', import.meta.resolve('typedoc/package.json'))
await import(cli.href)
