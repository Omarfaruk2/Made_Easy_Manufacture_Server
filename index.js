const express = require('express')
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


        // Get All Items
        app.get("/items", async (req, res) => {
            const query = {}
            const cursor = productsCollection.find(query)
            const result = await cursor.toArray()
            res.send(result)

        })


        // Get All reviews
        app.get("/reviews", async (req, res) => {
            const query = {}
            const cursor = reviewsCollection.find(query)
            const result = await cursor.toArray()
            res.send(result)

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
