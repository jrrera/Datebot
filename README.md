Datebot
====================

<img src="https://lh6.googleusercontent.com/-TkddqVnlxzM/Ur8sesBMMRI/AAAAAAAAHC0/BhFbf5yg-ew/w812-h693-no/Screen+Shot+2013-12-28+at+11.53.37+AM.png" />

Description
---------------
Let's be real: despite how popular online dating has become, it still sucks. Datebot's goal is to reduce the pain points of online dating for both guys and gals. 

For guys, it allows you to reduce your time requirement when messaging girls. It will help you immediately identify mutual interests the two of you share. Furthermore, if you've written a high quality message about your favorite band (for example) in the past, Datebot will remember and suggest that the next time a girl shares your interest in that band.

For girls (coming soon), Datebot will help you weed through the often-sleazy, creepy messages that inevitably end up in your inbox. 

Rather than waiting for online dating sites to fix these pain points, Datebot does it for you!

Image Credit: <a href="http://www.iconarchive.com/show/daft-punks-icons-by-tsukasa-tux.html" target="_blank">Tsukasa-Tux</a>.


Install & Configure
---------------
To install Datebot, you'll need a Chrome browser, as it's a Chrome extension at its core. 

There are three main portions to Datebot: 

1) The Chrome extension (the 'extension' folder). This is in beta, and ready to be used. This can be downloaded <a href="http://bit.ly/datebot" target="_blank">here</a>.

A demo of how this app works can be found <a href="https://docs.google.com/document/d/1EQIzJzchrmPx05tBrfrFsu3J58TQyW5z7I-imuz7XFc/edit#" target="_blank">here</a>.

2) The Web App (the 'appengine' folder). This is in alpha, and is not quite ready for primetime yet. It uses  Google App Engine to store OKCupid profiles (scraped using the Web App Helper, mentioned below), for easier message management.

3) The Web App Helper (the 'helper extension' folder). This is a Chrome extension that scrapes HTML (OKCupid doesn't like things like PhantomJS or Mechanize, so we use the Chrome API), and assists with message passing between tabs when you're ready to send a message from the Web App.


License
---------------
The MIT License (MIT)

Copyright (c) 2014 Jon Guerrera

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
