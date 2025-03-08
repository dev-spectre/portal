import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import alpha from './alpha/index.js'

const app = new Hono()

app.route("v1/", alpha);

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
