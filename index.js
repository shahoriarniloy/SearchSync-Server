const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;



app.use(
    cors({
        origin: [
            'http://localhost:5173', 
            ],
        credentials: true,
    }),
  )

  app.use(express.json());




  
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dxgrzuk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    // strict: true,
    strict: false,

    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const database = client.db("techDB");
    const productsCollection =database.collection("products");

    app.get('/products', async (req, res) => {
      try {
        const page = parseInt(req.query.page);
        const size = parseInt(req.query.size);
        const { search = '', brand = '', category = '', minPrice = 0, maxPrice = 10000000, sort = '' } = req.query;
        const searchRegex = new RegExp(search, 'i'); 
        const brandRegex = new RegExp(brand, 'i');
        const categoryRegex = new RegExp(category, 'i');
    
        const minPriceInt = parseInt(minPrice);
        const maxPriceInt = parseInt(maxPrice);
        
        const query = {
          $and: [
            { product_name: { $regex: searchRegex } },
            { brand_name: { $regex: brandRegex } },
            { category_name: { $regex: categoryRegex } },
            ...(minPrice || maxPrice ? [{ price_range: { $gte: minPriceInt, $lte: maxPriceInt } }] : [])
          ]
        };
    
        let sortOption = {};
        if (sort === 'asc') {
          sortOption = { price_range: 1 }; 
        } else if (sort === 'desc') {
          sortOption = { price_range: -1 }; 
        }
    
        const totalProducts = await productsCollection.countDocuments(query);
    
        const cursor = productsCollection.find(query).skip(page * size).limit(size).sort(sortOption);
        const result = await cursor.toArray();
    
        res.json({ totalProducts, products: result });
      } catch (error) {
        console.error('Error retrieving products:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
    
    

    app.get('/brands', async (req, res) => {
        try {
          const brands = await productsCollection.distinct('brand_name');
          res.json(brands);
        } catch (error) {
          console.error('Error retrieving brands:', error);
          res.status(500).json({ error: 'Internal server error' });
        }
      });
      
      app.get('/categories', async (req, res) => {
        try {
          const categories = await productsCollection.distinct('category_name');
          res.json(categories);
        } catch (error) {
          console.error('Error retrieving categories:', error);
          res.status(500).json({ error: 'Internal server error' });
        }
      });


   
 
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

  
app.get('/',(req,res)=>{
    res.send('SearchSync')
});





app.listen(port,()=>{
    console.log(`Server is running on port: ${port}`);
})