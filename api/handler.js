import axios from 'axios'

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const mikrotikHost = process.env.MIKROTIK_HOST || 'cuzmin.info'
    const mikrotikPort = process.env.MIKROTIK_PORT || '2155'
    const mikrotikUser = process.env.MIKROTIK_USER || 'api'
    const mikrotikPassword = process.env.MIKROTIK_PASSWORD || 'panas'

    const instance = axios.create({
      baseURL: `http://${mikrotikHost}:${mikrotikPort}`,
      auth: {
        username: mikrotikUser,
        password: mikrotikPassword,
      },
      timeout: 5000,
      rejectUnauthorized: false,
    })

    // Try to get PPPoE server info
    const pppoeRes = await instance.get('/rest/interface/pppoe-server')

    if (!pppoeRes.data || pppoeRes.data.length === 0) {
      return res.status(200).json({
        upload: 0,
        download: 0,
        isRunning: false,
        timestamp: new Date().toISOString(),
      })
    }

    const pppoeData = pppoeRes.data[0]
    const isRunning = pppoeData.disabled === false || !('disabled' in pppoeData)

    // Get traffic/queue data for real-time bandwidth
    let upload = 0
    let download = 0

    try {
      const queueRes = await instance.get('/rest/interface/pppoe-server')
      if (queueRes.data && queueRes.data[0]) {
        const ifaceData = queueRes.data[0]
        upload = ifaceData['tx-rate'] ? ifaceData['tx-rate'] / 1024 / 1024 : 0
        download = ifaceData['rx-rate'] ? ifaceData['rx-rate'] / 1024 / 1024 : 0
      }
    } catch (e) {
      console.log('Could not get queue data:', e.message)
    }

    return res.status(200).json({
      upload: Math.max(upload, 0),
      download: Math.max(download, 0),
      isRunning,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Mikrotik API Error:', error.message)

    // Return error but allow UI to handle gracefully
    return res.status(200).json({
      upload: 0,
      download: 0,
      isRunning: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    })
  }
}
