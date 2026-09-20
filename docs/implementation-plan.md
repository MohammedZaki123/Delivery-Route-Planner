# Implementation Plan

## Phase 1: Data Model, CSV Parsing, and Sample Input

### Logical steps

1. Define the delivery model using `id`, `area`, `priority`, and `weight`.
2. Read the CSV file from the command line.
3. Parse the header and data rows.
4. Convert `priority`, `weight`, `id` to a number.
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
2. Ensure `id` is a positive number
3. Ensure `area` are present.
4. Ensure `priority` is a positive integer.
5. Ensure `weight` is a positive number.
6. Separate malformed rows from rejected deliveries.

### Implementation

- `src/parser.js` validates each row while parsing.
- Malformed rows are returned separately with their row number and reason.
- Valid deliveries continue to the planning stage.
- The planner rejects oversized deliveries rather than placing them in invalid trips.
- Empty input, missing values, invalid numbers, and malformed CSV rows are handled explicitly.

## Phase 3: Sorting Logic

### Logical steps

1. Group deliveries by area.
2. Sort deliveries within each area by urgency (priority ascending).
3. Use delivery ID as a deterministic tie-breaker within area groups.
4. Order completed trips overall using a lexicographical comparison on delivery priority.
5. In case of a tie between trips, choose the trip with the lowest delivery ID.

### Implementation

- `src/planner.js` groups deliveries by their `area`.
- Within each area, lower `priority` values are processed first.
- Equal priorities are resolved using the delivery ID.
- The final trip list is ordered via a lexicographical comparison of each trip's delivery priorities (ascending):
  - Delivery priorities are compared element-by-element across trips.
  - If one trip's priorities form a proper prefix of another's, the shorter trip takes precedence.
  - If delivery priorities are identical, the tie is broken by selecting the trip containing the lowest delivery ID (`Math.min(...trip.deliveries.map(d => d.id))`).
- This prioritizes trips containing urgent deliveries more accurately than a simple minimum-priority check while maintaining area purity (no mixed areas).

## Phase 4: Grouping and Packing Algorithm

### Logical steps

1. Fix the vehicle capacity to 10 kg.
2. Process deliveries area by area.
3. Pack deliveries into trips without exceeding vehicle capacity (10 kg).
4. Preserve area purity where possible.
5. Track rejected deliveries and trip totals.

### Implementation

- `src/planner.js` implements the core grouping and packing behavior using a fixed 10 kg vehicle capacity.
- Deliveries are grouped by area before packing.
- A first-fit strategy places each delivery into an existing compatible trip when capacity allows.
- If no trip has enough remaining capacity, a new trip is created.
- Each trip stores its area, deliveries, total weight, and remaining capacity.
- Deliveries heavier than the 10 kg capacity are rejected.
- The algorithm is greedy and does not guarantee optimal bin packing.

## Phase 5: Output Formatting

### Logical steps

1. Display generated trips in a readable format.
2. Show trip area, deliveries, total weight, and capacity usage.
3. Report rejected deliveries and malformed rows.
4. Include aggregate planning statistics.
5. Keep console output separate from data generation.

### Implementation

- `src/main.js` acts as the CLI entry point.
- It parses command-line arguments, invokes the parser and planner, and formats the result.
- Console output presents the trips and validation results.
- The output includes total deliveries, total weight, number of trips, and capacity utilization.
- Errors are reported without hiding valid planning results.

## Phase 6: Extension Feature

### Logical steps

1. Add an optional machine-readable output mode.
2. Accept an output path through `--out`.
3. Include trips and validation results in the report.
4. Add aggregate statistics.
5. Write the report as JSON.

### Implementation

- The `--out=<path>` option is handled by `src/index.js`.
- The generated JSON report contains:
  - Trips
  - Rejected deliveries
  - Malformed rows
  - Total delivery weight
  - Trip count
  - Capacity utilization percentage
- The extension uses Node.js file-system APIs.
- The core parsing, validation, and packing logic remains unchanged.

## Phase 7: README and Reasoning Answers

### Logical steps

1. Document requirements and execution commands.
2. Explain the CSV format and command-line options.
3. Describe the project structure.
4. Explain sorting and packing decisions.
5. Document limitations and scalability concerns.
6. Describe possible future improvements.
7. Complete all reasoning questions in the README.

### Implementation

- `README.md` documents Node.js 16+ requirements and CLI usage.
- The README explains:
  - Area-first grouping
  - Priority-based sorting
  - First-fit packing
  - JSON summary output
- The reasoning answers explain that:
  - Area grouping reduces unnecessary cross-area mixing.
  - Lower priority values represent more urgent deliveries.
  - First-fit packing is simple and deterministic but not globally optimal.
  - Large inputs may require streaming parsing, reduced in-memory grouping, and a more efficient trip lookup.
  - Future improvements could include geographic optimization, configurable grouping policies, and optimal or approximation-based packing strategies.
- The documented complexity is approximately:
  - Parsing: `O(n)`
  - Sorting: `O(n log n)` overall
  - Packing: dependent on the number of open trips, potentially `O(n · k)`