import fetch from 'node-fetch'

const response = await fetch('http://localhost:3000/api/reports/preview', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': 'your-cookie-here' // We'll need actual session cookie
  },
  body: JSON.stringify({
    reportType: 'leave',
    filters: {
      rosterPeriods: ['RP01/2026', 'RP02/2026']
    }
  })
})

const data = await response.json()
console.log(JSON.stringify(data, null, 2))
