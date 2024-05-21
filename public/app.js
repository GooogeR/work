const mongoose = require("mongoose");
const express = require("express");
const app = express();
const PORT = 3000;

mongoose.connect("mongodb://localhost:27017/Medicine", { useNewUrlParser: true, useUnifiedTopology: true });

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
    const id = req.params.id;
    const order = await Order.findById(id).populate('worker');
    if (order) res.send(order);
    else res.sendStatus(404);
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

// Добавление заказа с обновлением количества заказов у сотрудника
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

        // Обновляем количество заказов у сотрудника
        if (worker) {
            await Worker.findByIdAndUpdate(worker, { $inc: { totalOrders: 1 } });
        }

        res.status(201).send(order);
    } catch (error) {
        res.status(500).send("Internal Server Error: Unable to save order");
    }
});

// Добавление нового сотрудника
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

// Обновление заказа с обновлением количества заказов у сотрудника
app.put("/api/orders/:id", async (req, res) => {
    if (!req.body) return res.sendStatus(400);

    const id = req.params.id;
    const { number, address, items, price, status, worker } = req.body;

    try {
        const existingOrder = await Order.findById(id);
        if (!existingOrder) {
            return res.status(404).send("Order not found");
        }

        const previousWorker = existingOrder.worker;

        const updatedOrder = await Order.findByIdAndUpdate(
            id,
            { number, address, items, price, status, worker },
            { new: true }
        );

        // Обновляем количество заказов у сотрудников
        if (previousWorker && previousWorker.toString() !== worker) {
            await Worker.findByIdAndUpdate(previousWorker, { $inc: { totalOrders: -1 } });
        }

        if (worker && previousWorker.toString() !== worker) {
            await Worker.findByIdAndUpdate(worker, { $inc: { totalOrders: 1 } });
        }

        res.send(updatedOrder);
    } catch (error) {
        res.status(500).send("Internal Server Error: Unable to update order");
    }
});


// Обновление заказа с обновлением количества заказов у сотрудника
app.put("/api/orders/:id", async (req, res) => {
    if (!req.body) return res.sendStatus(400);

    const id = req.params.id;
    const { number, address, items, price, status, worker } = req.body;

    const newOrder = {
        number,
        address,
        items,
        price,
        status,
        worker,
    };

    const order = await Order.findOneAndUpdate({ _id: id }, newOrder, {
        new: true,
    });

    if (order) {
        // Обновляем количество заказов у сотрудника
        if (worker) {
            await updateWorkerTotalOrders(worker);
        }
        res.send(order);
    } else {
        res.sendStatus(404);
    }
});

// Маршрут для обновления количества заказов у сотрудника
app.put("/api/workers/:id/updateOrders", async (req, res) => {
    const workerId = req.params.id;

    try {
        const worker = await Worker.findById(workerId);
        if (!worker) {
            return res.status(404).send('Worker not found');
        }

        // Обновляем количество заказов у сотрудника
        const totalOrders = await Order.countDocuments({ worker: workerId });
        worker.totalOrders = totalOrders;
        await worker.save();

        res.send(worker);
    } catch (error) {
        res.status(500).send('Internal Server Error: Unable to update worker total orders');
    }
});

// Функция для обновления количества заказов у сотрудника
async function updateWorkerTotalOrders(workerId) {
    const totalOrders = await Order.countDocuments({ worker: workerId });
    await Worker.findByIdAndUpdate(workerId, { totalOrders: totalOrders });
}

main();
process.on("SIGINT", async () => {
    await mongoose.disconnect();
    console.log("Приложение завершило работу");
    process.exit();
});
