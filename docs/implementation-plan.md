# Implementation Plan

## Phase 1: Data Model, CSV Parsing, and Sample Input

### Logical steps

1. Define the delivery model using `id`, `area`, `priority`, and `weight`.
2. Read the CSV file from the command line.
3. Parse the header and data rows.
4. Convert `priority` to an integer and `weight` to a number.
5. Provide sample and edge-case input files.

### Implementation

- `src/parser.js` reads the CSV using Node.js built-in modules.
- Each valid row becomes a delivery object:

  ```js
  {
    id,
    area,
    priority,
    weight
  }
  ```

- `data/sample_deliveries.csv` provides normal input.
- `data/edge_case_deliveries.csv` exercises invalid and boundary cases.
- No external dependencies are required.

## Phase 2: Validation and Edge Cases

### Logical steps

1. Check that each row has the expected number of fields.
2. Ensure `id` and `area` are present.
3. Ensure `priority` is a positive integer.
4. Ensure `weight` is a positive number.
5. Separate malformed rows from rejected deliveries.

### Implementation

- `src/parser.js` validates each row while parsing.
- Malformed rows are returned separately with their row number and reason.
- Valid deliveries continue to the planning stage.
- The planner rejects oversized deliveries rather than placing them in invalid trips.
- Empty input, missing values, invalid numbers, and malformed CSV rows are handled explicitly.