const express = require('express')
const jwt = require('jsonwebtoken')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
require('dotenv').config()
const port = process.env.PORT || 5000
const app = express()


// middleware
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0catxlt.mongodb.net/?retryWrites=true&w=majority`
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 })




async function run() {

    try {
        await client.connect()

        const productsCollection = client.db("MadeEasy").collection("items")
        const reviewsCollection = client.db("MadeEasy").collection("reviews")
        const orderCollection = client.db("MadeEasy").collection("orders")
        const userCollection = client.db("MadeEasy").collection("users")

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

        // post item

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

        // -------------------------------------------------------------------------------------------------------------------
        // My order
        app.get("/myitems", async (req, res) => {
            const email = req.query.email
            // console.log(email)
            const query = { email: email }
            const result = await orderCollection.find(query).toArray()
            res.send(result)

        })

        app.delete("/myitems/:id", async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await orderCollection.deleteOne(query)
            res.send(result)
        })


        // user---------------------------------------------------------------------------------------------------------------------------

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
