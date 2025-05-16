

Abstract:<br>
  1) Collect and verify signature;<br>
  2) Provide restAPI for query;
  3) Call restAPI procedure:<br>
     a) Leader add sign request to server, save sign request to mongodb;<br>
     b) Fellower query sign request;<br>
     c) Fellower Submit signature information;<br>
     d) Leader query sign result.<br>

Usage:<br>
  1) Update local config:<br>
     ./conf/config.json <br>
  2) Run service:<br>
    node ./src/startMsgRouter.js<br>
