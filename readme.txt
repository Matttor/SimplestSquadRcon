Simple SquadRcon Client by Mattt(or)

Welcome, this is intended specifically for OWI-Squad's flavour of Rcon Server

install node.js
no other dependenices.

to run enter `node rcon.js` into console

Will write list queries and console text and Sevrer feed as console warning text

There is ZERO error checking - this is intentional!

!!! LINE 38: UNSAFE value ( >= 4 ) - this allows the buffer to potentially be read outside of a message, this is to make us more likely to find edge case errors. For SAFE operation value must be ( >= 7 ) !!!

line 12: size and id are not important, this is the hard coded 'made up' packet, no point in converting into it each time it arrives.
line 15: 2147483647 used as flag when debugging only.
line 19: id defaults to non zero for easier debugging must be a valid positive signed 32bit value, 2 less than range max.
line 21: id + 2 allows for easier debugging plus sets up for way to avoid need to parse later, ie sudo id 33 = "current map" => read from index x to end"
line 47: is special packet? long if statement but efficient.
line 58: long messages re-assembled and sent out from here.
