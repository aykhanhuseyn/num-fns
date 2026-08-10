// https://commitlint.js.org/reference/configuration.html
// Enforces Conventional Commits (https://www.conventionalcommits.org/) — see
// CONTRIBUTING.md's "Commit message style" section for the types/scopes this
// project uses in practice. Runs automatically on every commit via lefthook's
// `commit-msg` hook (lefthook.yml).
export default {
  extends: ['@commitlint/config-conventional'],
}
