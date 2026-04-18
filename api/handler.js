import { RouterOSAPI } from 'node-routeros'

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
    timeout: 10,
  })

  try {
    await conn.connect()

    // Get PPPoE server bindings (all clients config)
    const pppoeClients = await conn.write('/interface/pppoe-server/print').catch(() => [])

    // Get active PPP sessions (currently connected)
    const activeSessions = await conn.write('/ppp/active/print').catch(() => [])

    const isRunning = activeSessions.length > 0 || pppoeClients.length > 0

    // Build map of active interfaces by user
    const activeByUser = {}
    activeSessions.forEach((session) => {
      if (session.name) activeByUser[session.name] = session
      if (session.user) activeByUser[session.user] = session
    })

    // Get real-time traffic for active interfaces only
    // Use /interface/monitor-traffic with =once= to get immediate rates
    const activeInterfaceNames = activeSessions
      .map((s) => s.name)
      .filter(Boolean)

    let trafficMap = {}

    if (activeInterfaceNames.length > 0) {
      try {
        // Batch request - monitor-traffic supports multiple interfaces
        const trafficData = await conn.write('/interface/monitor-traffic', [
          '=interface=' + activeInterfaceNames.join(','),
          '=once=',
        ])

        trafficData.forEach((t) => {
          if (t.name) {
            trafficMap[t.name] = {
              txBps: parseInt(t['tx-bits-per-second'] || '0'),
              rxBps: parseInt(t['rx-bits-per-second'] || '0'),
            }
          }
        })
      } catch (err) {
        console.log('Batch monitor-traffic failed, trying individual:', err.message)

        // Fallback: query each interface individually
        await Promise.all(
          activeInterfaceNames.map(async (ifname) => {
            try {
              const result = await conn.write('/interface/monitor-traffic', [
                '=interface=' + ifname,
                '=once=',
              ])
              if (result && result[0]) {
                trafficMap[ifname] = {
                  txBps: parseInt(result[0]['tx-bits-per-second'] || '0'),
                  rxBps: parseInt(result[0]['rx-bits-per-second'] || '0'),
                }
              }
            } catch (e) {
              // Skip failed interfaces
            }
          })
        )
      }
    }

    await conn.close()

    // Build client list
    const clients = pppoeClients.map((client) => {
      const name = client.name || client.user || 'Unknown'
      const cleanName = name.replace(/^<pppoe-/, '').replace(/>$/, '')

      // Find traffic data for this client's interface
      const traffic = trafficMap[client.name] || trafficMap[cleanName] || { txBps: 0, rxBps: 0 }

      // Convert bits/sec to Mbps (divide by 1,000,000)
      const upload = traffic.txBps / 1000000
      const download = traffic.rxBps / 1000000

      // Client is active if it has an active session OR traffic
      const isActive =
        client.disabled !== 'true' &&
        (activeByUser[client.user] !== undefined ||
          activeByUser[cleanName] !== undefined ||
          traffic.txBps > 0 ||
          traffic.rxBps > 0)

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
