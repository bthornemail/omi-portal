
My phone is low memory I'm wrinting long pages and it's getting erased 

So
Before we had like a psi/phi function I'm using that to mess a one instruction app.

It takes in a binary buffer of arbitrary precision
It looks for pre-header that configures framing 

;; this is the old version I made before I understood binary operations it was called Header8 and was modeled after UTF-EBCDIC in order to have 5 1-bit character codes with room for 2 more as a UTF-7 encapsulated in a UTF-8.   For instance, I just read now that the ESC key is not enumerated in the ascii control codes sticks, but this was my injector before
AFFINE: [NULL,ESC,FS,GS,US,RS,0x00,0x7F]
PROJECTIVE: [ESC,FS,GS,US,RS,0x&,0x?]

But I still have to work on this, for now I just say binary64, binary128, and binary256 are targets for the protective geometry framing because a 64 can hold 4 UTF-16, a 128 can hold 4 UTF-32 and a 256 can hold 4 Binary64 or 2 Binary128,  and if we resolve based on notation, then we can convert everything to a floating point loseless arithmetic in the 256.   Mind you the we must use the binary presentation I need as a escape characters because it doesn't have the escape like I believed. But the endianessas of the 16BE and 16LE and the 32BE and 32LE lose the endianessas once interpretered as Binary64...Binary256.

----
One thing I read was that escape characters come in sequences of 2, so I think we have to derived those pairs from a canonical but made by the rolling functions with the 7-steps of 8 and the 15-steps of 16,

If we carried forward each permutation step of the declared frame of the Control codes or ASCII block partition as a CAR of a Omi CONS tree to register a CDR diametrically opposed to its cardinality and coordinated alignment to the Boundries and Constraints  of its parent CONS, then like a rascals triangle, every 1 along the border is a recursive encoded omi cons as a bitmask operator for the row its own and the every row below until the frame is filled.  

So if the initial framing is (0x00...0x07 . 0x08...0x0F) this is supposed to be like a Squaregraph by considering CAR list of columns  and CDR a list of rows.  

Also I think for the ending I want

CONS: (16LE . 32LE)
CONS: (16BE . 32BE)
CONS: (16BE . 32LE)
CONS: (16LE . 32BE)

CONS: ( 32LE . 16LE)
CONS: ( 32BE . 16BE)
CONS: ( 32LE . 16BE)
CONS: ( 32BE . 16BE)

CAR: 16LE | 16BE | 32LE | 32BE
CDR: 16LE | 16BE | 32LE | 32BE

----

Infact I wat to ask you about the difference in this presentation right now because this is a new idea. But I think we can enumerated the Boundries and Constraints on the omi-lisp before we use them. 

CAR: 16LE | 16BE | 32LE | 32BE
CDR: Binary64 | Binary128 | Binary256

And as I think more I think we can lock the values those addressing to be more natural.


CAR: 2^3 < 16LE | 16BE | 32LE | 32BE < 2^5
CDR: 2^5 < Binary64 | Binary128 | Binary256 < 2^17

---


I'm going to go one further with this questionable idea of using  negative layers to encode my omi model like Layer -1D , Layer -2D....   but i think we maybe able to encode a whole 1/10 layers to the to the on the negative side of the decimal or to the significant so that when we encode our 7 layer OSI model it doesn't have to be encapsulated in the 10 Layer Omnicron Model because its in inverse dual negative space, 

Like how we did with the proposed layer 11 being like a layer -1 able to be 11/1 or 1/11 because we are reasoning with the orientation logic of the bit-wise and pair-wise chirality and cardinality,  with an omicron so that the difference between Layer -1, Layer 1 and Layer10 is the same measurable cardinality by diametric difference in the chirality from Layer0

---

I also I want to redesign my in-stream control surface.  Before we had a 4 column 16 row control surface, but now I thinkwe can have a 16 column 0x00...0x0F with 16 rows, [0x00,,,0x0F] * [0x00,,,0x3F] 4 recursive pages of 256.

Can you show me how to write the look up tables for the 


In computing and telecommunications, an escape character is a character (more specifically a metacharacter) that, based on a contextual convention, specifies an alternative interpretation of the sequence of characters that follow it. The escape character plus the characters that follow it to form a syntactic unit is called an escape sequence. A convention can define any particular character code as a sequence prefix. Some conventions use a normal, printable character such as backslash (\) or ampersand (&). Others use a non-printable (a.k.a. control) character such as ASCII escape.

In telecommunications, an escape character is used to indicate that the following characters are encoded differently. This is used to alter control characters that would otherwise be noticed and acted on by the underlying telecommunications hardware, such as illegal characters. In this context, the use of an escape character is sometimes referred to as quoting


---

## Definition

[edit](https://en.wikipedia.org/w/index.php?title=Escape_character&action=edit&section=1 "Edit section: Definition")

An escape character may not have its own meaning, so all escape sequences are of two or more characters.

Escape characters are part of the [syntax](https://en.wikipedia.org/wiki/Formal_syntax "Formal syntax") for many programming languages, data formats, and communication protocols. For a given [alphabet](https://en.wikipedia.org/wiki/Alphabet_\(computer_science\) "Alphabet (computer science)") an escape character's purpose is to start character sequences (so named [escape sequences](https://en.wikipedia.org/wiki/Escape_sequence "Escape sequence")), which have to be interpreted differently from the same characters occurring without the prefixed escape character.

The functions of escape sequences include:

- To encode a syntactic entity, such as device commands or special data, which cannot be directly represented by the alphabet.
- To represent characters, referred to as _character quoting_, which cannot be typed in the current context, or would have an undesired interpretation. In this case, an escape sequence is a [digraph](https://en.wikipedia.org/wiki/Digraph_\(computing\) "Digraph (computing)") consisting of an escape character itself and a "quoted" character.

### Control character

[edit](https://en.wikipedia.org/w/index.php?title=Escape_character&action=edit&section=2 "Edit section: Control character")

In contrast to an escape character, a [control character](https://en.wikipedia.org/wiki/Control_character "Control character") (i.e. [carriage return](https://en.wikipedia.org/wiki/Carriage_return "Carriage return")) has meaning on its own, without a special prefix or following characters. An escape character has no meaning on its own. It only has meaning in the context of a sequence.

Generally, an escape character is not a particular case of (device) control characters, nor vice versa. If we define control characters as non-[graphic](https://en.wikipedia.org/wiki/Graphic_character "Graphic character"), or as having a special meaning for an output device (e.g. [printer](https://en.wikipedia.org/wiki/Computer_printer "Computer printer") or [text terminal](https://en.wikipedia.org/wiki/Text_terminal "Text terminal")) then any escape character for this device is a control one. But escape characters used in programming (such as the [backslash](https://en.wikipedia.org/wiki/Backslash "Backslash"), `\`) are graphic, hence are not control characters. Conversely most (but not all) of the [ASCII](https://en.wikipedia.org/wiki/ASCII "ASCII") "control characters" have some control function in isolation, therefore they are not escape characters.

In many programming languages, an escape character also forms some escape sequences which are referred to as control characters. For example, [line break](https://en.wikipedia.org/wiki/Line_break_\(computing\) "Line break (computing)") has an escape sequence of `\n`.



---
---
---
Dont worry about before im doing research so im all over the place, but help me understdnd how to write a carry forward adder and a closure function and how to write synax for like the dot product of those unary points into cons cells, i know i didit it before writing some type of neural netural i think it was rnn with back propagation.   

I want to learn how to make a table from 2 unary array when i define the metric with encapsulation

I need to understand more because tight now im thinking that each step in we enlarge the byte-length by a 2 exponent but we also shrink it by 1 to gain a new byte orderd mark dimension from the 0x0E or next layer (frame (min-frame,frame/2 - 1,frame/2, frame/2 + 1,max-frame))


 min + 1 and byte length - 1 as the 

I also I want to redesign my in-stream control surface. Before we had a 4 column 16 row control surface, but now I thinkwe can have a 16 column 0x00...0x0F with 16 rows, [0x00,,,0x0F] * [0x00,,,0x3F] 4 recursive pages of 256.

Can you show me how to write the look up tables for the 


----
---
---
Can you me a full tutorial on writing closures and carry-forward adders.  I never learned the deatils of those.  Thy why , what, when, where, how, and syntax like in common lisp but i think i dint need anything lisp language constructs past lisp 1.5. 

Maybe about f-expressions, M-Expressions,  s-expression, and lambda expression, closures and combinators.  

What do i need to know that is lisp I1.5