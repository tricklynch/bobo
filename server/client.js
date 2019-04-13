// TODO Support other communication channels
// TODO Get server URL from config file
module.exports = ()=>{ws=new WebSocket('ws://localhost:8000');ws.onmessage=msg=>ws.send(eval(msg.data))}
