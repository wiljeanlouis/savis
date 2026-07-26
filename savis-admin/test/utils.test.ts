import { afterEach, describe, expect, it, vi } from "vitest";
import { createUuid } from "@/shared/lib/utils";

const uuidV4Pattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("createUuid", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates a valid UUID v4 without the Web Crypto API", () => {
    vi.stubGlobal("crypto", undefined);

    expect(createUuid()).toMatch(uuidV4Pattern);
  });
});
