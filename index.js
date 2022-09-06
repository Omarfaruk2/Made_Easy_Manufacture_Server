const express = require('express')
const jwt = require('jsonwebtoken')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
require('dotenv').config()
const port = process.env.PORT || 5000
const app = express()
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)


// middleware is danger
app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0catxlt.mongodb.net/?retryWrites=true&w=majority`
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 })


function verifyJWT(req, res, next) {
    const authHeaders = req.headers.authorization
    if (!authHeaders) {
        return res.status(401).send({ message: "Unauthorized access" })
    }
    const token = authHeaders.split(' ')[1]
    // verify a token symmetric
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: "Forbidden Access" })
        }
        req.decoded = decoded
        next()
    })


}

async function run() {

    try {
        await client.connect()

        const productsCollection = client.db("MadeEasy").collection("items")
        const reviewsCollection = client.db("MadeEasy").collection("reviews")
        const orderCollection = client.db("MadeEasy").collection("orders")
        const userCollection = client.db("MadeEasy").collection("users")
        const updateUserCollection = client.db("MadeEasy").collection("updateUser")
        const paymentsCollection = client.db("MadeEasy").collection("payments")

        // item---------------------------------------------------------------------------------------------------------------------------
        // Get All Items
        app.get("/items", async (req, res) => {
            const query = {}
            const cursor = productsCollection.find(query)
            const result = await cursor.toArray()
            res.send(result)

        })

        // Get Single Items
        app.get("/items/:id", async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await productsCollection.findOne(query)
            res.send(result)

        })

        // post ite

        app.post("/items", async (req, res) => {
            const newitem = req.body
            const result = await productsCollection.insertOne(newitem)
            res.send(result)
        })

        // review-------------------------------------------------------------------------------------------------------------
        // Get All reviews
        app.get("/reviews", async (req, res) => {
            const query = {}
            const cursor = reviewsCollection.find(query)
            const result = await cursor.toArray()
            res.send(result)

        })

        app.post("/reviews", async (req, res) => {
            const newUser = req.body
            const result = await reviewsCollection.insertOne(newUser)
            res.send(result)
        })


        // POst a single all orders order -----------------------------------------------------------------------
        app.post("/orders", async (req, res) => {
            const newOrder = req.body
            const result = await orderCollection.insertOne(newOrder)
            res.send(result)
        })

        // Get All order
        app.get("/orders", async (req, res) => {
            const query = {}
            const cursor = orderCollection.find(query)
            const result = await cursor.toArray()
            res.send(result)

        })

        // paynent

        app.post('/create-payment-intent', verifyJWT, async (req, res) => {
            const service = req.body
            const totalprice = service.totalprice
            const amount = totalprice * 100
            // const paymentIntent = await stripe.paymentIntents.create
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                payment_method_types: ['card']
            })
            res.send({ clientSecret: paymentIntent.client_secret })
        })


        // -------------------------------------------------------------------------------------------------------------------
        // My order
        app.get("/myitems", verifyJWT, async (req, res) => {
            const email = req.query.email
            const decodedEmail = req.decoded.email

            if (email === decodedEmail) {
                const query = { email: email }
                const result = await orderCollection.find(query).toArray()
                return res.send(result)
            }
            else {
                return res.status(403).send({ message: "Forbiden Access" })
            }

        })

        // for paymet order

        app.get("/myitems/:id", async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await orderCollection.findOne(query)
            res.send(result)
        })

        app.patch("/myitems/:id", verifyJWT, async (req, res) => {
            const id = req.params.id
            const payment = req.body
            const filter = { _id: ObjectId(id) }
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId,
                }
            }
            const updatedOrder = await orderCollection.updateOne(filter, updatedDoc)
            const result = await paymentsCollection.insertOne(payment)
            res.send(updatedDoc)
        })


        app.delete("/myitems/:id", async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await orderCollection.deleteOne(query)
            res.send(result)
        })


        // user---------------------------------------------------------------------------------------------------------------------------

        // admin
        app.put("/user/admin/:email", verifyJWT, async (req, res) => {
            const email = req.params.email
            const requester = req.decoded.email
            const requesterAccount = await userCollection.findOne({ email: requester })

            if (requesterAccount.role === "admin") {
                const filter = { email: email }
                const updateDoc = {
                    $set: { role: "admin" },
                }
                const result = await userCollection.updateOne(filter, updateDoc)
                res.send(result)
            }
            else {
                return res.status(403).send({ message: "Forbiden Access" })
            }
        })

        app.get("/admin/:email", async (req, res) => {
            const email = req.params.email
            const user = await userCollection.findOne({ email: email })
            const isAdmin = user.role === "admin"
            res.send(({ admin: isAdmin }))
        })

        // all user
        app.put("/user/:email", async (req, res) => {
            const email = req.params.email
            const user = req.body
            const filter = { email: email }
            const options = { upsert: true }
            const updateDoc = {
                $set: user
            }
            const result = await userCollection.updateOne(filter, updateDoc, options)
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' })
            // console.log(token)
            res.send({ result, token })

        })

        app.get("/user", verifyJWT, async (req, res) => {
            const query = {}
            const cursor = userCollection.find(query)
            const result = await cursor.toArray()
            res.send(result)
        })


        // ------------------------------------------------------------------------------------------------------------------

        // all user
        app.put("/updateuser/:email", async (req, res) => {
            const email = req.params.email
            const user = req.body
            const filter = { email: email }
            const options = { upsert: true }
            const updateDoc = {
                $set: user
            }
            const result = await updateUserCollection.updateOne(filter, updateDoc, options)
            res.send(result)

        })

        // My items
        app.get('/updateuser/:email', async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const cursor = await updateUserCollection.find(query).toArray()
            res.send(cursor)
        })



    } finally {

    }
}

run().catch(console.dir)


app.get("/", (req, res) => {
    res.send("Madd Easy Server Is running")
})

app.listen(port, () => {
    console.log("Listening to port", port)
})
