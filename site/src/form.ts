import type { FieldDef } from './types'

export type FieldChangeHandler = (id: string, value: string | number | boolean) => void

export function renderField(
  field: FieldDef,
  value: string | number | boolean,
  onChange: FieldChangeHandler,
): HTMLElement {
  const wrapper = document.createElement('label')
  wrapper.className = `field field-${field.kind}`

  const labelText = document.createElement('span')
  labelText.className = 'field-label'
  labelText.textContent = field.label
  wrapper.appendChild(labelText)

  wrapper.appendChild(buildControl(field, value, onChange))

  return wrapper
}

function buildControl(
  field: FieldDef,
  value: string | number | boolean,
  onChange: FieldChangeHandler,
): HTMLElement {
  if (field.kind === 'select') return buildSelect(field, value, onChange)
  if (field.kind === 'boolean') return buildCheckbox(field, value, onChange)
  return buildTextOrNumber(field, value, onChange)
}

function buildSelect(
  field: FieldDef,
  value: string | number | boolean,
  onChange: FieldChangeHandler,
): HTMLElement {
  const select = document.createElement('select')
  for (const option of field.selectOptions ?? []) {
    const optionEl = document.createElement('option')
    optionEl.value = option.value
    optionEl.textContent = option.label
    if (option.value === String(value)) optionEl.selected = true
    select.appendChild(optionEl)
  }
  select.addEventListener('change', () => onChange(field.id, select.value))
  return select
}

function buildCheckbox(
  field: FieldDef,
  value: string | number | boolean,
  onChange: FieldChangeHandler,
): HTMLElement {
  const input = document.createElement('input')
  input.type = 'checkbox'
  input.checked = Boolean(value)
  input.addEventListener('change', () => onChange(field.id, input.checked))
  return input
}

function buildTextOrNumber(
  field: FieldDef,
  value: string | number | boolean,
  onChange: FieldChangeHandler,
): HTMLElement {
  const input = document.createElement('input')
  input.type = field.kind === 'number' ? 'number' : 'text'
  if (field.step) input.step = field.step
  if (field.placeholder) input.placeholder = field.placeholder
  input.value = String(value)
  input.addEventListener('input', () => onChange(field.id, input.value))
  return input
}
