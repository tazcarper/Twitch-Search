# Twitch-Search
Simple Twitch Search App using vanilla JS only

Author: Taz Carper

### What it does
Uses Twitch API to look up streams for searched string.

### How it works
1. Make sure input isn't empty and isn't all whitespace.
2. Concat that input value into the Twitch API call with limit of 100 and offest of 0.
3. Create a promise when making API call. 3 resolves possible. 
  a. Less than 100 streams added = resolve with data object.
  b. More than 100 streams returned. Resolve with calling the GET request again with an increased offset (100).
  c. Status was not 200 and API call failed. Resolve with that status code.
4. Stream Data object is sorted by viewers property from largest to smallest.
6. Prepare the first 5 streams into page 1 with a loop that builds a string to be inserted into DOM. changePage(1).
7. Calculate the number of pages for pagination based on data object length divided by how many streams you want visisble per page (5).

That's basically the gist of it. Some other bells and whistles in there, but the meat of the code does what is described above.

### TO-DO ( things I would probably do/experiment with if I continued to build )
- Setup tabs that included my favorite streamers.
- View stream in app.
- Expanded version of each stream that shows highlights, descriptions, more info on streamer.
- Add chat (looks to be embed only right now?)
- Community rating or channel maybe?
- Donate / Follow / Subscribe buttons?
