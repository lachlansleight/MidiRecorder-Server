# Changelog

### v2.0.1

_12th September 2022_

-   Songs now begin just before the first note - removing long silences at the beginning
-   Audio context now properly initializes when spacebar is pressed
-   Changing MIDI device during playback should now work

### v2.0.0

_9th September 2022_

-   Refactored the entire site to use TailwindCSS and Firebase v9 - and just generally be up to date with my newer more modern workflow
-   Many associated minor style changes (mostly improvements!)
-   Fixed a bug preventing me from modifying the database in any way
-   Added pretty particles to the player :D

### v0.8.0

_2nd May 2022_

-   Improved home page display in various ways, including nicer tile rendering, better grouping, and some information text
-   Added an error message to the header if the browser doesn't support WebMIDI
-   Added a piano-roll background to the playback canvas
-   Fixed a few little bugs here and there

### v0.7.0

_23rd April 2022_

-   Duplicated recording metadata into a separate firebase key, so that it can be quickly pulled for displaying the home-page list
    -   At some point, I'll de-duplicate this as it's wasteful and means that all data operations need to happen twice...not to mention that it could become desynchronized. I doin't have time to do it right now, but at some point I'll switch the 'recordings' key to be a 'messages' key instead.

### v0.6.1

_9th April 2021_

I'll fill in this, and previous versions, another time. I'll be doing it 100% from the commit history anyway so if you must know, check there!
