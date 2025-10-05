import os from "os";

export async function findServer(port: number) {
    console.log(`Searching for server on port ${port}...`);

    const myIp = getMyLocalIp();
    if (!myIp) {
        console.log("Could not get my IP address");
        return null;
    }

    const network = getNetwork(myIp, 24);
    const hosts = generateHosts(network, 24);

    console.log(`Scanning ${hosts.length} hosts in network ${network}...`);

    const server = await findFirstWorkingHost(hosts, port);
    if (server) {
        console.log("Found:", server);
        return server;
    }

    console.log("Server not found");
    return null;
}

function findFirstWorkingHost(hosts: string[], port: number) {
    return new Promise((resolve) => {
        let resolved = false;

        for (const host of hosts) {
            fetch(`http://${host}:${port}/server.find`)
                .then(res => {
                    if (res.ok && !resolved) {
                        resolved = true;
                        resolve(host);
                    }
                })
                .catch(() => { });
        }

        setTimeout(() => {
            if (!resolved) resolve(null);
        }, 5000);
    });
}

function isLocalAddress(ip: string) {
    if (!isValidIp(ip)) return false;
    return ip.startsWith("10.") || ip.startsWith("172.") || ip.startsWith("192.168.");
}

function getMyLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        const iface = interfaces[name];
        for (const alias of iface) {
            if (alias.internal === false && isValidIp(alias.address)) {
                if (isLocalAddress(alias.address)) {
                    return alias.address;
                }
            }
        }
    }
    return null;
}

function isValidIp(ip: string) {
    const parts = ip.split(".");
    if (parts.length !== 4) return false;

    for (const part of parts) {
        const num = parseInt(part);
        if (isNaN(num) || num < 0 || num > 255) return false;
    }

    return true;
}

function getNetwork(ip: string, prefix: number) {
    const parts = ip.split(".").map(Number);
    const mask = 0xFFFFFFFF << (32 - prefix);

    const network = [
        parts[0] & (mask >>> 24 & 255),
        parts[1] & (mask >>> 16 & 255),
        parts[2] & (mask >>> 8 & 255),
        parts[3] & (mask & 255)
    ];

    return network.join(".");
}

function generateHosts(network: string, prefix: number) {
    const hosts = [];
    const base = network.split(".").map(Number);

    const start = 1;
    const end = prefix === 24 ? 254 : 2;

    for (let i = start; i <= end; i++) {
        hosts.push(`${base[0]}.${base[1]}.${base[2]}.${i}`);
    }

    return hosts;
}