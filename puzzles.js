const PUZZLES = `
Introduction
11

Duplet
11
  1
  1

Block
22
11

Triad
12
11

Quad
11.
11.

Shuriken
 2
 112
211
  2

Civilization
22
22
-
33 11
33 11
-
.. ..
.. ..

Cane
 .
...44
  4
  4

Hi
2 2 121
2 2  3
343  4
2 2  3
2 2 121

Octothorpe
 .  .
......
 .44.
 .44.
......
 .  .
`.slice(1, -1).split("\n\n").map(x => {
    x = x.replaceAll("-", "");
    let newline = x.indexOf("\n");
    return {name: x.slice(0, newline), grid: x.slice(newline + 1)};
});