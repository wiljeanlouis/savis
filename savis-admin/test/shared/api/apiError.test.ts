import {
  getApiErrorMessage,
  getApiErrorMessageAsync,
} from "@/shared/api/apiError";
import { describe, expect, it } from "vitest";

const axiosError = (data?: unknown, hasResponse = true) => ({
  isAxiosError: true,
  response: hasResponse ? { data } : undefined,
  message: hasResponse
    ? "Request failed with status code 400"
    : "Network Error",
});

describe("getApiErrorMessage", () => {
  it("extracts a Spring ProblemDetail detail", () => {
    expect(
      getApiErrorMessage(
        axiosError({
          title: "Bad Request",
          detail: "Le code du produit existe déjà.",
        }),
      ),
    ).toBe("Le code du produit existe déjà.");
  });

  it("formats validation details returned as a list", () => {
    expect(
      getApiErrorMessage(
        axiosError({
          detail: [
            { loc: ["body", "name"], msg: "Field required" },
            { loc: ["body", "price"], msg: "Must be positive" },
          ],
        }),
      ),
    ).toBe("name : Field required\nprice : Must be positive");
  });

  it("supports plain text and field error maps", () => {
    expect(getApiErrorMessage(axiosError("Conflit de données"))).toBe(
      "Conflit de données",
    );
    expect(
      getApiErrorMessage(
        axiosError({ errors: { code: "Déjà utilisé", name: ["Requis"] } }),
      ),
    ).toBe("code : Déjà utilisé\nname : Requis");
  });

  it("uses a clear network message and the provided fallback", () => {
    expect(getApiErrorMessage(axiosError(undefined, false))).toBe(
      "Impossible de joindre le serveur.",
    );
    expect(getApiErrorMessage(axiosError({}), "Échec de l’opération.")).toBe(
      "Échec de l’opération.",
    );
  });

  it("decodes a ProblemDetail returned as a blob", async () => {
    const error = axiosError(
      new Blob(
        [JSON.stringify({ detail: "La facture ne peut pas être générée." })],
        { type: "application/problem+json" },
      ),
    );

    await expect(getApiErrorMessageAsync(error)).resolves.toBe(
      "La facture ne peut pas être générée.",
    );
  });
});
