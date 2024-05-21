const tbody = document.querySelector("tbody");
const workerSelect = document.getElementById("worker");

// Функция для получения и отображения заказов
async function GetOrders() {
    try {
        const response = await fetch("/api/orders", {
            method: "GET",
            headers: { Accept: "application/json" },
        });

        if (response.ok === true) {
            const orders = await response.json();
            orders.forEach(order => {
                tbody.append(row(order));
            });
        }
    } catch (error) {
        console.error("Ошибка при получении данных:", error);
    }
}


// Функция для получения и отображения сотрудников
async function GetWorkers() {
    try {
        const response = await fetch("/api/workers", {
            method: "GET",
            headers: { Accept: "application/json" },
        });

        if (response.ok === true) {
            const workers = await response.json();
            workers.forEach(worker => {
                const option = document.createElement("option");
                option.value = worker._id;
                option.textContent = `${worker.firstName} ${worker.lastName}`;
                workerSelect.append(option);
            });
        }
    } catch (error) {
        console.error("Ошибка при получении данных:", error);
    }
}

function row(order) {
    const tr = document.createElement("tr");
    tr.setAttribute("data-rowid", order._id);

    const numberTd = document.createElement("td");
    numberTd.textContent = order.number;
    tr.append(numberTd);

    const addressTd = document.createElement("td");
    addressTd.textContent = order.address;
    tr.append(addressTd);

    const itemsTd = document.createElement("td");
    itemsTd.textContent = order.items.map(item => `${item.name} (${item.quantity} x ${item.price})`).join(', ');
    tr.append(itemsTd);

    const priceTd = document.createElement("td");
    priceTd.textContent = order.price;
    tr.append(priceTd);

    const statusTd = document.createElement("td");
    statusTd.textContent = order.status;
    tr.append(statusTd);

    const workerTd = document.createElement("td");
    workerTd.classList.add("worker"); // Добавляем класс "worker" к ячейке сотрудника

    // Проверяем и выводим данные о сотруднике, если они есть
    console.log('Worker:', order.worker);
    if (order.worker && order.worker.firstName && order.worker.lastName) {
        workerTd.textContent = `${order.worker.firstName} ${order.worker.lastName}`;
    } else {
        workerTd.textContent = "Не назначен";
    }
    tr.append(workerTd);

    const linksTd = document.createElement("td");
    const editLink = document.createElement("a");
    editLink.setAttribute("data-id", order._id);
    editLink.setAttribute("class", "btn");
    editLink.textContent = "Изменить";
    editLink.addEventListener("click", (e) => {
        e.preventDefault();
        GetOrder(order._id);
    });
    linksTd.append(editLink);

    const removeLink = document.createElement("a");
    removeLink.setAttribute("data-id", order._id);
    removeLink.setAttribute("class", "btn");
    removeLink.textContent = "Удалить";
    removeLink.addEventListener("click", (e) => {
        e.preventDefault();
        DeleteOrder(order._id);
    });

    linksTd.append(removeLink);
    tr.appendChild(linksTd);

    return tr;
}


// Функция для получения данных одного заказа и заполнения формы
async function GetOrder(id) {
    const response = await fetch("/api/orders/" + id, {
        method: "GET",
        headers: { Accept: "application/json" },
    });
    if (response.ok === true) {
        const order = await response.json();
        const form = document.forms["orderForm"];
        form.elements["id"].value = order._id;
        form.elements["number"].value = order.number;
        form.elements["address"].value = order.address;
        form.elements["items"].value = order.items.map(item => `${item.name},${item.quantity},${item.price}`).join(';');
        form.elements["price"].value = order.price;
        form.elements["status"].value = order.status;

        if (order.worker) {
            form.elements["worker"].value = order.worker._id;
        }
    }
}

// Функция для изменения заказа
async function EditOrder(orderId, number, address, items, price, status, workerId) {
    console.log('Editing order with worker ID:', workerId);
    const response = await fetch("/api/orders/" + orderId, {
        method: "PUT",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ number, address, items, price, status, worker: workerId }),
    });
    if (response.ok) {
        const order = await response.json();
        console.log('Order updated:', order);
    
        // Заменяем строку таблицы на новую строку с обновленными данными заказа
        const updatedRow = row(order);
        const existingRow = document.querySelector(`tr[data-rowid="${order._id}"]`);
        existingRow.parentNode.replaceChild(updatedRow, existingRow);
    
        // Обновляем количество заказов у сотрудника только если он был назначен
        if (workerId !== "Не назначен") {
            await updateWorkerOrders(workerId);
        }
    }    
}

// Функция для добавления нового заказа
async function AddOrder(number, address, items, price, status, worker) {
    try {
        const response = await fetch("/api/orders", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ number, address, items, price, status, worker }),
        });
        if (response.ok) {
            const order = await response.json();
            tbody.append(row(order));
            reset();

            // Обновляем данные сотрудника при успешном добавлении заказа
            if (worker !== "Не назначен") {
                await updateWorkerOrders(worker);
            }
        } else {
            console.error("Ошибка при добавлении заказа:", response.statusText);
        }
    } catch (error) {
        console.error("Ошибка при добавлении заказа:", error);
    }
}

// Функция о добавлении заказа к сотруднику
async function updateWorkerOrders(workerId) {
    try {
        const response = await fetch("/api/workers/" + workerId + "/updateOrders", {
            method: "PUT",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
        });
        if (!response.ok) {
            console.error("Ошибка при обновлении данных сотрудника:", response.statusText);
        }
    } catch (error) {
        console.error("Ошибка при обновлении данных сотрудника:", error);
    }
}

// Функция для удаления заказа
async function DeleteOrder(id) {
    const response = await fetch("/api/orders/" + id, {
        method: "DELETE",
        headers: { Accept: "application/json" },
    });
    if (response.ok === true) {
        const order = await response.json();
        document.querySelector(`tr[data-rowid="${order._id}"]`).remove();

        // Обновляем данные сотрудника при успешном удалении заказа
        if (order.worker) {
            await updateWorkerOrders(order.worker._id);
        }
    }
}

// Функция для сброса формы
function reset() {
    const form = document.forms["orderForm"];
    form.reset();
    form.elements["id"].value = 0;
}

// Обработчик отправки формы
document.forms["orderForm"].addEventListener("submit", (e) => {
    e.preventDefault();
    const form = document.forms["orderForm"];
    const id = form.elements["id"].value;
    const number = form.elements["number"].value;
    const address = form.elements["address"].value;
    const items = form.elements["items"].value.split(';').map(item => {
        const [name, quantity, price] = item.split(',');
        return { name, quantity, price };
    });
    const price = form.elements["price"].value;
    const status = form.elements["status"].value;
    const worker = form.elements["worker"].value;

    if (id !== "0") {
        EditOrder(id, number, address, items, price, status, worker);
    } else {
        AddOrder(number, address, items, price, status, worker);
    }
});

// Вызов функций для начальной загрузки данных
GetOrders();
GetWorkers();
