const mongoose = require("mongoose");
const express = require("express");
const app = express();
const PORT = 3000;

app.use(
    express.static(__dirname + "/public", {
        setHeaders: (res, path, stat) => {
            if (path.endsWith(".js")) {
                res.setHeader("Content-Type", "text/javascript");
            }
        },
    })
);
app.use(express.json());

const ordersSchema = new mongoose.Schema(
    {
        number: { type: String, required: true },
        address: { type: String, required: true },
        items: [
            {
                name: { type: String, required: true },
                quantity: { type: String, required: true },
                price: { type: String, required: true },
            },
        ],
        price: { type: Number, required: true, min: 0 },
        status: { type: String, required: true },
        worker: { type: mongoose.Schema.Types.ObjectId, ref: "workers" },
    },
    { versionKey: false }
);

const workersSchema = new mongoose.Schema(
    {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        middleName: { type: String },
        orders: { type: [String] },
        totalOrders: { type: Number, default: 0 },
    },
    { versionKey: false }
);

const Order = mongoose.model("orders", ordersSchema);
const Worker = mongoose.model("workers", workersSchema);

async function main() {
    try {
        await mongoose.connect("mongodb://127.0.0.1:27017/Medicine");
        app.listen(PORT);
        console.log(`Сервер был сопряжен с бд и подключен по localhost:${PORT}`);
    } catch (err) {
        console.log(err);
    }
}

app.get("/api/orders", async (req, res) => {
    try {
        // Используем populate для получения данных о сотрудниках
        const orders = await Order.find().populate("worker");
        res.json(orders);
    } catch (error) {
        res.status(500).send(error.message);
    }
});


app.get("/api/workers", async (req, res) => {
    const workers = await Worker.find({});
    res.send(workers);
});

app.get("/api/orders/:id", async (req, res) => {
    try {
        // Используем populate для получения данных о сотрудниках
        const order = await Order.findById(req.params.id).populate("worker");
        if (order) {
            res.json(order);
        } else {
            res.sendStatus(404);
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.get("/api/workers/:id", async (req, res) => {
    const id = req.params.id;
    try {
        const worker = await Worker.findById(id);
        if (worker) {
            res.send(worker);
        } else {
            res.sendStatus(404);
        }
    } catch (error) {
        res.status(500).send("Internal Server Error: Unable to retrieve worker");
    }
});

app.post("/api/orders", async (req, res) => {
    if (!req.body) return res.status(400).send("Bad Request: No data provided");

    const { number, address, items, price, status, worker } = req.body;

    if (!number || !address || !price) {
        return res.status(400).send("Bad Request: Missing required fields");
    }

    try {
        const order = new Order({
            number,
            address,
            items,
            price,
            status,
            worker,
        });

        await order.save();
        res.status(201).send(order);
    } catch (error) {
        res.status(500).send("Internal Server Error: Unable to save order");
    }
});

app.post("/api/workers", async (req, res) => {
    if (!req.body || !req.body.firstName || !req.body.lastName) {
        return res.status(400).send("Bad Request: Missing required fields");
    }

    try {
        const newWorker = new Worker(req.body);

        await newWorker.save();
        res.status(201).send(newWorker);
    } catch (error) {
        res.status(500).send("Internal Server Error: Unable to save worker");
    }
});

app.delete("/api/orders/:id", async (req, res) => {
    const id = req.params.id;
    const order = await Order.findByIdAndDelete(id);
    if (order) res.send(order);
    else res.sendStatus(404);
});

app.put("/api/orders/:id", async (req, res) => {
    try {
        const { number, address, items, price, status, worker } = req.body;
        // Используем new: true для возврата обновленного документа и populate для получения данных о сотрудниках
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { number, address, items, price, status, worker },
            { new: true }
        ).populate("worker");

        if (order) {
            res.json(order);
        } else {
            res.sendStatus(404);
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
});


main();
process.on("SIGINT", async () => {
    await mongoose.disconnect();
    console.log("Приложение завершило работу");
    process.exit();
});
