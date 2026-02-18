import { expectTypeOf } from "vitest";

type StaffsOf<S extends string> = S extends `${infer F}${infer R}`
  ? F | StaffsOf<R>
  : never;

expectTypeOf([
  "a" as const,
  "b" as const,
  "c" as const,
  "d" as const,
]).toEqualTypeOf<StaffsOf<"abcd">[]>();

export type Onestaff<S extends string = string> =
  S extends `${infer F}${infer R}` ? (R extends "" ? F : never) : never;

// todo type Twistaff? Thristaff?

export type Loudstaff = Mark;
export type Mark = Bear | Choke;

export type Bear = Smooth | Throat;

export type Smooth = Nose | StaffsOf<"mnlrjwiyueøoæa">;
export type Nose = StaffsOf<"mn">;

export type Throat = Stave | Spread | Clench;
export type Stave = StaffsOf<"bdgvzmnlrjwiyeøoæa">;
export type Spread = StaffsOf<"h">;
export type Clench = never;

export type Choke = Thru | Mouth;

export type Thru = Side | Step | Strong | StaffsOf<"iuyeøoæa">;

export type Side = StaffsOf<"l">;
export type Step = StaffsOf<"fvszh">;
export type Strong = StaffsOf<"fvsz">;

export type Mouth = Lip | Blade | Body | Root;

export type Lip = Ring | StaffsOf<"pbfvm">;
export type Ring = StaffsOf<"wyuøo">;

export type Blade = Far | Wide;
export type Far = StaffsOf<"tdsznlr">;
export type Wide = never;

export type Body = High | Fore | Back | StaffsOf<"a">;
export type High = StaffsOf<"ckiyu">;
export type Fore = StaffsOf<"ciyeøæ">;
export type Back = StaffsOf<"quo">;

export type Root = Low | Tight;
export type Low = StaffsOf<"æa">;
export type Tight = StaffsOf<"iyueøo">;

type A = Exclude<Low, Fore>;
type K = Exclude<Body, Thru | Fore | Back>;

export const isRing = (staff: Loudstaff): staff is Ring => {
  return "wyuøo".includes(staff);
};

export const isBody = (staff: Loudstaff): staff is Body => {
  return isHigh(staff) || isFore(staff) || isBack(staff) || "a".includes(staff);
};

export const isHigh = (staff: Loudstaff): staff is High => {
  return "ckiyu".includes(staff);
};

export const isFore = (staff: Loudstaff): staff is Fore => {
  return "ciyeøæ".includes(staff);
};

export const isBack = (staff: Loudstaff): staff is Back => {
  return "quo".includes(staff);
};

const Markbook = {
  tung: {
    bear: { smooth: ["nose"], throat: ["stave", "spread", "clench"] },
    choke: {
      thru: ["side", "step", "strong"],
      mouth: {
        lip: ["ring"],
        blade: ["far", "wide"],
        body: ["high", "fore", "back"],
        root: ["low", "tight"],
      },
    },
  },
} as const;
