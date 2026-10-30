import type { Bom, BomCosting } from "@/features/bom/types";

export const money = (amount: number) => ({ amount, currency: "CAD" });
export const costing: BomCosting = {
  totalCost: money(22.412666667),
  yieldQuantity: 4,
  knownSubtotal: money(22.412666667),
  componentSubtotal: money(5.246),
  activitySubtotal: money(17.166666667),
  complete: true,
  components: [
    {
      label: "Farine",
      status: "KNOWN",
      amount: money(5.246),
      quantity: 100,
      unit: "g",
      hourlyRate: null,
      source: {
        selectedOfferId: "c3b944dc-1263-4d07-a08e-520eb468ddea",
        usedOfferId: "c3b944dc-1263-4d07-a08e-520eb468ddea",
        observedAt: "2026-10-27T10:30:00.123456",
        packagePrice: money(10.492),
        packageQuantity: 200,
        packageUnit: "g",
      },
      diagnostics: [],
    },
  ],
  activities: [
    {
      label: "PREP",
      status: "KNOWN",
      amount: money(17.166666667),
      quantity: 40,
      unit: "min",
      hourlyRate: money(25.75),
      source: null,
      diagnostics: [],
    },
  ],
  diagnostics: [],
};

export const missingCosting: BomCosting = {
  ...costing,
  complete: false,
  totalCost: null,
  knownSubtotal: money(5.246),
  activitySubtotal: money(0),
  activities: [
    {
      ...costing.activities[0],
      status: "MISSING",
      amount: null,
      hourlyRate: null,
      diagnostics: [
        {
          code: "ACTIVITY_RATE_MISSING",
          source: "PREP",
          message: "Taux horaire absent",
          blocking: true,
        },
      ],
    },
  ],
  diagnostics: [
    {
      code: "ACTIVITY_RATE_MISSING",
      source: "PREP",
      message: "Taux horaire absent",
      blocking: true,
    },
  ],
};

export const bom: Bom = {
  id: "bom-1",
  name: "Pâte à pain",
  description: "Une composition de test",
  imageUrl: "https://example.com/image.jpg",
  type: "FOOD",
  components: [],
  activities: [],
  instructions: "Mélanger",
  yield: { quantity: 4, unit: "portion" },
  costing,
};
