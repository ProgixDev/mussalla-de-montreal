import { describe, expect, it } from "vitest";
import { transactions } from "@/core/portal/seed";
import type { FinancialTransaction } from "@/core/portal/types";
import {
  amountError,
  anchorDay,
  buildCsv,
  csvCell,
  currentAmount,
  denominationLabel,
  formatSigned,
  isIsoDay,
  parseAmount,
  periodRange,
  totalsByCategory,
} from "./finance-lib";

describe("parseAmount", () => {
  it("accepts a comma or a point, spaces and a dollar sign", () => {
    expect(parseAmount("12,50")).toEqual({ ok: true, cents: 1250 });
    expect(parseAmount("12.50")).toEqual({ ok: true, cents: 1250 });
    expect(parseAmount("1 234,5 $")).toEqual({ ok: true, cents: 123450 });
    expect(parseAmount("0,29")).toEqual({ ok: true, cents: 29 });
    expect(parseAmount("7")).toEqual({ ok: true, cents: 700 });
  });
  it("names what is wrong", () => {
    expect(parseAmount("")).toEqual({ ok: false, reason: "empty" });
    expect(parseAmount("-5")).toEqual({ ok: false, reason: "negative" });
    expect(parseAmount("12,505")).toEqual({ ok: false, reason: "decimals" });
    expect(parseAmount("douze")).toEqual({ ok: false, reason: "format" });
    expect(parseAmount("1,234,50")).toEqual({ ok: false, reason: "format" });
  });
  it("refuses zero unless allowed", () => {
    expect(amountError("0")).toBe("Le montant doit être supérieur à 0 $.");
    expect(amountError("0", { allowZero: true })).toBeUndefined();
  });
});

describe("days and periods", () => {
  it("rejects impossible days", () => {
    expect(isIsoDay("2026-11-30")).toBe(true);
    expect(isIsoDay("2026-02-31")).toBe(false);
  });
  it("builds Monday-to-Sunday weeks, months and years", () => {
    expect(periodRange("semaine", "2026-11-23")).toEqual({ from: "2026-11-23", to: "2026-11-29" });
    expect(periodRange("semaine", "2026-11-29")).toEqual({ from: "2026-11-23", to: "2026-11-29" });
    expect(periodRange("mois", "2026-11-08")).toEqual({ from: "2026-11-01", to: "2026-11-30" });
    expect(periodRange("mois", "2028-02-10")).toEqual({ from: "2028-02-01", to: "2028-02-29" });
    expect(periodRange("annee", "2026-11-08")).toEqual({ from: "2026-01-01", to: "2026-12-31" });
  });
  it("anchors on the latest operation", () => {
    expect(anchorDay(transactions, "2030-01-01")).toBe("2026-11-23");
    expect(anchorDay([], "2030-01-01")).toBe("2030-01-01");
  });
});

describe("labels and aggregates", () => {
  it("derives denomination labels from cents", () => {
    expect(denominationLabel(25)).toBe("25 ¢");
    expect(denominationLabel(10000)).toBe("100 $");
  });
  it("always writes the sign", () => {
    expect(formatSigned(-450)).toMatch(/^−4,50/);
    expect(formatSigned(1250)).toMatch(/^\+12,50/);
  });
  it("totals exits by category, ignoring cancelled operations", () => {
    const txs: FinancialTransaction[] = [
      ...transactions,
      {
        id: "x",
        kind: "sortie",
        date: "2026-11-20",
        label: "Annulée",
        method: "loyer",
        amountCents: 99_900,
        status: "annule",
      },
    ];
    const byCat = Object.fromEntries(totalsByCategory(txs, "sortie"));
    expect(byCat.loyer).toBe(280_000);
    expect(byCat.fournisseur).toBe(41_000);
  });
  it("applies only approved rectifications to the current amount", () => {
    const original = transactions[0]!;
    const txs: FinancialTransaction[] = [
      original,
      {
        id: "r1",
        kind: "entree",
        date: "2026-11-24",
        label: "Rectification — erreur",
        method: "especes",
        amountCents: -250,
        status: "approuve",
        correctsId: original.id,
      },
      {
        id: "r2",
        kind: "entree",
        date: "2026-11-25",
        label: "Rectification — en attente",
        method: "especes",
        amountCents: -100,
        status: "soumis",
        correctsId: original.id,
      },
    ];
    expect(currentAmount(original, txs)).toBe(original.amountCents - 250);
  });
});

describe("CSV export", () => {
  it("starts with a BOM, uses ; and exports exits as negative decimal-comma amounts", () => {
    const csv = buildCsv(transactions);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    const lines = csv.slice(1).trimEnd().split("\r\n");
    expect(lines[0]).toBe("date;type;libellé;méthode;montant;statut;référence");
    expect(lines).toHaveLength(transactions.length + 1);
    expect(lines).toContain("2026-11-01;Sortie;Loyer — novembre;Loyer;-2800,00;Approuvé;");
    expect(lines).toContain(
      "2026-11-08;Entrée;Comptage du 8 novembre — dons en espèces;Espèces;1842,50;Approuvé;CPT-2026-11-08",
    );
  });
  it("quotes separators and neutralises formulas", () => {
    expect(csvCell('Don; "anonyme"')).toBe('"Don; ""anonyme"""');
    expect(csvCell("=SUM(A1:A9)")).toBe("'=SUM(A1:A9)");
  });
});
