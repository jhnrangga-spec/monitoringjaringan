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

    // Get PPPoE server bindings (clients)
    const pppoeClients = await conn.write('/interface/pppoe-server/print').catch(() => [])

    // Get active PPP sessions
    const activeSessions = await conn.write('/ppp/active/print').catch(() => [])

    // Get all interfaces for bandwidth data
    const interfaces = await conn.write('/interface/print', ['=stats=']).catch(() => [])

    await conn.close()

    const isRunning = pppoeClients.length > 0 || activeSessions.length > 0

    // Build client list with bandwidth info
    const clients = pppoeClients.map((client) => {
      const name = client.name || client.user || 'Unknown'

      const matchingInterface = interfaces.find(
        (iface) => iface.name === client.name || iface.name === name
      )

      const activeSession = activeSessions.find(
        (session) => session.name === client.user || session.name === name
      )

      const txRate = parseInt(matchingInterface?.['tx-byte'] || '0')
      const rxRate = parseInt(matchingInterface?.['rx-byte'] || '0')

      const upload = txRate / 1024 / 1024
      const download = rxRate / 1024 / 1024

      const isActive =
        client.disabled !== 'true' &&
        (activeSession !== undefined || txRate > 0 || rxRate > 0)

      return {
        id: client['.id'] || name,
        name: name.replace(/^<pppoe-/, '').replace(/>$/, ''),
        user: client.user || name,
        upload: Math.max(upload, 0),
        download: Math.max(download, 0),
        total: Math.max(upload + download, 0),
        isActive,
        mtu: client.mtu || 'N/A',
        service: client['service'] || 'PPPoE',
      }
    })

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
      // Ignore close errors
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
