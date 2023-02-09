import test from "ava";
import "babel-core/register";

import { State } from "../src/lib/";

test("Exports a State class", (t) => {
  t.truthy(State);
});
