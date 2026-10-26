// JSDoc audit (task 0.8-2). Reads the TypeDoc JSON model of the public API
// and fails when a public export does not have the documentation that the
// definition of done asks for:
//
// - every function signature: a summary, a comment on every parameter and
//   `@returns`; the first signature of a function also `@throws`, `@example`
//   and `@since` (later overloads show the same throws, examples and version);
// - every interface, type alias and variable: a summary and `@since`; a
//   variable (the locale objects) also `@example`;
// - no public comment mentions `todo.md` or a date: those mean nothing to a
//   user. Internal comments can keep them.
//
// Usage: bun run check:jsdoc (makes the JSON model first).
import { readFileSync } from 'node:fs'

const file = process.argv[2] ?? 'node_modules/.cache/typedoc/api.json'
const api = JSON.parse(readFileSync(file, 'utf8'))

// ReflectionKind values from TypeDoc's model.
const MODULE = 2
const VARIABLE = 32
const FUNCTION = 64
const INTERFACE = 256
const TYPE_ALIAS = 2097152

const TODO_REFERENCE = /todo\.md/
const DATE = /\b20\d\d-\d\d(-\d\d)?\b/

const problems = []
const text = (parts = []) => parts.map((part) => part.text).join('')
const tags = (comment) => new Set((comment?.blockTags ?? []).map((tag) => tag.tag))
const hasSummary = (comment) => comment !== undefined && text(comment.summary).trim() !== ''

function checkText(where, comment) {
  if (comment === undefined) return
  const all = [
    text(comment.summary),
    ...(comment.blockTags ?? []).map((tag) => text(tag.content)),
  ].join(' ')
  if (TODO_REFERENCE.test(all)) problems.push(`${where}: mentions todo.md`)
  if (DATE.test(all)) problems.push(`${where}: has a date`)
}

function require(where, comment, names) {
  const present = tags(comment)
  for (const name of names) if (!present.has(name)) problems.push(`${where}: no ${name}`)
}

function checkMembers(where, node) {
  for (const member of node.children ?? []) {
    checkText(`${where}.${member.name}`, member.comment)
    for (const signature of member.signatures ?? [])
      checkText(`${where}.${member.name}`, signature.comment)
  }
}

function checkFunction(where, node) {
  const signatures = node.signatures ?? []
  for (const [index, signature] of signatures.entries()) {
    const at = signatures.length > 1 ? `${where} (overload ${index + 1})` : where
    const comment = signature.comment
    if (!hasSummary(comment)) problems.push(`${at}: no summary`)
    require(at, comment, index === 0 ? ['@returns', '@throws', '@example', '@since'] : ['@returns'])
    checkText(at, comment)
    for (const parameter of signature.parameters ?? []) {
      if (!hasSummary(parameter.comment)) problems.push(`${at}: no @param ${parameter.name}`)
      checkText(`${at}(${parameter.name})`, parameter.comment)
    }
  }
}

function checkDeclaration(where, node) {
  if (!hasSummary(node.comment)) problems.push(`${where}: no summary`)
  require(where, node.comment, node.kind === VARIABLE ? ['@since', '@example'] : ['@since'])
  checkText(where, node.comment)
  checkMembers(where, node)
}

function walk(node, moduleName) {
  for (const child of node.children ?? []) {
    const where = `${moduleName}.${child.name}`
    if (child.kind === MODULE) walk(child, child.name)
    else if (child.kind === FUNCTION) checkFunction(where, child)
    else if ([INTERFACE, TYPE_ALIAS, VARIABLE].includes(child.kind)) checkDeclaration(where, child)
  }
}

walk(api, api.name)

if (problems.length > 0) {
  for (const problem of problems) console.error(`check-jsdoc: ${problem}`)
  console.error(`check-jsdoc: ${problems.length} problem(s)`)
  process.exit(1)
}
console.log('check-jsdoc: every public export is documented')
