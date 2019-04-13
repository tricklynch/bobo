// TODO Quit polluting the global namespace
// TODO Support other communication channels
ws=new WebSocket('ws://localhost:8000');ws.onmessage=msg=>ws.send(eval(msg.data))
