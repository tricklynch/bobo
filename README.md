# BoBo
Browse on Behalf of

## Purpose

You find a blind XSS in an admin application. You're entirely unfamiliar with
the app, so you're not sure what to do. BoBo gives you the visibility you need
in order to go further into the application by browsing on behalf of whichever
admin you just XSS'd. This is accomplished by providing a setting up a
communication channel between the admin's browser and a server that you control.
Once this communication channel is established, you could then connect to the
server and begin sending payloads to the admin. Some exploits to be implemented
in the near future will give you the ability to get other web pages from the
application via the admin's browser and taking actions on the admin's behalf.

Bounty hunters can use this to demonstrate real impact in their reports (more $)

Security engineers can find this helpful to find the real impact of an XSS

Pen testers may want to take a medium finding up to a high (or even critical)

Red teamers can drill deeper into the application to get the real gold

## Usage

To start up the server, do

node server/server.js

Then you probably want to get a victim's browser connected. Use test.html for
reference.

Finally, launch the shell (specifying your server) and start using commands
("help" is a good start).

## Exploit writing

Exploits are written as functions that are module exports. The simplest exploit
would be

module.exports.simple = () => '"hi"'

Exploits are eval'd in the victim's browser, so everything referenced in your
exploit function needs to be something the victim's browser can reference. For
example, you cannot call a function named "foo" in your exploit because the
victim's browser does not know function "foo".

The result of the eval is sent back to the server which is then passed along to
the shell.

[//]: # "TODO Learn Markdown"
