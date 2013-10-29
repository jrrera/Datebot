DateBot
====================

<img src="https://lh6.googleusercontent.com/l3MmpaqVAfwK-VRQPl4MynSLvsE8EcVn4NdE2cUC2yc40jvKJtqYeiMvCWSoNcHch2xGx5WR=s640-h400-e365-rw" />

Description
---------------
Let's be real: despite how popular online dating has become, it still sucks. DateBot's goal is to reduce the pain points of online dating for both guys and gals. 

For guys, it allows you to reduce your time requirement when messaging girls. If you've written a high quality message about your favorite band in the past, DateBot will remember and suggest that the next time a girl shares your interest in that band.

For girls (coming soon), DateBot will help you weed through the often-sleazy, creepy messages that inevitably end up in your inbox. 


Install & Configure
---------------
To install DateBot, you'll need a Chrome browser, as it's a Chrome extension at its core. 

There are three main portions to DateBot: 

1) The Chrome extension (the 'extension' folder). This is in beta, and ready to be used. This can be downloaded <a href="http://bit.ly/datebot" target="_blank">here</a>

A demo of how this app works can be found <a href="https://docs.google.com/document/d/1EQIzJzchrmPx05tBrfrFsu3J58TQyW5z7I-imuz7XFc/edit#" target="_blank">here</a>

2) The Web App (the 'appengine' folder). This is in alpha, and is not quite ready for primetime yet. It uses  Google App Engine to store OKCupid profiles (scraped using the Web App Helper, mentioned below), for easier message management.

3) The Web App Helper (the 'helper extension' folder). This is a Chrome extension that scrapes HTML (OKCupid doesn't like things like PhantomJS or Mechanize, so we use the Chrome API), and assists with message passing between tabs when you're ready to send a message from the Web App.


Test & Debug
---------------


License
---------------
MIT
