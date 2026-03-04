const cluster = require('cluster');
const os = require('os');
const path = require('path');

const numCPUs = os.cpus().length;

if (cluster.isPrimary) {
    console.log(`🚀 Primary cluster ${process.pid} is running`);
    console.log(`⚙️  Starting ${numCPUs} worker processes...`);

    // Fork workers for each CPU core
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`⚠️  Worker ${worker.process.pid} died. Restarting...`);
        cluster.fork();
    });
} else {
    // Workers share the TCP connection
    require(path.join(__dirname, 'server.js'));
    console.log(`🚀 Worker ${process.pid} started`);
}
