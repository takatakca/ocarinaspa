import { describe, it, expect } from "vitest";
import { findErrorCode, preDiagnose } from "@/lib/spa-prediagnostic";

describe("provider-independent pre-diagnostic", () => {
  it.each([["DRY", "DR"], ["sn-a", "SN"], ["sn b", "SN"]])("normalizes %s", (input, code) => {
    expect(findErrorCode(input)?.code).toBe(code);
  });
  it("leaves unknown errors to a technician without claiming an inspection", () => {
    const result = preDiagnose({ brand: "Test spa", error_code: "XYZ", problem_description: "Affichage inhabituel" });
    expect(result.diagnostic).toContain("sans inspection");
    expect(result.diagnostic).toContain("un technicien le vérifiera");
    expect(result.recommendCall).toBe(true);
  });
  it("does not repeat repair/restart instructions from the technical code reference", () => {
    const result = preDiagnose({ brand: "Test spa", error_code: "DRY", problem_description: "Code affiché" });
    expect(result.diagnostic).not.toMatch(/purger|redémarrer/i);
    expect(result.diagnostic).toContain("Un technicien doit confirmer");
  });
  it("prioritizes electrical danger over routine water/filter checks", () => {
    const result = preDiagnose({ brand: "Test spa", error_code: "FLO", problem_description: "Étincelles et fumée", heating: "non", pump_noise: "oui", pump_works: "non" });
    expect(result.urgency).toBe("haute");
    expect(result.recommendCall).toBe(true);
    expect(result.actions[0]).toContain("Cessez d'utiliser");
    expect(result.actions.join(" ")).not.toMatch(/filtre|couvercle|niveau d'eau/);
  });
  it("does not give contradictory cover advice for an overheating code", () => {
    const result = preDiagnose({ brand: "Test spa", error_code: "OH", problem_description: "La pompe ne fonctionne pas", heating: "non", pump_works: "non" });
    expect(result.urgency).toBe("haute");
    expect(result.actions.join(" ")).toContain("laisser l'eau refroidir");
    expect(result.actions.join(" ")).not.toContain("bien fermé");
  });
  it("reports a freezing code as urgent without electrical repair steps", () => {
    const result = preDiagnose({ brand: "Test spa", error_code: "ICE", problem_description: "Eau froide" });
    expect(result.urgency).toBe("haute");
    expect(result.recommendCall).toBe(true);
    expect(result.actions.join(" ")).toContain("appelez-nous rapidement");
  });
});
