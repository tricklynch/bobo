const readline = require('readline')
const ws = require('ws')

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
        console.log(data)
        main()
    })
    .catch(err => {
        console.log(err)
        process.exit()
    })
}

main()
