import axios from 'axios'

const MIKROTIK_HOST = process.env.MIKROTIK_HOST || 'cuzmin.info'
const MIKROTIK_PORT = process.env.MIKROTIK_PORT || 2155
const MIKROTIK_USER = process.env.MIKROTIK_USER || 'api'
const MIKROTIK_PASSWORD = process.env.MIKROTIK_PASSWORD || 'panas'

async function getMikrotikData() {
  try {
    // Create axios instance with basic auth
    const instance = axios.create({
      baseURL: `http://${MIKROTIK_HOST}:${MIKROTIK_PORT}`,
      auth: {
        username: MIKROTIK_USER,
        password: MIKROTIK_PASSWORD,
      },
      timeout: 5000,
    })

    // Get PPPoE server status
    const response = await instance.get('/rest/interface/pppoe-server')

    if (!response.data || response.data.length === 0) {
      return {
        upload: 0,
        download: 0,
        isRunning: false,
      }
    }

    // Get interface stats
    const interfaceStats = response.data[0]
    const upload = interfaceStats['tx-byte'] ? interfaceStats['tx-byte'] / 1024 / 1024 : 0
    const download = interfaceStats['rx-byte']
      ? interfaceStats['rx-byte'] / 1024 / 1024
      : 0
    const isRunning = interfaceStats.disabled === false || interfaceStats.disabled === undefined

    // Get real-time bandwidth if available
    const trafficRes = await instance.get('/rest/queue/simple')
    let totalUpload = upload
    let totalDownload = download

    if (trafficRes.data && trafficRes.data.length > 0) {
      totalUpload = trafficRes.data.reduce((sum, item) => {
        const txRate = item['tx-rate'] ? item['tx-rate'] / 1024 / 1024 : 0
        return sum + txRate
      }, upload)

      totalDownload = trafficRes.data.reduce((sum, item) => {
        const rxRate = item['rx-rate'] ? item['rx-rate'] / 1024 / 1024 : 0
        return sum + rxRate
      }, download)
    }

    return {
      upload: Math.max(totalUpload, 0),
      download: Math.max(totalDownload, 0),
      isRunning,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Mikrotik API Error:', error.message)
    return {
      upload: 0,
      download: 0,
      isRunning: false,
      error: error.message,
    }
  }
}

export default getMikrotikData
