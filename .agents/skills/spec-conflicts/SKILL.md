---
name: spec-conflicts
description: Detect file-level conflicts between active specs by cross-referencing "Components Affected". Detection only — sequencing is a human decision.
---

Execute the /spec-conflicts command defined in .sdd/workflow.md.

For each pair of active specs, use exact paths from the "Components Affected" table's `Exact path` column. Do not infer conflicts from prose or notes. Report paths that appear in multiple active specs with write roles, including the specs and roles. Suggest sequencing without making the decision.
