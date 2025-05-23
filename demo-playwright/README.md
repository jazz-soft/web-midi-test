# Testing Web MIDI applications with Playwright

This is a simple example of using
[web-midi-test](https://www.npmjs.com/package/web-midi-test)
with [Playwright](https://www.npmjs.com/package/playwright) to test Web MIDI applications.

To see the demo, run:  
`npm install`  
`npm test`

Updating Playwright browsers:
`npx playwright install`

## How it works
This test creates three virtual MIDI-Out and three virtual MIDI-In ports.  
Of those, one MIDI-In and one MIDI-Out port are set *busy*:  
they pretend to be used by another application,  
so that the Web MIDI API on our page can see these ports, but cannot open them.

We direct messages received by virtual MIDI-Out ports to the console log,  
and post some messages to vitrual MIDI-In ports.

The script in the HTML file tries to open all available MIDI-In and MIDI-Out ports.  
It directs messages received from the MIDI-In ports to the console log,  
and sends some messages to the MIDI-Out ports.

You should see MIDI messages passing through two MIDI-In and two MIDI-Out ports.

Since the back-end and front-end scripts run in different contexts in Playwright,  
we use [jazz-midi-headless](https://github.com/jazz-soft/jazz-midi-headless) to enable communication between them.
