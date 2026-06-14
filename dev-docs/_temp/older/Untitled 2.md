
2⁰  opcode (.op)
2¹  cons-sign (.cons) 
2³  car-id(.car)
2⁴  Omi-Cons(.omi)
2⁵  cdr-id(.cdr)
2⁶  Tetragrammatron(.axis)
2⁷  projective surface(.port)
2⁸  event register: (.log)
2⁹  procedural-id: (.pid)
2¹⁰ resource-id(.cid)
2¹⁶ Blackboard(.board)
2⁶⁰ Omnicron(.cron)


Can you explain the transfer matrix method in making a circular slide rule.  

Also I want to learn what you recommend but in a walk-through using C for building my omi-cons from pure bit-wise, pair-wise, memory-address and memory-pointers.

The example i want is
nomogram consists of a set of 60 scales, one for each variable in an equation.

Yeah I want the nonagram, i want to make a smith chart, of 12!, or n = 16 with up to n = 7-11 active at once in 60 decades and that is in sync with with a nonagram slide rule of n = 8 with up to n= 3-5 active at once in 60


---
From the listed sizes of the truth tables tables we can support up to a (2²)⁴  if we used color coding like with the JabCode with 65,536 points of Boolean logic

And I'm thinking of a master plan but this may not be necessary because we can reduce to 60 points resolution at all times because sequences, but i think we may be able do the (256²)² with the factorial of 8 reduced one level of magnitude or 1 / 8!


The expression \((2^5)^{32}\) simplifies to \(2^{160}\). In hexadecimal, this number is represented as a \(1\) followed by \(40\) zeros.Result:\(1\underbrace{000\dots 000}_{40\text{\ zeros}}\text{\ (hex)}\)or simply \(1\text{0}0\text{0}0\text{0}0\text{0}0\text{0}0\text{0}0\text{0}0\text{0}0\text{0}0\text{0}0\text{0}0\text{0}0\text{0}0\text{0}0\text{0}0\text{0}0\text{0}0\text{0}0\text{0}0\text{0}0\text{0}0\text{0}\text{0}_{16}\)ExplanationSimplify the Exponent: Using the rule \((a^m)^n = a^{m \times n}\), the calculation is:\(2^{5\times 32}=2^{160}\)Convert to Base 16: Since \(16\) is \(2^{4}\), we can rewrite \(2^{160}\) to make the hex conversion straightforward:\(2^{160}=(2^{4})^{40}=16^{40}\)Hexadecimal Representation: In base \(10\), \(10^{2}\) is \(100\) (\(1\) followed by two \(0\)s). Similarly, in base \(16\), \(16^{40}\) is a \(1\) followed by \(40\) zeros.For complex calculations, you can use a Hex Calculator or a Decimal to Hex Converter.


Size of truth tables
If there are n input variables then there are 2n possible combinations of their truth values. A given function may produce true or false for each combination so the number of different functions of n variables is the double exponential 22n.

n	2n	22n
0	1	2	
1	2	4	
2	4	16	
3	8	256	
4	16	65,536	
5	32	4,294,967,296	≈ 4.3×109
6	64	18,446,744,073,709,551,616	≈ 1.8×1019
7	128	340,282,366,920,938,463,463,374,607,431,768,211,456	≈ 3.4×1038
8	256	115,792,089,237,316,195,423,570,985,008,687,907,853,269,984,665,640,564,039,457,584,007,913,129,639,936	≈ 1.2×1077
Truth tables for functions of three or more variables are rarely given.

Following are two different notations describing the same function in unsimplified Boolean algebra, using the Boolean variables A, B, C, D and their inverses.

f
(
A
,
B
,
C
,
D
)
=
∑
m
i
,
i
∈
{
6
,
8
,
9
,
10
,
11
,
12
,
13
,
14
}
{\displaystyle f(A,B,C,D)=\sum _{}m_{i},i\in \{6,8,9,10,11,12,13,14\}} where 
m
i
{\displaystyle m_{i}} are the minterms to map (i.e., rows that have output 1 in the truth table).
f
(
A
,
B
,
C
,
D
)
=
∏
M
i
,
i
∈
{
0
,
1
,
2
,
3
,
4
,
5
,
7
,
15
}
{\displaystyle f(A,B,C,D)=\prod _{}M_{i},i\in \{0,1,2,3,4,5,7,15\}} where 
M
i
{\displaystyle M_{i}} are the maxterms to map (i.e., rows that have output 0 in the truth table).

And right sidebar with a wittens truth table and a left side bar with a state transistion table
Also a modal page of K-map drawn on a torus, and in a plane. The dot-marked cells are adjacent.

---

A nomogram consists of a set of n scales, one for each variable in an equation. Knowing the values of n-1 variables, the value of the unknown variable can be found, or by fixing the values of some variables, the relationship between the unfixed ones can be studied. The result is obtained by laying a straightedge across the known values on the scales and reading the unknown value from where it crosses the scale for that variable. The virtual or drawn line, created by the straightedge, is called an index line or isopleth.

---
Smith Chart Functions

C, D
**single-decade logarithmic** scales, single sections of the same length, used together for multiplication and division, and generally one of them is combined with another scale for other calculations
A, B
**two-decade logarithmic** scales, two sections each of which is half the length of the C and D scales, used for finding square roots and squares of numbers
K
**three-decade logarithmic** scale, three sections each of which is one third the length of the C and D scales, used for finding cube roots and cubes of numbers
CF, DF
**folded** versions of the C and D scales that start from **pi** ([π](https://en.wikipedia.org/wiki/Pi)) rather than from unity; these are convenient in two cases. First when the user guesses a product will be close to 10 and is not sure whether it will be slightly less or slightly more than 10, the folded scales avoid the possibility of going off the scale. Second, by making the start π rather than the square root of 10, multiplying or dividing by π (as is common in science and engineering formulas) is simplified.
CI, DI, CIF, DIF
**inverted** scales running from right to left, used to simplify [reciprocal](https://en.wikipedia.org/wiki/Multiplicative_inverse) (1⁄x) steps
S
used for finding **sines** and **cosines** on the C (or D) scale
T, T1, T2
used for finding **tangents** and **cotangents** on the C and CI (or D and DI) scales
R1, R2
**square root scales** – setting the cursor to any value r{\displaystyle r} on R1 or R2, find πr2{\displaystyle {\pi }r^{2}} ([area of a circle](https://en.wikipedia.org/wiki/Area_of_a_circle) of radius r{\displaystyle r}) under the cursor on the DF scale
ST, SRT
used for **sines** and **tangents** of **small angles** and **degree–radian** conversion
Sh, Sh1, Sh2
used for finding **hyperbolic sines** on the C (or D) scale
Ch
used for finding **hyperbolic cosines** on the C (or D) scale
Th
used for finding **hyperbolic tangents** on the C (or D) scale
L
**linear scale** used for addition, subtraction, and (along with the C and D scales) for finding base-10 logarithms and powers of 10
LL0N (or LL/N) and LLN
**log-log folded** e−x{\displaystyle e^{-x}} and ex{\displaystyle e^{x}} scales, for working with logarithms of any base and arbitrary exponents. 4, 6, or 8 scales of this type are commonly seen.
Ln
**linear scale** used along with the C and D scales for finding natural (base e{\displaystyle e}) logarithms and ex{\displaystyle e^{x}}
P
**Pythagorean** scale of 1−x2{\displaystyle {\sqrt {1-x^{2}}}} to (1) solve the [Pythagorean theorem](https://en.wikipedia.org/wiki/Pythagorean_theorem) and (2) to accurately determine cosine for small angles (with the S scale)

---
Right Sidebar 

Wittgenstein table
edit
In proposition 5.101 of the Tractatus Logico-Philosophicus,[9] Wittgenstein listed the table above as follows:

Truthvalues		Operator	Operation name	Tractatus[note 3]
0	(F F F F)(p, q)	⊥	false	Opq	Contradiction	p and not p; and q and not q
1	(F F F T)(p, q)	NOR	p ↓ q	Xpq	Logical NOR	neither p nor q
2	(F F T F)(p, q)	↚	p ↚ q	Mpq	Converse nonimplication	q and not p
3	(F F T T)(p, q)	¬p, ~p	¬p	Np, Fpq	Negation	not p
4	(F T F F)(p, q)	↛	p ↛ q	Lpq	Material nonimplication	p and not q
5	(F T F T)(p, q)	¬q, ~q	¬q	Nq, Gpq	Negation	not q
6	(F T T F)(p, q)	XOR	p ⊕ q	Jpq	Exclusive disjunction	p or q, but not both
7	(F T T T)(p, q)	NAND	p ↑ q	Dpq	Logical NAND	not both p and q
8	(T F F F)(p, q)	AND	p ∧ q	Kpq	Logical conjunction	p and q
9	(T F F T)(p, q)	XNOR	p iff q	Epq	Logical biconditional	if p then q; and if q then p
10	(T F T F)(p, q)	q	q	Hpq	Projection function	q
11	(T F T T)(p, q)	p → q	if p then q	Cpq	Material implication	if p then q
12	(T T F F)(p, q)	p	p	Ipq	Projection function	p
13	(T T F T)(p, q)	p ← q	if q then p	Bpq	Converse implication	if q then p
14	(T T T F)(p, q)	OR	p ∨ q	Apq	Logical disjunction	p or q
15	(T T T T)(p, q)	⊤	true	Vpq	Tautology	if p then p; and if q then q
The truth table represented by each row is obtained by appending the sequence given in Truthvaluesrow to the table[note 3]

p	T	T	F	F
q	T	F	T	F
For example, the table

p	T	T	F	F
q	T	F	T	F
11	T	F	T	T
represents the truth table for Material implication. Logical operators can also be visualized using Venn diagrams.

---
For right sidebar 

Example
edit
Karnaugh maps are used to facilitate the simplification of Boolean algebra functions. For example, consider the Boolean function described by the following truth table.

Truth table of a function
 	A	B	C	D	⁠
f
(
A
,
B
,
C
,
D
)
{\displaystyle f(A,B,C,D)}⁠
0	0	0	0	0	0
1	0	0	0	1	0
2	0	0	1	0	0
3	0	0	1	1	0
4	0	1	0	0	0
5	0	1	0	1	0
6	0	1	1	0	1
7	0	1	1	1	0
8	1	0	0	0	1
9	1	0	0	1	1
10	1	0	1	0	1
11	1	0	1	1	1
12	1	1	0	0	1
13	1	1	0	1	1
14	1	1	1	0	1
15	1	1	1	1	0
Following are two different notations describing the same function in unsimplified Boolean algebra, using the Boolean variables A, B, C, D and their inverses.

f
(
A
,
B
,
C
,
D
)
=
∑
m
i
,
i
∈
{
6
,
8
,
9
,
10
,
11
,
12
,
13
,
14
}
{\displaystyle f(A,B,C,D)=\sum _{}m_{i},i\in \{6,8,9,10,11,12,13,14\}} where 
m
i
{\displaystyle m_{i}} are the minterms to map (i.e., rows that have output 1 in the truth table).
f
(
A
,
B
,
C
,
D
)
=
∏
M
i
,
i
∈
{
0
,
1
,
2
,
3
,
4
,
5
,
7
,
15
}
{\displaystyle f(A,B,C,D)=\prod _{}M_{i},i\in \{0,1,2,3,4,5,7,15\}} where 
M
i
{\displaystyle M_{i}} are the maxterms to map (i.e., rows that have output 0 in the truth table).

K-map drawn on a torus, and in a plane. The dot-marked cells are adjacent.

K-map construction. Instead of the output values (the rightmost values in the truth table), this diagram shows a decimal representation of the input ABCD (the leftmost values in the truth table), therefore it is not a Karnaugh map.

In three dimensions, one can bend a rectangle into a torus.
Construction
edit
In the example above, the four input variables can be combined in 16 different ways, so the truth table has 16 rows, and the Karnaugh map has 16 positions. The Karnaugh map is therefore arranged in a 4 × 4 grid.

The row and column indices (shown across the top and down the left side of the Karnaugh map) are ordered in Gray code rather than binary numerical order. Gray code ensures that only one variable changes between each pair of adjacent cells. Each cell of the completed Karnaugh map contains a binary digit representing the function's output for that combination of inputs.

Grouping
edit
After the Karnaugh map has been constructed, it is used to find one of the simplest possible forms — a canonical form — for the information in the truth table. Adjacent 1s in the Karnaugh map represent opportunities to simplify the expression. The minterms ('minimal terms') for the final expression are found by encircling groups of 1s in the map. Minterm groups must be rectangular and must have an area that is a power of two (i.e., 1, 2, 4, 8...). Minterm rectangles should be as large as possible without containing any 0s. Groups may overlap in order to make each one larger. The optimal groupings in the example below are marked by the green, red and blue lines, and the red and green groups overlap. The red group is a 2 × 2 square, the green group is a 4 × 1 rectangle, and the overlap area is indicated in brown.

The cells are often denoted by a shorthand which describes the logical value of the inputs that the cell covers. For example, AD would mean a cell which covers the 2x2 area where A and D are true, i.e. the cells numbered 13, 9, 15, 11 in the diagram above. On the other hand, AD would mean the cells where A is true and D is false (that is, D is true).

The grid is toroidally connected, which means that rectangular groups can wrap across the edges (see picture). Cells on the extreme right are actually 'adjacent' to those on the far left, in the sense that the corresponding input values only differ by one bit; similarly, so are those at the very top and those at the bottom. Therefore, AD can be a valid term—it includes cells 12 and 8 at the top, and wraps to the bottom to include cells 10 and 14—as is BD, which includes the four corners.

Solution
edit

Diagram showing two K-maps. The K-map for the function f(A, B, C, D) is shown as colored rectangles which correspond to minterms. The brown region is an overlap of the red 2×2 square and the green 4×1 rectangle. The K-map for the inverse of f is shown as gray rectangles, which correspond to maxterms.
Once the Karnaugh map has been constructed and the adjacent 1s linked by rectangular and square boxes, the algebraic minterms can be found by examining which variables stay the same within each box.

For the red grouping:

A is the same and is equal to 1 throughout the box, therefore it should be included in the algebraic representation of the red minterm.
B does not maintain the same state (it shifts from 1 to 0), and should therefore be excluded.
C does not change. It is always 0, so its complement, NOT-C, should be included. Thus, C should be included.
D changes, so it is excluded.
Thus the first minterm in the Boolean sum-of-products expression is AC.

For the green grouping, A and B maintain the same state, while C and D change. B is 0 and has to be negated before it can be included. The second term is therefore AB. Note that it is acceptable that the green grouping overlaps with the red one.

In the same way, the blue grouping gives the term BCD.

The solutions of each grouping are combined: the normal form of the circuit is 
A
C
¯
+
A
B
¯
+
B
C
D
¯
{\displaystyle A{\overline {C}}+A{\overline {B}}+BC{\overline {D}}}.

Thus the Karnaugh map has guided a simplification of

f
(
A
,
B
,
C
,
D
)
=
A
¯
B
C
D
¯
+
A
B
¯
C
¯
D
¯
+
A
B
¯
C
¯
D
+
A
B
¯
C
D
¯
+
A
B
¯
C
D
+
A
B
C
¯
D
¯
+
A
B
C
¯
D
+
A
B
C
D
¯
=
A
C
¯
+
A
B
¯
+
B
C
D
¯
{\displaystyle {\begin{aligned}f(A,B,C,D)={}&{\overline {A}}BC{\overline {D}}+A{\overline {B}}\,{\overline {C}}\,{\overline {D}}+A{\overline {B}}\,{\overline {C}}D+A{\overline {B}}C{\overline {D}}+{}\\&A{\overline {B}}CD+AB{\overline {C}}\,{\overline {D}}+AB{\overline {C}}D+ABC{\overline {D}}\\={}&A{\overline {C}}+A{\overline {B}}+BC{\overline {D}}\end{aligned}}}
It would also have been possible to derive this simplification by carefully applying the axioms of Boolean algebra, but the time it takes to do that grows exponentially with the number of terms.

Inverse
edit
The inverse of a function is solved in the same way by grouping the 0s instead.[nb 1]

The three terms to cover the inverse are all shown with grey boxes with different colored borders:

brown: A B
gold: A C
blue: BCD
This yields the inverse:

f
(
A
,
B
,
C
,
D
)
¯
=
A
¯
B
¯
+
A
¯
C
¯
+
B
C
D
{\displaystyle {\overline {f(A,B,C,D)}}={\overline {A}}\,{\overline {B}}+{\overline {A}}\,{\overline {C}}+BCD}
Through the use of De Morgan's laws, the product of sums can be determined:

f
(
A
,
B
,
C
,
D
)
=
f
(
A
,
B
,
C
,
D
)
¯
¯
=
A
¯
B
¯
+
A
¯
C
¯
+
B
C
D
¯
=
(
A
¯
B
¯
¯
)
(
A
¯
C
¯
¯
)
(
B
C
D
¯
)
=
(
A
+
B
)
(
A
+
C
)
(
B
¯
+
C
¯
+
D
¯
)
{\displaystyle {\begin{aligned}f(A,B,C,D)&={\overline {\overline {f(A,B,C,D)}}}\\&={\overline {{\overline {A}}\,{\overline {B}}+{\overline {A}}\,{\overline {C}}+BCD}}\\&=\left({\overline {{\overline {A}}\,{\overline {B}}}}\right)\left({\overline {{\overline {A}}\,{\overline {C}}}}\right)\left({\overline {BCD}}\right)\\&=\left(A+B\right)\left(A+C\right)\left({\overline {B}}+{\overline {C}}+{\overline {D}}\right)\end{aligned}}}
Don't cares
edit

The value of ⁠
f
(
A
,
B
,
C
,
D
)
{\displaystyle f(A,B,C,D)}⁠ for ABCD = 1111 is replaced by a "don't care". This removes the green term completely and allows the red term to be larger. It also allows blue inverse term to shift and become larger
Karnaugh maps also allow easier minimizations of functions whose truth tables include "don't care" conditions. A "don't care" condition is a combination of inputs for which the designer doesn't care what the output is. Therefore, "don't care" conditions can either be included in or excluded from any rectangular group, whichever makes it larger. They are usually indicated on the map with a dash or X.

The example on the right is the same as the example above but with the value of f(1,1,1,1) replaced by a "don't care". This allows the red term to expand all the way down and, thus, removes the green term completely.

This yields the new minimum equation:

f
(
A
,
B
,
C
,
D
)
=
A
+
B
C
D
¯
{\displaystyle f(A,B,C,D)=A+BC{\overline {D}}}
Note that the first term is just A, not AC. In this case, the don't care has dropped a term (the green rectangle); simplified another (the red one); and removed the race hazard (removing the yellow term as shown in the following section on race hazards).

The inverse case is simplified as follows:

f
(
A
,
B
,
C
,
D
)
¯
=
A
¯
B
¯
+
A
¯
C
¯
+
A
¯
D
{\displaystyle {\overline {f(A,B,C,D)}}={\overline {A}}\,{\overline {B}}+{\overline {A}}\,{\overline {C}}+{\overline {A}}D}
Through the use of De Morgan's laws, the product of sums can be determined:

f
(
A
,
B
,
C
,
D
)
=
f
(
A
,
B
,
C
,
D
)
¯
¯
=
A
¯
B
¯
+
A
¯
C
¯
+
A
¯
D
¯
=
(
A
¯
B
¯
¯
)
(
A
¯
C
¯
¯
)
(
A
¯
D
¯
)
=
(
A
+
B
)
(
A
+
C
)
(
A
+
D
¯
)
{\displaystyle {\begin{aligned}f(A,B,C,D)&={\overline {\overline {f(A,B,C,D)}}}\\&={\overline {{\overline {A}}\,{\overline {B}}+{\overline {A}}\,{\overline {C}}+{\overline {A}}\,D}}\\&=\left({\overline {{\overline {A}}\,{\overline {B}}}}\right)\left({\overline {{\overline {A}}\,{\overline {C}}}}\right)\left({\overline {{\overline {A}}\,D}}\right)\\&=\left(A+B\right)\left(A+C\right)\left(A+{\overline {D}}\right)\end{aligned}}}
Race hazards
edit
Elimination
edit
Karnaugh maps are useful for detecting and eliminating race conditions. Race hazards are very easy to spot using a Karnaugh map, because a race condition may exist when moving between any pair of adjacent, but disjoint, regions circumscribed on the map. However, because of the nature of Gray coding, adjacent has a special definition explained above – we're in fact moving on a torus, rather than a rectangle, wrapping around the top, bottom, and the sides.

In the example above, a potential race condition exists when C is 1 and D is 0, A is 1, and B changes from 1 to 0 (moving from the blue state to the green state). For this case, the output is defined to remain unchanged at 1, but because this transition is not covered by a specific term in the equation, a potential for a glitch (a momentary transition of the output to 0) exists.
There is a second potential glitch in the same example that is more difficult to spot: when D is 0 and A and B are both 1, with C changing from 1 to 0 (moving from the blue state to the red state). In this case the glitch wraps around from the top of the map to the bottom.

Race hazards are present in this diagram.

Above diagram with consensus terms added to avoid race hazards.
Whether glitches will actually occur depends on the physical nature of the implementation, and whether we need to worry about it depends on the application. In clocked logic, it is enough that the logic settles on the desired value in time to meet the timing deadline. In our example, we are not considering clocked logic.

In our case, an additional term of 
A
D
¯
{\displaystyle A{\overline {D}}} would eliminate the potential race hazard, bridging between the green and blue output states or blue and red output states: this is shown as the yellow region (which wraps around from the bottom to the top of the right half) in the adjacent diagram.

The term is redundant in terms of the static logic of the system, but such redundant, or consensus terms, are often needed to assure race-free dynamic performance.

Similarly, an additional term of 
A
¯
D
{\displaystyle {\overline {A}}D} must be added to the inverse to eliminate another potential race hazard. Applying De Morgan's laws creates another product of sums expression for f, but with a new factor of 
(
A
+
D
¯
)
{\displaystyle \left(A+{\overline {D}}\right)}.

2-variable map examples
edit
The following are all the possible 2-variable, 2 × 2 Karnaugh maps. Listed with each is the minterms as a function of 
∑
m
(
)
{\textstyle \sum m()} and the race hazard free (see previous section) minimum equation. A minterm is defined as an expression that gives the most minimal form of expression of the mapped variables. All possible horizontal and vertical interconnected blocks can be formed. These blocks must be of the size of the powers of 2 (1, 2, 4, 8, 16, 32, ...). These expressions create a minimal logical mapping of the minimal logic variable expressions for the binary expressions to be mapped. Here are all the blocks with one field.

A block can be continued across the bottom, top, left, or right of the chart. That can even wrap beyond the edge of the chart for variable minimization. This is because each logic variable corresponds to each vertical column and horizontal row. A visualization of the k-map can be considered cylindrical. The fields at edges on the left and right are adjacent, and the top and bottom are adjacent. K-Maps for four variables must be depicted as a donut or torus shape. The four corners of the square drawn by the k-map are adjacent. Still more complex maps are needed for 5 variables and more.

Σm(0); K = 0
Σm(0); K = 0
 
Σm(1); K = A′B′
Σm(1); K = A′B′
 
Σm(2); K = AB′
Σm(2); K = AB′
 
Σm(3); K = A′B
Σm(3); K = A′B
 
Σm(4); K = AB
Σm(4); K = AB
 
Σm(1,2); K = B′
Σm(1,2); K = B′
 
Σm(1,3); K = A′
Σm(1,3); K = A′
 
Σm(1,4); K = A′B′ + AB
Σm(1,4); K = A′B′ + AB
 
Σm(2,3); K = AB′ + A′B
Σm(2,3); K = AB′ + A′B
 
Σm(2,4); K = A
Σm(2,4); K = A
 
Σm(3,4); K = B
Σm(3,4); K = B
 
Σm(1,2,3); K = A' + B′
Σm(1,2,3); K = A' + B′
 
Σm(1,2,4); K = A + B′
Σm(1,2,4); K = A + B′
 
Σm(1,3,4); K = A′ + B
Σm(1,3,4); K = A′ + B
 
Σm(2,3,4); K = A + B
Σm(2,3,4); K = A + B
 
Σm(1,2,3,4); K = 1
Σm(1,2,3,4); K = 1

---



*Following are two different notations describing the same function in unsimplified Boolean algebra, using the Boolean variables A, B, C, D and their inverses.*

- *f(A,B,C,D)=∑mi,i∈{6,8,9,10,11,12,13,14}![{\displaystyle f(A,B,C,D)=\sum {}m{i},i\in \{6,8,9,10,11,12,13,14\}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/d78307586c3ab53f26dad1d5586737ddc51078b0) where mi![{\displaystyle m_{i}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/95ec8e804f69706d3f5ad235f4f983220c8df7c2) are the [minterms](https://en.wikipedia.org/wiki/Minterms "Minterms") to map (i.e., rows that have output 1 in the truth table).*
- *f(A,B,C,D)=∏Mi,i∈{0,1,2,3,4,5,7,15}![{\displaystyle f(A,B,C,D)=\prod {}M{i},i\in \{0,1,2,3,4,5,7,15\}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/8d1750875b81ca49597b8c84be2ca6bc6b4f04c5) where Mi![{\displaystyle M_{i}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/eda8fd06f1cd5de22ed07385a0f8aa19773b2de9) are the [maxterms](https://en.wikipedia.org/wiki/Maxterms "Maxterms") to map (i.e., rows that have output 0 in the truth table*).