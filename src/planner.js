'use strict';

const VEHICLE_CAPACITY_KG = 10;


function groupByArea(deliveries) {
  const groups = new Map();
  for (const d of deliveries) {
    if (!groups.has(d.area)) groups.set(d.area, []);
    groups.get(d.area).push(d);
  }
  return groups;
}

function sortByPriorityThenId(deliveries) {
  return [...deliveries].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.id - b.id;
  });
}

function packArea(area, sortedDeliveries, capacity = VEHICLE_CAPACITY_KG) {
  const trips = [];

  for (const delivery of sortedDeliveries) {
    let placed = false;

    for (const trip of trips) {
      if (trip.totalWeight + delivery.weight <= capacity) {
        trip.deliveries.push(delivery);
        // rounding to 2 decimal places to avoid floating point precision issues
        trip.totalWeight = roundto2(trip.totalWeight + delivery.weight);
        placed = true;
        break;
      }
    }

    if (!placed) {
      trips.push({
        area,
        deliveries: [delivery],
        totalWeight: delivery.weight,
      });
    }
  }

  return trips;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}
const roundto2 = round2;

function planTrips(deliveries, capacity = VEHICLE_CAPACITY_KG) {
  const rejected = deliveries.filter((d) => d.weight > capacity);
  const valid = deliveries.filter((d) => d.weight <= capacity);

  const groups = groupByArea(valid);
  let trips = [];

  for (const [area, list] of groups) {
    const sorted = sortByPriorityThenId(list);
    trips = trips.concat(packArea(area, sorted, capacity));
  }

  // Order trips overall by lexicographical comparison on delivery priority,
  // breaking ties with the lowest delivery id in each trip.
  trips.sort((a, b) => {
    const aPriorities = a.deliveries.map((d) => d.priority).sort((x, y) => x - y);
    const bPriorities = b.deliveries.map((d) => d.priority).sort((x, y) => x - y);

    const minLen = Math.min(aPriorities.length, bPriorities.length);
    for (let i = 0; i < minLen; i++) {
      if (aPriorities[i] !== bPriorities[i]) {
        return aPriorities[i] - bPriorities[i];
      }
    }

    if (aPriorities.length !== bPriorities.length) {
      return aPriorities.length - bPriorities.length;
    }

    const aMinId = Math.min(...a.deliveries.map((d) => Number(d.id)));
    const bMinId = Math.min(...b.deliveries.map((d) => Number(d.id)));
    return aMinId - bMinId;
  });

  trips.forEach((trip, i) => {
    trip.tripNumber = i + 1;
  });

  return { trips, rejected };
}

function buildSummary(deliveries, trips, rejected, malformed, capacity = VEHICLE_CAPACITY_KG) {
  const totalWeight = round2(trips.reduce((sum, t) => sum + t.totalWeight, 0));
  const maxPossibleWeight = trips.length * capacity;
  const utilizationPct = trips.length
    ? round2((totalWeight / maxPossibleWeight) * 100)
    : 0;

  return {
    totalDeliveriesInput: deliveries.length + rejected.length,
    deliveriesPlanned: deliveries.length,
    malformedRows: malformed.length,
    rejectedDeliveries: rejected.length,
    tripsCreated: trips.length,
    totalWeightKg: totalWeight,
    vehicleCapacityKg: capacity,
    avgCapacityUtilizationPct: utilizationPct,
  };
}

module.exports = {
  VEHICLE_CAPACITY_KG,
  planTrips,
  buildSummary,
};
