# Delivery Route Planner

A Simple program that groups delivery requests into vehicle trips, respecting a fixed 10 kg vehicle capacity limit, grouping by area where reasonably possible to maintain route efficiency, and prioritizing urgent deliveries.

## Requirements

- Node.js 16+ (no external dependencies — uses only built-in modules)

## Running

```bash
node src/main.js data/sample_deliveries.csv
```

Optional flags:

```bash
node src/main.js data/sample_deliveries.csv --out=summary.json
```

- `--out=<path>` — writes the full trip manifest, validation errors, and aggregate summary report as JSON.

Try the edge-case datasets:

```bash
node src/main.js data/edge_case_deliveries.csv
node src/main.js data/edge_case_deliveries_1.csv
```

## Input format

CSV with header `id,area,priority,weight`:

```csv
id,area,priority,weight
1,Nasr City,2,4.5
```

- `id`: unique positive integer identifying the delivery
- `area`: non-empty string representing the delivery zone
- `priority`: positive integer, lower = more urgent (`1` is the highest priority)
- `weight`: positive number, in kg (must not exceed 10 kg vehicle capacity)

## Project structure

```
src/
  parser.js    # reads & validates the CSV, separates malformed rows
  planner.js   # core grouping, packing (First-Fit), and lexicographical sorting
  main.js      # CLI entry point: orchestration + output
data/
  sample_deliveries.csv       # required sample input
  edge_case_deliveries.csv    # bonus file exercising edge cases (oversized items, multi-trip areas)
  edge_case_deliveries_1.csv  # bonus file exercising edge cases (lexicographical sorting & ID tie-breakers)
```

---

## Adding and Testing Custom Datasets

When forking or cloning this repository, follow these steps to add and test your own custom delivery CSV files:

### Step 1: Create your CSV file
Add your new CSV file directly inside the `data/` directory (for example, `data/my_deliveries.csv`).

### Step 2: Ensure the CSV follows the required format
The first line of your file **must** include the four required headers in any order:
```csv
id,area,priority,weight
1,Dokki,1,3.5
2,Dokki,2,4.0
3,Zamalek,1,8.0
4,Dokki,3,2.5
```

**Field Rules & Validation Constraints:**
- **`id`**: Unique positive integer for each row. Duplicate IDs or negative numbers will be flagged under `malformed`.
- **`area`**: Non-empty text string representing the delivery zone (e.g. `Maadi`, `Nasr City`).
- **`priority`**: Positive integer (`1, 2, 3...`), where `1` represents maximum urgency.
- **`weight`**: Positive number (in kg) representing package weight:
  - Deliveries $\le 10\text{ kg}$ will be packed into trips.
  - Deliveries $> 10\text{ kg}$ will be flagged under `rejected` (exceeds vehicle capacity).

### Step 3: Run the planner on your new dataset
Run the CLI passing your new file path:

```bash
node src/main.js data/my_deliveries.csv
```

### Step 4: (Optional) Generate the JSON summary report
To export the complete manifest and operational metrics to a JSON file:

```bash
node src/main.js data/my_deliveries.csv --out=summary.json
```

### Step 5: Review the results
- **Trip Breakdown**: Verify that trips are area-pure and ordered lexicographically by priority.
- **Rejected Deliveries**: Review any packages that exceeded the 10 kg limit.
- **Malformed Rows**: If any rows had missing fields, invalid types, or duplicate IDs, inspect their line numbers and error reasons.
- **Summary Metrics**: Check total planned weight, total trips created, and the `avgCapacityUtilizationPct`.

---

## Reasoning

### 1. Solution approach (in your own words)

The planning pipeline operates in deterministic stages:

1. **Input Parsing & Robust Validation (`src/parser.js`)**:
   - The CSV file is read and split into lines using native Node.js filesystem APIs.
   - Header fields are mapped dynamically by name (`id`, `area`, `priority`, `weight`).
   - Every row is validated: ensuring valid positive integer `id`, non-empty `area`, positive integer `priority`, positive numeric `weight`, and uniqueness of each `id`.
   - Malformed rows are isolated into a `malformed` array (with line numbers and descriptive error reasons) without aborting execution on valid deliveries.

2. **Feasibility Filtering (`src/planner.js`)**:
   - Valid deliveries are partitioned into plannable items and rejected items.
   - Any single delivery exceeding the fixed vehicle capacity (10 kg) cannot fit into any vehicle and is moved to `rejected`.

3. **Area Grouping**:
   - Plannable deliveries are grouped strictly by `area` using a `Map`. Trips are kept area-pure to prevent cross-city routing inefficiencies.

4. **Intra-Area Priority Sorting**:
   - Deliveries within each area group are sorted primarily by `priority` ascending (lower number = higher urgency: `1`, `2`, `3`...).
   - Equal priorities are tie-broken by `id` ascending to ensure deterministic ordering.

5. **Trip Packing (First-Fit Heuristic)**:
   - For each area group, deliveries are placed into trips using the **First-Fit** heuristic:
     - Iterate through the sorted deliveries.
     - Place each delivery into the first open trip for that area where `currentWeight + deliveryWeight <= 10 kg`.
     - If no existing trip has room, open a new trip for that area.
   - Accumulated weights are rounded to 2 decimal places to avoid floating-point inaccuracies.

6. **Inter-Trip Lexicographical Ordering & Tie-Breaking**:
   - After all area groups are packed, trips across all areas are ordered globally using a **lexicographical comparison on delivery priority**:
     - The delivery priorities in each trip are sorted ascending.
     - Trips are compared element-by-element (`aPriorities[i] - bPriorities[i]`).
     - If one trip's priorities match the prefix of another, the shorter trip takes precedence (`aPriorities.length - bPriorities.length`).
     - If two trips have identical priority lists and lengths, the tie is broken deterministically by selecting the trip with the **lowest delivery ID** (`Math.min(...trip.deliveries.map(d => d.id))`).
   - Finally, sequential trip numbers (`1, 2, ...`) are assigned.

### 2. Most difficult part

The most challenging aspects of designing this system were:

1. **Trip Ordering Fairness**:
   - Ranking trips solely by their minimum priority package (`Math.min`) introduced unfairness: a trip carrying one urgent package (Priority 1) alongside low-urgency cargo (Priority 5) would tie with a trip containing multiple urgent packages (Priority 1 and Priority 2), falling back to alphabetical area names.
   - Designing a lexicographical comparison resolved this by evaluating the entire urgency manifest of each trip sequentially.
2. **Graceful Error Handling without Halting**:
   - Designing a parser that isolates corrupt or malformed rows without failing the entire batch, allowing dispatchers to process all valid deliveries while clearly reporting bad data for correction.

### 3. Where the algorithm may not produce the best possible grouping

1. **Greedy First-Fit vs. Optimal Weight Packing (The Packing Efficiency Trade-Off)**:
   - Our algorithm uses a **greedy First-Fit** heuristic: it processes packages strictly in priority order and places each package into the very first open trip that has enough space. While this ensures urgent packages are packed first, it can create more trips than mathematically necessary compared to an optimal packing algorithm.
   - **Concrete Example**:
     Suppose vehicle capacity is **10 kg**, and we have 4 packages in the same area:
     - Package A: **3 kg** (Priority 1)
     - Package B: **5 kg** (Priority 2)
     - Package C: **7 kg** (Priority 3)
     - Package D: **5 kg** (Priority 4)
     - *Total weight* = $3 + 5 + 7 + 5 = 20\text{ kg}$.

     **What an optimal packing would do (2 trucks)**:
     An optimal solver looks at all package weights together and finds combinations that fill trucks completely:
     - Trip 1: Package A (3 kg) + Package C (7 kg) = **10 kg** (100% full)
     - Trip 2: Package B (5 kg) + Package D (5 kg) = **10 kg** (100% full)
     - $\rightarrow$ **Result: Only 2 trucks dispatched.**

     **What our First-Fit algorithm does (3 trucks)**:
     Our algorithm processes packages one by one in priority order (A $\rightarrow$ B $\rightarrow$ C $\rightarrow$ D):
     1. Package A (3 kg) opens **Trip 1** (has 7 kg remaining).
     2. Package B (5 kg) fits into **Trip 1** ($3 + 5 = 8\text{ kg}$, leaving **2 kg** remaining).
     3. Package C (7 kg) arrives. It cannot fit into Trip 1 (needs 7 kg, only 2 kg left), so it opens **Trip 2** ($7\text{ kg}$, leaving **3 kg** remaining).
     4. Package D (5 kg) arrives. It cannot fit into Trip 1 (only 2 kg left) and cannot fit into Trip 2 (only 3 kg left). It is forced to open **Trip 3** ($5\text{ kg}$).
     - $\rightarrow$ **Result: 3 trucks dispatched instead of 2**, leaving fragmented unused space across all three trucks ($2\text{ kg} + 3\text{ kg} + 5\text{ kg} = 10\text{ kg}$ wasted).

   - **Why this happens**: First-Fit greedily pairs packages based on whoever arrives first in priority order rather than checking if their weights combine efficiently. This is an intentional design choice to prioritize delivery urgency over pure space optimization, but it means the algorithm can dispatch extra vehicles with lower capacity utilization than a mathematical bin-packing solver would.
2. **Strict Categorical Area Boundaries**:
   - Two deliveries in different areas might be physically located across the street from each other on a neighborhood boundary. Because the algorithm treats areas as categorical keys without geographic distance data, it opens separate trips for them. Small delivery volumes in adjacent zones produce under-utilized vehicles that cannot share space.
3. **Trip Dispatch vs. Package Granularity (The "Hitchhiker" Inversion)**:
   - Vehicles are dispatched as single all-or-nothing units. Once a vehicle departs, every delivery inside it goes out together. When an open trip takes in a low-priority package to fill spare capacity, that low-priority package rides along with top-priority cargo and can reach recipients before moderate-priority packages waiting on subsequent trucks.
   - **Concrete Example**:
     Suppose we have two trucks ready at the depot:
     - **Truck 1 (Maadi)**:
       - Package #1: **Priority 1** (urgent medical sample, 5 kg)
       - Package #2: **Priority 5** (non-urgent marketing brochure, 4 kg)
       - *Total weight* = 9 kg. *Priorities* = `[1, 5]`.
     - **Truck 2 (Nasr City)**:
       - Package #3: **Priority 2** (urgent replacement part, 5 kg)
       - Package #4: **Priority 2** (urgent contract documents, 4 kg)
       - *Total weight* = 9 kg. *Priorities* = `[2, 2]`.

     **What happens during dispatch**:
     - Because Truck 1 contains a Priority 1 item, lexicographical comparison ranks Truck 1 ahead of Truck 2 (`1 < 2`).
     - **Truck 1 departs first**. The driver delivers Package #1 (Priority 1), and then immediately delivers Package #2 (Priority 5).
     - Meanwhile, **Truck 2 is still sitting at the depot** waiting to be dispatched.
     - $\rightarrow$ **The Inversion**: Package #2 (Priority 5) gets delivered **earlier** than Package #3 and Package #4 (both Priority 2), simply because it hitched a ride on Truck 1 to fill available capacity.

### 4. What would become slow/memory-intensive at 1,000,000 deliveries

At scale ($10^6$ deliveries), the current in-memory architecture would face significant bottlenecks:

1. **Entire File In-Memory Buffering**:
   - `fs.readFileSync` loads the entire file into a single string, and `.split(/\r?\n/)` generates an array of $1,000,000$ string elements. This creates immediate garbage collection pressure and can exceed Node's default V8 heap limit (~1.4 GB to 4 GB).
2. **In-Memory Object Overhead**:
   - Storing 1,000,000 individual delivery objects, plus intermediate arrays in `groupByArea` and trip arrays, consumes several gigabytes of heap memory.
3. **Quadratic Packing Inner Loop ($O(N \cdot K)$)**:
   - For an area containing $N$ deliveries that form $K$ trips, First-Fit checks open trips sequentially for every incoming delivery. In areas with thousands of trips, this linear scan results in up to $O(N \cdot K)$ comparisons.
4. **Sorting Overhead**:
   - Sorting millions of records in memory takes substantial CPU time ($O(N \log N)$), and the global trip sort compares arrays of delivery priorities for every pair of trips.

**Solutions for 1,000,000 deliveries:**
- **Streaming Parser**: Use Node.js streams and `readline` to process deliveries row-by-row with $O(1)$ memory consumption.
- **Indexed Trip Allocation**: Instead of linear scanning, maintain open trips in a balanced binary search tree or max-heap indexed by remaining capacity for $O(\log K)$ lookups.
- **External Sorting / Database**: Partition records by area using disk-backed chunks or an indexed database (e.g. SQLite / PostgreSQL).

### 5. What you'd improve with another day

With another day of development, the focus would be on grounded, practical enhancements that can be cleanly implemented on top of the existing architecture:

1. **Upgrade Greedy First-Fit to Optimal Weight Packing (Knapsack / Best-Fit Decreasing)**:
   - Replace the greedy First-Fit loop inside `packArea` with a **Best-Fit Decreasing** heuristic or a 0/1 Knapsack (Subset-Sum) dynamic programming solver.
   - For each area, find package combinations that sum as close to 10.0 kg as possible without violating priority order.
   - This directly solves the wasted space issue demonstrated in Question 3 (reducing the 3-truck scenario down to the optimal 2 trucks).
2. **Adjacent Area Aliasing / Overflow Merging**:
   - Introduce a simple configuration lookup for neighboring areas (e.g. `{ "Dokki": ["Mohandessin"], "Maadi": ["Degla"] }`).
   - If an area finishes packing with an under-filled trip (e.g. holding only 2 kg out of 10 kg), allow the planner to absorb leftover packages from an adjacent area rather than dispatching a nearly empty vehicle.
3. **Native Automated Unit Test Suite (`node:test`)**:
   - Add a zero-dependency test file `test/planner.test.js` using Node.js built-in `node:test` and `node:assert` modules.
   - Automated tests would cover:
     - Exact 10.0 kg boundary fills (e.g. $4.5\text{ kg} + 5.5\text{ kg}$).
     - Oversized package rejection (> 10 kg).
     - Lexicographical tie-breaking on delivery ID.
     - Malformed row isolation and descriptive error reporting.

---

## Extension feature: Detailed Summary Report (`--out`)

### Purpose & Rationale

In real-world logistics operations, human dispatchers and automated dispatch pipelines cannot rely solely on terminal console logs. Automated warehouse management systems (WMS), enterprise resource planning (ERP) platforms, driver mobile apps, and audit pipelines require structured, machine-readable manifests.

The `--out=<path>` extension feature serializes the full operational output of the planning run into a standardized, machine-readable JSON format.

### Command-Line Usage

```bash
node src/main.js data/sample_deliveries.csv --out=summary.json
```

### Report Structure & Schema

The output JSON file contains four primary top-level sections:

```json
{
  "trips": [ ... ],
  "rejected": [ ... ],
  "malformed": [ ... ],
  "summary": { ... }
}
```

#### 1. `trips` (Array of Planned Trips)
Contains the ordered list of generated trips ready for driver dispatch:
- `tripNumber`: Sequential dispatch order (`1, 2, ...`), determined by lexicographical priority comparison.
- `area`: The delivery zone this vehicle is dedicated to.
- `deliveries`: Array of delivery objects assigned to this trip (`id`, `area`, `priority`, `weight`).
- `totalWeight`: Total payload weight in kilograms (guaranteed $\le 10$ kg, rounded to 2 decimal places).

#### 2. `rejected` (Array of Unplannable Deliveries)
Lists valid delivery requests that exceed the fixed 10 kg vehicle limit (`weight > 10`). These items cannot be safely placed in any vehicle and require special handling (e.g., splitting into multiple packages or assigning heavy freight transport).

#### 3. `malformed` (Array of Input Errors)
Contains detailed error diagnostics for CSV rows that violated validation rules (e.g. non-numeric IDs, missing areas, non-positive weights, duplicate IDs). Each entry includes:
- `line`: The exact line number in the CSV file for fast debugging.
- `reason`: Explanation of why the row was rejected (e.g. `"duplicate id"`, `"invalid priority"`).
- `raw`: The raw line content as read from the file.

#### 4. `summary` (Aggregate Operations Dashboard)
Provides high-level operational KPIs for fleet and dispatch management:

```json
{
  "totalDeliveriesInput": 9,
  "deliveriesPlanned": 8,
  "malformedRows": 0,
  "rejectedDeliveries": 1,
  "tripsCreated": 5,
  "totalWeightKg": 34,
  "vehicleCapacityKg": 10,
  "avgCapacityUtilizationPct": 68
}
```

- **`totalDeliveriesInput`**: Total plannable plus rejected delivery rows.
- **`deliveriesPlanned`**: Successfully scheduled deliveries.
- **`malformedRows`**: Total corrupted CSV input lines skipped.
- **`rejectedDeliveries`**: Total oversized deliveries rejected.
- **`tripsCreated`**: Total vehicles/trips required.
- **`totalWeightKg`**: Cumulative weight of all scheduled cargo.
- **`vehicleCapacityKg`**: The fixed 10 kg capacity limit per vehicle.
- **`avgCapacityUtilizationPct`**: **Fleet Capacity Utilization Metric**:
  $$\text{avgCapacityUtilizationPct} = \frac{\text{totalWeightKg}}{\text{tripsCreated} \times 10\text{ kg}} \times 100$$
  This metric quantifies fleet efficiency. It shows dispatchers exactly how close vehicles are to full capacity across all trips, highlighting the operational cost of maintaining area purity and priority-first loading.

