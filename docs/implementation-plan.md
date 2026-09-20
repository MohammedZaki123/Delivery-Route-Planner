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
2. Accept an output path through `--out=<path>`.
3. Include structured manifests for trips, rejected deliveries, and malformed rows.
4. Add comprehensive aggregate operational metrics.
5. Write the complete manifest and summary as formatted JSON.

### Implementation

- The `--out=<path>` option is handled by `src/main.js`.
- The generated JSON report contains:
  - `trips`: sequential trip manifests with area, assigned deliveries, and total weight.
  - `rejected`: deliveries exceeding the fixed 10 kg vehicle limit.
  - `malformed`: input rows failing CSV syntax or schema validation, including line numbers and error reasons.
  - `summary`: operational KPI dashboard including total inputs, planned deliveries, trip count, total weight, vehicle capacity (10 kg), and fleet capacity utilization percentage:
    $$\text{avgCapacityUtilizationPct} = \frac{\text{totalWeightKg}}{\text{tripsCreated} \times 10\text{ kg}} \times 100$$
- The extension uses Node.js native filesystem APIs (`fs.writeFileSync`).
- The core parsing, validation, and packing logic remains modular and decoupled from output formatting.

## Phase 7: README and Reasoning Answers

### Logical steps

1. Document requirements and execution commands for `src/main.js`.
2. Explain the CSV input format and optional command-line flags (`--out`).
3. Describe the project structure including all source and test data files.
4. Provide comprehensive answers for all 5 reasoning questions:
   - Solution approach across all phases.
   - Most difficult part (trade-offs between area purity, capacity utilization, and urgency fairness).
   - Heuristic limitations (greedy First-Fit vs. optimal bin packing, categorical area boundaries, trip-level dispatch).
   - Scalability challenges and architectural mitigations for 1,000,000 deliveries (streaming, indexed packing, external sort).
5. Document the extension feature with schema details and operational significance.
6. Provide step-by-step instructions for adding and testing custom datasets when forking the repository.

### Implementation

- `README.md` documents Node.js 16+ requirements and CLI usage.
- The README provides explicit documentation for:
  - Robust parsing and non-blocking malformed row isolation
  - Area-first grouping for spatial purity
  - First-Fit packing respecting the fixed 10 kg capacity limit
  - Inter-trip lexicographical priority sorting with lowest delivery ID tie-breaking
  - JSON summary manifest generation and fleet capacity utilization KPI
- All reasoning questions in the README are answered thoroughly, detailing operational trade-offs, algorithmic complexity, and scalable production architecture.
- Documented complexity:
  - Parsing: $O(N)$
  - Sorting: $O(N \log N)$ overall
  - Packing: $O(N \cdot K)$ where $K$ is the number of open trips per area (optimizable to $O(N \log K)$ with indexed search).