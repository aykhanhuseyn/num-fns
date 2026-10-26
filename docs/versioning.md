# Versioning

`num-fns` follows [semantic versioning](https://semver.org). This page says
which bump a change gets, for code and for locale data. Every change has a
changeset (`bun changeset`) with this bump.

Before 1.0.0, a breaking change is a minor bump (0.x), and every breaking
change lands in the earliest milestone (see `ROADMAP.md`). From 1.0.0 the
table below applies as written.

## Patch

- A bug fix that makes a function do what its documentation says.
- A locale word correction: a misspelled or wrong word, a wrong plural or
  gender form. Example: a native speaker corrects a Russian ordinal.
- Documentation, tests, build and tooling with no change to the published
  output.
- A performance change with the same output.

## Minor

- A new exported function.
- A new locale.
- A new optional field on `Locale` or on an options interface. Omitting it
  keeps the old output.
- A new currency code in `CurrencyCode`. (A wider union can break an
  exhaustive `switch` in user code. Task 0.9-1 reviews this rule before 1.0.)
- A change to a locale's default format (separator, symbol position,
  spacing). The changeset shows the output before and after.
- A new `@deprecated` tag. The old name keeps working until the next major.

## Major

- A removed or renamed export.
- A new required field on `Locale` (a custom locale stops compiling).
- A changed thrown error type, or a function that throws where it did not
  (see `docs/decisions/0006-throw-not-nan.md`).
- A changed default locale (see `docs/decisions/0002-default-locale-en.md`).
- A changed parameter or return type that existing callers can see.
- A higher minimum Node version (`engines`).

## When it is not clear

- Output that changes because a bug is fixed is a patch, even when a user
  pinned the wrong output in a test. Say so in the changeset.
- Output that changes because we prefer a different style is not a bug fix:
  it is a minor (locale default) or a major (engine behaviour).
- Ask in the pull request. The reviewer decides and writes the reason in the
  changeset.
