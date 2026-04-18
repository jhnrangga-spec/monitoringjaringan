import { RouterOSAPI } from 'node-routeros'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const mikrotikHost = process.env.MIKROTIK_HOST || 'cuzmin.info'
  const mikrotikPort = parseInt(process.env.MIKROTIK_PORT || '2155')
  const mikrotikUser = process.env.MIKROTIK_USER || 'api'
  const mikrotikPassword = process.env.MIKROTIK_PASSWORD || 'panas'

  const conn = new RouterOSAPI({
    host: mikrotikHost,
    port: mikrotikPort,
    user: mikrotikUser,
    password: mikrotikPassword,
    timeout: 15,
  })

  try {
    await conn.connect()

    // Get active PPP sessions (currently connected users)
    const activeSessions = await conn.write('/ppp/active/print').catch(() => [])

    // Get PPPoE server bindings (all configured clients)
    const pppoeClients = await conn.write('/interface/pppoe-server/print').catch(() => [])

    // Take first snapshot of interface byte counters
    const snapshot1 = await conn.write('/interface/print').catch(() => [])
    const snapshotTime1 = Date.now()

    // Wait ~1 second for rate calculation
    await sleep(1000)

    // Take second snapshot
    const snapshot2 = await conn.write('/interface/print').catch(() => [])
    const snapshotTime2 = Date.now()

    await conn.close()

    const timeDeltaSec = (snapshotTime2 - snapshotTime1) / 1000

    // Calculate real-time rates from byte counter delta
    const ratesMap = {}
    snapshot2.forEach((s2) => {
      if (!s2.name) return
      const s1 = snapshot1.find((x) => x.name === s2.name)
      if (!s1) return

      const tx1 = parseInt(s1['tx-byte'] || '0')
      const tx2 = parseInt(s2['tx-byte'] || '0')
      const rx1 = parseInt(s1['rx-byte'] || '0')
      const rx2 = parseInt(s2['rx-byte'] || '0')

      const txBytesPerSec = Math.max(0, (tx2 - tx1) / timeDeltaSec)
      const rxBytesPerSec = Math.max(0, (rx2 - rx1) / timeDeltaSec)

      ratesMap[s2.name] = {
        txBps: txBytesPerSec * 8, // bytes to bits
        rxBps: rxBytesPerSec * 8,
        running: s2.running === 'true' || s2.running === true,
      }
    })

    const isRunning = activeSessions.length > 0 || pppoeClients.length > 0

    // Build map of active sessions by user name
    const activeByUser = {}
    activeSessions.forEach((session) => {
      if (session.name) activeByUser[session.name] = session
    })

    // Build client list with bandwidth data
    const clients = pppoeClients.map((client) => {
      const name = client.name || client.user || 'Unknown'
      const cleanName = name.replace(/^<pppoe-/, '').replace(/>$/, '')

      // Look up rate by interface name (binding name = interface name)
      const rates = ratesMap[client.name] ||
                    ratesMap[cleanName] ||
                    ratesMap[`<pppoe-${client.user}>`] ||
                    { txBps: 0, rxBps: 0, running: false }

      // Convert bits/sec to Mbps
      const upload = rates.txBps / 1000000
      const download = rates.rxBps / 1000000

      // Active = has active session OR has traffic OR running interface
      const isActive =
        client.disabled !== 'true' &&
        (activeByUser[client.user] !== undefined ||
          activeByUser[cleanName] !== undefined ||
          rates.running ||
          rates.txBps > 0 ||
          rates.rxBps > 0)

      return {
        id: client['.id'] || name,
        name: cleanName,
        user: client.user || cleanName,
        upload: Math.max(upload, 0),
        download: Math.max(download, 0),
        total: Math.max(upload + download, 0),
        isActive,
      }
    })

    // Sort by total bandwidth (highest first)
    clients.sort((a, b) => b.total - a.total)

    const totalUpload = clients.reduce((sum, c) => sum + c.upload, 0)
    const totalDownload = clients.reduce((sum, c) => sum + c.download, 0)
    const activeCount = clients.filter((c) => c.isActive).length

    return res.status(200).json({
      isRunning,
      totalClients: clients.length,
      activeClients: activeCount,
      totalUpload,
      totalDownload,
      totalBandwidth: totalUpload + totalDownload,
      clients,
      samplingInterval: timeDeltaSec,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    try {
      await conn.close()
    } catch (e) {
      // Ignore
    }

    console.error('Mikrotik API Error:', error.message)

    return res.status(200).json({
      isRunning: false,
      totalClients: 0,
      activeClients: 0,
      totalUpload: 0,
      totalDownload: 0,
      totalBandwidth: 0,
      clients: [],
      error: error.message,
      timestamp: new Date().toISOString(),
    })
  }
}
