# Security policy

## Supported versions

Only the latest published version gets security fixes. Before 1.0.0 that is
the latest `0.x` release.

## Report a problem

Do not open a public issue. Report it privately in one of these ways:

- GitHub: **Security → Report a vulnerability** on this repository
  (private vulnerability reporting).
- Email: aykhanrh@gmail.com, with `num-fns security` in the subject.

Include the version, the code that shows the problem, and its effect.

## What happens next

- We confirm that we received the report within 7 days.
- We fix the problem, or explain why it is not one, within 90 days.
- We publish an advisory and a fixed version, and credit you if you want.
  Please do not disclose the problem before the fix or before the 90 days
  end.

`num-fns` has no runtime dependency, does not read files and does not use
the network, but a parser that hangs or uses too much memory on a crafted
string is a security problem. Please report it.
