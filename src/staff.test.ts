import { expect, expectTypeOf, test } from "vitest";
import { treem, type Treem } from "./staff";

test("treem type", () => {
  expectTypeOf(treem(" \n\r\t ")).toEqualTypeOf<Treem<" \n\r\t ">>();
  expectTypeOf(treem(" abcd ")).toEqualTypeOf<Treem<" abcd ">>();
  expectTypeOf(treem(" a b  c d ")).toEqualTypeOf<Treem<" a b  c d ">>();
  expectTypeOf(treem("a\nb\rc\td")).toEqualTypeOf<Treem<"a\nb\rc\td">>();
});

test("treem value", () => {
  expect(treem(" \n\r\t ")).toBe("");
  expect(treem("abcd")).toBe("abcd");
  expect(treem(" a b  c d ")).toBe("abcd");
  expect(treem("a\nb\rc\td")).toBe("abcd");
});
