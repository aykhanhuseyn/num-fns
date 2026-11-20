import { hasOptions, type OptionDoc, optionField, optionsFor } from './options'
import { categories } from './registry'
import type { Category, FieldDef, FunctionExample } from './types'

/**
 * The registry (`registry.ts`) plus the options table (`options.ts`): every
 * function with the full list of its options, each one a playground control.
 * The registry keeps its hand-tuned fields and defaults; any option it does
 * not declare is appended here, unset, so the docs and the playground always
 * agree with the library about what a function accepts.
 */
export interface Entry extends FunctionExample {
  category: Category
  options: OptionDoc[]
  /** Whether the function reads `options.locale`, so a locale comparison makes sense. */
  localized: boolean
}

function optionKey(field: FieldDef): string | undefined {
  return field.arg.kind === 'option' ? field.arg.key : undefined
}

function complete(example: FunctionExample, category: Category): Entry {
  const options = optionsFor(example.name)
  const declared = new Map<string, FieldDef>()
  for (const field of example.fields) {
    const key = optionKey(field)
    if (key === undefined) continue
    if (!options.some((doc) => doc.key === key)) {
      throw new Error(`catalog: ${example.name} has option "${key}" with no entry in options.ts`)
    }
    declared.set(key, field)
  }
  const inputs = example.fields.filter((field) => field.arg.kind !== 'option')
  const optionFields = options.map((doc) => declared.get(doc.key) ?? optionField(doc))
  return {
    ...example,
    fields: [...inputs, ...optionFields],
    category,
    options,
    localized: options.some((doc) => doc.key === 'locale'),
  }
}

export const entries: Entry[] = categories.flatMap((category) =>
  category.examples.map((example) => {
    if (!hasOptions(example.name) && example.fields.some((field) => field.arg.kind === 'option')) {
      throw new Error(`catalog: ${example.name} declares options but options.ts lists none`)
    }
    return complete(example, category)
  }),
)

export const entryById: ReadonlyMap<string, Entry> = new Map(
  entries.map((entry) => [entry.id, entry]),
)

export { categories }
