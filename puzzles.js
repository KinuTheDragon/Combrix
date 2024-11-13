const PUZZLES = `
Introduction (FK)
11

Duplet (FK)
11
  1
  1

Block (FK)
22
11

Triad (FK)
12
11

Quad (FK)
11.
11.

Shuriken (FK)
 2
 112
211
  2

Three (KTD)
3 12
3 22

Blanks (G)
3..
3..

Civilization (FK)
22
22
-
33 11
33 11
-
.. ..
.. ..

Tu4ial (G)
44.1.1
.
1
.
1
.
1

Cane (FK)
 .
...44
  4
  4

Hi (FK)
2 2 121
2 2  3
343  4
2 2  3
2 2 121

Octothorpe (FK)
 .  .
......
 .44.
 .44.
......
 .  .

4x4 (KTD)
44
  44
.
   .
    5511
      11

Star (KTD)
  4
55455
 ...
 ...
.   .

Six Shift (G)
665
5..

++ (KTD)
77 4 1.2.3
   3

Eight Snake (M)
55 1.1.1. .
88      1 1
   1.1.1. .
   .      1
   1.1.1.1.

0 mod 4 (KTD)
. . . .
-
4488

Too Easy (KTD)
991234
..5678

Perfection (KTD)
7777 .

Chain (KTD)
.
 112345678
-
 ....
`.slice(1, -1).split("\n\n").map(x => {
    x = x.replaceAll("-", "");
    let newline = x.indexOf("\n");
    return {name: x.slice(0, newline), grid: x.slice(newline + 1)};
});