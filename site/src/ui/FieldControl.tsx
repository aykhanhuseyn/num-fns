import { type ReactNode, useId } from 'react'
import type { FieldValue } from '../engine'
import type { OptionDoc } from '../options'
import type { FieldDef } from '../types'

/**
 * One labelled control for a playground field. Numbers use a text input
 * (`inputMode="decimal"`) rather than `type="number"`, so a value like
 * `1234567890123456789` (for the bigint path), `-0` or `Infinity` (for the
 * error path) can be typed as it is.
 */
export function FieldControl({
  field,
  value,
  doc,
  onChange,
}: {
  field: FieldDef
  value: FieldValue
  doc?: OptionDoc
  onChange: (value: FieldValue) => void
}): ReactNode {
  const id = useId()
  const hintId = `${id}-hint`
  const hint = doc ? `${doc.type} · default: ${doc.defaultValue}` : undefined

  if (field.kind === 'boolean') {
    return (
      <div className="field field-check">
        <label className="check" htmlFor={id}>
          <input
            id={id}
            type="checkbox"
            checked={value === true}
            onChange={(event) => onChange(event.target.checked)}
            aria-describedby={hint ? hintId : undefined}
          />
          {field.label}
        </label>
        {hint && (
          <span id={hintId} className="field-hint">
            {hint}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {field.label}
      </label>
      {field.kind === 'select' ? (
        <select
          id={id}
          value={String(value)}
          onChange={(event) => onChange(event.target.value)}
          aria-describedby={hint ? hintId : undefined}
        >
          {(field.selectOptions ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type="text"
          inputMode={field.kind === 'number' ? 'decimal' : undefined}
          spellCheck={false}
          autoComplete="off"
          value={String(value)}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value)}
          aria-describedby={hint ? hintId : undefined}
        />
      )}
      {hint && (
        <span id={hintId} className="field-hint">
          {hint}
        </span>
      )}
    </div>
  )
}
