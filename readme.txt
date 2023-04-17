Simple SquadRcon Client by Mattt(or)

Welcome, this is intended specifically for OWI-Squad's flavour of Rcon Server

install node.js
no other dependenices.

Basic Implementation;
| line 69: edit port( port ), host( ip ), token( password ). ((for local connections use ip "localhost")).
| line 79: set keep alive interval ( 60000 = 1 minute ).

to run enter `node rcon.js` into console

Will write 'list query responses' to console text and 'sevrer feed' to console as warning text.

There is ZERO error checking - this is intentional!

!!! LINE 38: UNSAFE value ( >= 4 ) - this allows the buffer to potentially be read outside of a message, this is to make us more likely to find edge case errors. For SAFE operation value must be ( >= 7 ) !!!

line 12: size and id are not important, this is the hard coded 'made up' packet, no point in converting into it each time it arrives later.
line 15: 2147483647 used as flag when debugging only.
line 19: id defaults to non zero for easier debugging must be a valid positive signed 32bit value, 2 less than range max.
line 21: id + 2 allows for easier debugging plus sets up for way to avoid need to parse later, ie sudo id 33 = "current map" => read from index x to end"
line 47: is special packet? long if statement but efficient.
line 58: long messages re-assembled and sent out from here.

See rconWithFailover.js for tested + testable error tolerant SquadRcon.

Packet checks are;
is Special packet?
has valid size value? <= rcon spec is max 4096, Squad ignores this, using 8192 is ok for now using too large a value may result in loop as data can never fill to active a decode.
is long enough to be complete?
ends with 'null, null'?
ID is positive 32bit sInt?
Type is either 0,1,2 or 3?

if out going text is found to contain "", this also counts as a bad packet.
