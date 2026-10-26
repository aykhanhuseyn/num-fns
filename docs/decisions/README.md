# Decisions

Architecture decision records. Each one is a decision that a newcomer (or
an AI assistant) is likely to propose again. Read the record before you
propose a change to it. To change a decision, add a new record that
replaces the old one; do not edit an accepted record.

| No. | Decision |
| --- | --- |
| [0001](0001-no-intl.md) | No `Intl` anywhere in the package |
| [0002](0002-default-locale-en.md) | The default locale is `en` |
| [0003](0003-colocated-tests.md) | Tests are colocated, no top-level `test/` |
| [0004](0004-no-format-parse-split.md) | No `format/` + `parse/` split, no `humanize/` |
| [0005](0005-raw-numbers-no-decimal-type.md) | Raw numbers, no decimal type or bignum dependency |
| [0006](0006-throw-not-nan.md) | Throw on bad input, do not return `NaN` |
| [0007](0007-locale-grouping.md) | Locale grouping, scale ladders and native digits |

`todo.md §N` in a record means a section of the frozen backlog,
[`docs/archive/todo-2026.md`](../archive/todo-2026.md).
