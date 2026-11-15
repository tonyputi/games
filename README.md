# Games

PR CI checks the standalone JavaScript syntax and builds Lavi Rinto.

## Dependabot automation

After PR CI succeeds, Dependabot updates can enable native squash auto-merge.
Human CODEOWNER review and required checks remain mandatory. Before activation,
require `Build and syntax`, enable auto-merge and squash, and configure the
repository-scoped GitHub App with Contents and Pull requests write, `GH_APP_ID`
and `GH_APP_PRIVATE_KEY`, without ruleset bypass. See the
[shared workflow prerequisites](https://github.com/tonyputi/.github#dependabot-auto-merge).
