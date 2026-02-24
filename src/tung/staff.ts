import type { Assert } from "../help/type";
import { or } from "../help/flit";

type StaffsOf<S extends string, Treeming extends boolean = true> = _StaffsOf<
  Treeming extends true ? Treem<S> : S
>;

type _StaffsOf<S extends string> = S extends `${infer F}${infer R}`
  ? F | StaffsOf<R>
  : never;

type Whitespace = " " | "\t" | "\n" | "\r";

/**
 * Type-level whitespace trim.
 * @said `/trim/`
 * @see {@linkcode treem}
 */
export type Treem<S extends string> = S extends `${infer F}${infer R}`
  ? F extends Whitespace
    ? Treem<R>
    : `${F}${Treem<R>}`
  : "";

export const treem = <S extends string>(s: S) => {
  return s.replace(/\s/g, "") as Assert<Treem<S>>;
};

/**
 * Type-level substring check.
 * @said `/fajnd/`
 * @see {@linkcode faynd}
 */
type Faynd<N extends string, H extends string> = H extends `${N}${string}`
  ? true
  : H extends `${string}${infer R}`
    ? Faynd<N, R>
    : false;

export const faynd = <N extends string, H extends string>(
  needle: N,
  haystack: H,
) => {
  // And on the twenty-first day of the next month of
  // the twenty-seventh year of the third thousandyear,
  // it came to be that the type was distributed,
  // and lo, everything worked, and it was good.
  return haystack.includes(needle) as N extends any
    ? Assert<Faynd<N, H>>
    : never;
};

type EveryOther<S extends string> = S extends `${string}${infer O}${infer R}`
  ? `${O}${EveryOther<R>}`
  : "";

const everyother = <S extends string>(s: S) => {
  let t = "";
  for (let i = 1; i < s.length; i += 2) {
    t += s[i];
  }
  return t as Assert<EveryOther<S>>;
};

type Joyn<Ss extends string[], J extends string = ""> = Ss extends [
  infer F extends string,
  ...infer R extends string[],
]
  ? `${F}${J}${Joyn<R, J>}`
  : "";

/**
 * This betokens only that deal of loudness which is written.
 *
 * This type is meant for raw loudness, not loudmarks!
 *
 * @dealt This type is dealt in deals so as not to beget:
 * ```
 * Type instantiation is excessively deep and possibly infinite. ts(2589)
 * ```
 */
type Allstaff =
  | StaffsOf<Treem<typeof stop>>
  | StaffsOf<Treem<typeof hiss>>
  | StaffsOf<Treem<typeof nose>>
  | StaffsOf<Treem<typeof ell>>
  | StaffsOf<Treem<typeof arr>>
  | StaffsOf<Treem<typeof glide>>
  | StaffsOf<Treem<typeof clip>>;

// prettier-ignore
const stop =  `pb    td  ʈɖcɟkɡqɢ  ʔ ` as const;
// prettier-ignore
const hiss =  `ɸβfvθðszʃʒʂʐçʝxɣχʁħʕhɦ` as const;
// prettier-ignore
const nose =  ` m ɱ   n   ɳ ɲ ŋ ɴ    ` as const;
// prettier-ignore
const ell =   `    ɬɮ l     ʎ ʟ      ` as const;
// prettier-ignore
const arr =   `       r   ɽ     ʀ    ` as const;
// prettier-ignore
const glide = `   ʋ   ɹ   ɻ j ɰ      ` as const;

const clip = `
iy ɨʉ ɯu
ɪʏ     ʊ 
eø ə  ɤo
ɛœ    ʌɔ
æɶ a  ɑɒ
` as const;

const book = "abcdefghijklmnopqrstuvwxyz" as const;

export type Bookstaff = StaffsOf<typeof book>;

export const isBookstaff = (x: string): x is Bookstaff => {
  return book.includes(x);
};

export type Unbookstaff = Exclude<Allstaff, Bookstaff>;

export type Loudstaff = Bear | Choke;

export const isLoudstaff = (x: string): x is Loudstaff => {
  return x.length === 1;
};

export type Bear = Smooth | ThroatMark;
export const isBearing = (staff: Loudstaff): staff is Bear => {
  return faynd(staff, treem(clip));
};

export type Smooth =
  | Nose
  | StaffsOf<typeof ell | typeof arr | typeof glide | typeof clip>;

export type Nose = StaffsOf<typeof nose>;
export const isNosed = (staff: Loudstaff): staff is Nose => {
  return faynd(staff, treem(nose));
};

export type ThroatMark = Stave | Spread | Clench;

/**
 * @dealt This type is dealt in deals so as not to beget:
 * ```
 * Type instantiation is excessively deep and possibly infinite. ts(2589)
 * ```
 */
export type Stave =
  | StaffsOf<typeof clip>
  | StaffsOf<
      Treem<
        EveryOther<
          | typeof stop
          | typeof hiss
          | typeof nose
          | typeof ell
          | typeof arr
          | typeof glide
        >
      >
    >;

export const isStaved = (staff: Loudstaff): staff is Stave => {
  return or(
    faynd(staff, treem(clip)),
    faynd(staff, treem(everyother(stop))),
    faynd(staff, treem(everyother(hiss))),
    faynd(staff, treem(everyother(nose))),
    faynd(staff, treem(everyother(ell))),
    faynd(staff, treem(everyother(arr))),
    faynd(staff, treem(everyother(glide))),
  );
};

// export const _isStaved = <S extends Loudstaff>(staff: S) => {
//   return or(
//     faynd(staff, treem(clip)),
//     faynd(staff, treem(everyother(stop))),
//     faynd(staff, treem(everyother(hiss))),
//     faynd(staff, treem(everyother(nose))),
//     faynd(staff, treem(everyother(ell))),
//     faynd(staff, treem(everyother(arr))),
//     faynd(staff, treem(everyother(glide))),
//   );
// };
//
// export const _ = <T, U extends T, V extends T>(
//   f: (_arg: T) => _arg is U,
//   arg: V,
// ) => {
//   return f(arg as unknown as Assert<T>) as Assert<V extends U ? true : false>;
// };
//
// const x = _(isStaved, "v");

export type Spread = "h";
export type Clench = never;

export type Choke = Thru | Mouth;

export type Thru = Side | Step | Strong | StaffsOf<"iuyeøoæa">;
export const isThru = (staff: Loudstaff): staff is Thru => {
  return or(
    faynd(staff, "iuyeøoæa"),
    isSide(staff),
    isStep(staff),
    isStrong(staff),
  );
};

export type Side = StaffsOf<typeof ell>;
export const isSide = (staff: Loudstaff): staff is Side => {
  return faynd(staff, treem(ell));
};

export type Step = StaffsOf<typeof hiss>;
export const isStep = (staff: Loudstaff): staff is Step => {
  return faynd(staff, treem(hiss));
};

export type Strong = StaffsOf<"fvsz">;
export const isStrong = (staff: Loudstaff): staff is Strong => {
  return faynd(staff, treem("fvsz"));
};

export type Mouth = Lip | Blade | Body | Root;

export type Lip = Ring | StaffsOf<"pbfvm">;
export type Ring = StaffsOf<"wyuøo">;
export const isRinged = (staff: Loudstaff): staff is Ring => {
  return faynd(staff, "wyuøo");
};

export type Blade = Far | Wide;
export type Far = StaffsOf<"tdsznlr">;
export type Wide = never;

export type Body = High | Fore | Back | StaffsOf<"a">;
export const isBody = (staff: Loudstaff): staff is Body => {
  return faynd(staff, "a") || isHigh(staff) || isFore(staff) || isBack(staff);
};

export type High = StaffsOf<"ckiyu">;
export const isHigh = (staff: Loudstaff): staff is High => {
  return faynd(staff, "ckiyu");
};

export type Fore = StaffsOf<"ciyeøæ">;
export const isFore = (staff: Loudstaff): staff is Fore => {
  return faynd(staff, "ciyeøæ");
};

export type Back = StaffsOf<"quo">;
export const isBack = (staff: Loudstaff): staff is Back => {
  return faynd(staff, "quo");
};

export type Root = Low | Tight;
export type Low = StaffsOf<"æa">;
export type Tight = StaffsOf<"iyueøo">;
