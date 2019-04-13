const readline = require('readline')
const ws = require('ws')

// TODO Implement command history to improve UX
function take_input() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })

    return new Promise((resolve, reject) => {
        rl.question('> ', cmd => {
            rl.close()
            if(cmd === 'exit') {
                reject('Bye')
            }
            // TODO Take the host and port as command line input
            const websocket = new ws('ws://localhost:1337', {})
            websocket.on('message', data => {
                resolve(data)
            })
            websocket.on('open', () => websocket.send(cmd))
        })
    })
}

function main() {
    take_input()
    .then(data => {
        // TODO Change this to an actual logging library to have an audit history
        console.log(data)
        // TODO Stop using recursion so that users are not limited to around 11,000 commands
        main()
    })
    .catch(err => {
        console.log(err)
        process.exit()
    })
}

main()
