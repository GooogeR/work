const tbody = document.querySelector("tbody");

async function GetWorkers() {
try {
    const responseWorkers = await fetch("/api/workers", {
     method: "GET",
     headers: { Accept: "application/json" },
    });

    if (responseWorkers.ok === true) {
     const workersData = await responseWorkers.json();
     console.log('Полученные данные сотрудников:', workersData); // Логируем полученные данные

     tbody.innerHTML = ''; // Очищаем таблицу перед добавлением новых данных
     workersData.forEach(worker => {
        tbody.append(row(worker));
     });
    } else {
     console.error("Ошибка при получении данных сотрудников:", responseWorkers.statusText);
    }
} catch (error) {
    console.error("Ошибка при получении данных:", error);
}
}

// Функция для создания строки таблицы с данными о сотруднике
function row(worker) {
    // Создаем новую строку таблицы
    const tr = document.createElement("tr");
    // Устанавливаем атрибут data-rowid для идентификации строки сотрудника

    tr.setAttribute("data-rowid", worker._id);

    // Создаем ячейки для имени, фамилии и отчества сотрудника
    const firstNameTd = document.createElement("td");
    firstNameTd.textContent = worker.firstName; // Исправлено: добавлен текст с именем сотрудника
    tr.append(firstNameTd);

    const lastNameTd = document.createElement("td");
    lastNameTd.textContent = worker.lastName; // Исправлено: добавлен текст с фамилией сотрудника
    tr.append(lastNameTd);

    const middleNameTd = document.createElement("td");
    middleNameTd.textContent = worker.middleName; // Исправлено: добавлен текст с отчеством сотрудника
    tr.append(middleNameTd);

    // Создаем ячейку для списка номеров заказов сотрудника
    const ordersTd = document.createElement("td");
    ordersTd.textContent = worker.orders.join(', '); // Исправлено: добавлен текст с номерами заказов сотрудника
    tr.append(ordersTd);

    // Создаем ячейку для общего количества заказов сотрудника
    const totalOrdersTd = document.createElement("td");
    totalOrdersTd.textContent = worker.totalOrders; // Исправлено: добавлен текст с общим количеством заказов сотрудника
    tr.append(totalOrdersTd);

    // Создаем ячейки для кнопок редактирования и удаления сотрудника
    const linksTd = document.createElement("td");
    const editLink = document.createElement("a");
    editLink.setAttribute("data-id", worker._id);
    editLink.setAttribute("class", "btn");
    editLink.textContent = "Изменить";
    editLink.addEventListener("click", (e) => {
        e.preventDefault();
        GetWorker(worker._id);
    });
    linksTd.append(editLink);

    const removeLink = document.createElement("a");
    removeLink.setAttribute("data-id", worker._id);
    removeLink.setAttribute("class", "btn");
    removeLink.textContent = "Удалить";
    removeLink.addEventListener("click", (e) => {
        e.preventDefault();
        DeleteWorker(worker._id);
    });

    linksTd.append(removeLink);
    tr.appendChild(linksTd);

    return tr; // Возвращаем сформированную строку таблицы
}

async function GetWorker(id) {
const response = await fetch("/api/workers/" + id, {
    method: "GET",
    headers: { Accept: "application/json" },
});
if (response.ok === true) {
    const worker = await response.json();
    const form = document.forms["workerForm"];
    form.elements["id"].value = worker._id;
    form.elements["firstName"].value = worker.firstName;
    form.elements["lastName"].value = worker.lastName;
} else {
    console.error("Ошибка при получении данных сотрудника:", response.statusText);
}
}

async function EditWorker(workerId, firstName, lastName) {
const response = await fetch("/api/workers/" + workerId, {
    method: "PUT",
    headers: {
     Accept: "application/json",
     "Content-Type": "application/json",
    },
    body: JSON.stringify({ firstName: firstName, lastName: lastName }),
});
if (response.ok) {
    const worker = await response.json();
    reset();
    document
     .querySelector(`tr[data-rowid="${worker._id}"]`)
     .replaceWith(row(worker));
} else {
    alert("Ошибка при редактировании сотрудника: " + await response.text());
}
}

async function AddWorker(firstName, lastName, middleName, orders, totalOrders) {
const response = await fetch("/api/workers", {
    method: "POST",
    headers: {
     Accept: "application/json",
     "Content-Type": "application/json",
    },
    body: JSON.stringify({ firstName, lastName, middleName, orders, totalOrders }),
});
if (response.ok) {
    const worker = await response.json();
    tbody.append(row(worker));
    reset();
} else {
    alert("Ошибка при добавлении сотрудника: " + await response.text());
}
}

async function DeleteWorker(id) {
const response = await fetch("/api/workers/" + id, {
    method: "DELETE",
    headers: { Accept: "application/json" },
});
if (response.ok === true) {
    const worker = await response.json();
    document.querySelector(`tr[data-rowid="${worker._id}"]`).remove();
} else {
    console.error("Ошибка при удалении сотрудника:", response.statusText);
}
}

function reset() {
const form = document.forms["workerForm"];
form.reset();
form.elements["id"].value = 0;
}

document.forms["workerForm"].addEventListener("submit", (e) => {
e.preventDefault();
const form = document.forms["workerForm"];
const id = form.elements["id"].value;
const firstName = form.elements["firstName"].value;
const lastName = form.elements["lastName"].value;
const middleName = form.elements["middleName"].value;
const orders = form.elements["orders"].value.split(',').map(order => order.trim());
const totalOrders = form.elements["totalOrders"].value;

if (id !== "0") {
    EditWorker(id, firstName, lastName);
} else {
    AddWorker(firstName, lastName, middleName, orders, totalOrders);
}
});

GetWorkers();