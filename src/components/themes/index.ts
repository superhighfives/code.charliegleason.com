import { latte, mocha } from "./definitions";
import { toSandpack } from "./utils";

export const sandpackLatte = toSandpack(latte);
export const sandpackMocha = toSandpack(mocha);
