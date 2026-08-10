import { buildSnippet, defaultValues, type FieldValues, runExample } from './engine'
import { renderField } from './form'
import { renderResult } from './render'
import type { FunctionExample } from './types'

const REPO_BLOB_URL = 'https://github.com/aykhanhuseyn/num-fns/blob/main'

export function renderExampleCard(example: FunctionExample): HTMLElement {
  const state: FieldValues = defaultValues(example.fields)

  const article = document.createElement('article')
  article.className = 'fn-card'
  article.id = example.id

  const header = document.createElement('header')
  header.className = 'fn-card-header'

  const title = document.createElement('h3')
  title.textContent = example.name
  header.appendChild(title)

  const signature = document.createElement('code')
  signature.className = 'fn-signature'
  signature.textContent = example.signature
  header.appendChild(signature)

  article.appendChild(header)

  const description = document.createElement('p')
  description.className = 'fn-desc'
  description.textContent = example.description
  article.appendChild(description)

  const playground = document.createElement('div')
  playground.className = 'playground'

  const form = document.createElement('div')
  form.className = 'fields'
  playground.appendChild(form)

  const output = document.createElement('div')
  output.className = 'output'

  const resultLabel = document.createElement('div')
  resultLabel.className = 'output-label'
  resultLabel.textContent = 'Result'
  output.appendChild(resultLabel)

  const resultBox = document.createElement('div')
  resultBox.className = 'playground-result'
  output.appendChild(resultBox)

  const snippetPre = document.createElement('pre')
  snippetPre.className = 'snippet'
  const snippetCode = document.createElement('code')
  snippetPre.appendChild(snippetCode)
  output.appendChild(snippetPre)

  playground.appendChild(output)
  article.appendChild(playground)

  const sourceLink = document.createElement('a')
  sourceLink.className = 'fn-source-link'
  sourceLink.href = `${REPO_BLOB_URL}/${example.sourceFile}`
  sourceLink.target = '_blank'
  sourceLink.rel = 'noreferrer'
  sourceLink.textContent = `Source: ${example.sourceFile}`
  article.appendChild(sourceLink)

  function update(): void {
    const result = runExample(example, state)
    renderResult(resultBox, result)
    snippetCode.textContent = buildSnippet(example, state)
  }

  for (const field of example.fields) {
    const control = renderField(field, state[field.id] ?? field.default, (id, value) => {
      state[id] = value
      update()
    })
    form.appendChild(control)
  }

  update()

  return article
}
