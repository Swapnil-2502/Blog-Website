import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { sign, verify } from 'hono/jwt'

const app = new Hono<{
  Bindings: {
    DATABASE_URL: string,
    JWT_TOKEN: string
  }
}>()

//Middleware
app.use('/api/v1/blog/*', async (c, next) => {
    // get the header
    // verify the header
    // if the header is correct, we can proceed,
    // if not, we return the user with a 403 status code
    const header = c.req.header("authorization") || "";

    const token = header.split(" ")[1];

    const response = await verify(token , c.env.JWT_TOKEN) 
    if(response.id){
      next()
    }else{
      c.status(403);
      return c.json({error: "unauthorized"});
    }
})

app.post('/api/v1/user/signup',async (c) => {

  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())

  const body = await c.req.json();
  try{
    const user = await prisma.user.create({
      data:{
        email:body.email,
        password:body.password
      }
    });
    const jwt_token = await sign({id: user.id},c.env.JWT_TOKEN)
    return c.json({
      jwt: jwt_token
    })
  }
  catch(e){
    return c.status(403);
  }
})

app.post('/api/v1/user/signin', async (c) => {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    const body = await c.req.json();
    const user = await prisma.user.findUnique({
      where: {
        email: body.email,
        password: body.password
      }
    });

    if (!user) {
      c.status(403);
      return c.json({ error: "user not found" });
    }

    const jwt = await sign({ id: user.id }, c.env.JWT_TOKEN);
    return c.json({ jwt });
})

app.post('/api/v1/blog', (c) => {
  return c.text('This is the POST request for route /api/v1/blog')
})

app.put('/api/v1/blog', (c) => {
  return c.text('This is the PUT request for route /api/v1/blog')
})

app.get('/api/v1/blog/:id', (c) => {
  return c.text('This is the GET request for route /api/v1/blog/:id')
})

app.get('/api/v1/blog/bulk', (c) => {
  return c.text('This is the GET request for route /api/v1/blog/:id')
})

export default app
