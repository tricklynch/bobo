ws=new WebSocket('ws://localhost:8080');ws.onmessage=msg=>ws.send(eval(msg.data))
