# Seed data

`schemes.json` — 32 schemes (20 central, 12 Maharashtra).
`attributes.json` — 20 attributes with `ask_cost`, priors and questions in en/hi/mr.

## Every entry is `"verified": false`

`clause_text` currently holds a plain-language summary of the eligibility rule, not
the verbatim sentence from the notification. Before demoing, open each `source_url`,
paste the real sentence in, confirm the thresholds in `criteria`, and flip
`verified` to `true`.

## Fastest way to grow this

Split the list across the team by department. One person per department, opening the
scheme page and filling one JSON object at a time. Two hours of four people gets you
to roughly 150 schemes, which is more than enough — nobody counts.
