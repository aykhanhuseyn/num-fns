# 0005 — Raw numbers, no decimal type

- **Status:** accepted, 2026-08-10 (precision closed 2026-09-20)
- **Source:** `todo.md §4` ("raw numbers", "precise arithmetic")

## Context

`0.1 + 0.2` is `0.30000000000000004`. A library can fix this with its own
decimal type or a bignum dependency, or it can accept and return plain
numbers.

## Decision

Functions take and return plain `number` (and `bigint` where the domain is
integer). There is no decimal type and no bignum dependency. The arithmetic,
stats and financial functions do not take a `locale`; callers format the
result with `formatNumber` or `formatMoney`.

## Consequences

- Inside, `add`, `round`, `sum` and the others read each number at its
  shortest decimal string, compute exactly with `BigInt`, and round once:
  `add(0.1, 0.2)` is `0.3`. `round` is the one rounding implementation.
- Operands are not range-limited. The only lossy step is the last conversion
  to `number`.
- A "precise" function never returns `Infinity`; it throws `RangeError`.
