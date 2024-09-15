let itemsList = []

let htmlGenerator = (arrayItems) => {

    let result = "";
    let container1 = document.getElementById("container1");
    arrayItems.forEach((item, index) => {

        let variable = `
<div id="${item.id}" class="card column is-full-mobile is-one-quarter-desktop draggable alignProduct" draggable="true" data-name="${item.name}" data-price="${item.price}">
    <div class="card-content">
      <div class="media">
        <div class="media-content">
          <p class="title is-4">${item.name}</p>
           <p class="title is-6">Asignado a: ${item.assignedTo}</p>
            <p class="title is-6">Inicio: ${item.startDate}</p>
            <p class="title is-6">Fin: ${item.endDate}</p>
            <p class="title is-6">Estado: ${item.status}</p>
            <p class="title is-6">Prioridad: ${item.priority}</p>
        </div>
      </div>
      <div class="content">
        ${item.description}
      </div>
    </div>
  </div>
</div>
</div> `
        result += variable;
    });
    container1.innerHTML = result;

    // Add a click event on buttons to open a specific modal
    (document.querySelectorAll('.js-modal-trigger') || []).forEach(($trigger) => {
        const modal = $trigger.dataset.target;
        const $target = document.getElementById(modal);

        $trigger.addEventListener('click', () => {
            openModal($target);
        });
    });

    // Add a click event on various child elements to close the parent modal
    (document.querySelectorAll('.modal-background, .modal-close, .modal-card-head .delete, .modal-card-foot .button') || []).forEach(($close) => {
        const $target = $close.closest('.modal');

        $close.addEventListener('click', () => {
            closeModal($target);
        });
    });

    // Add a keyboard event to close all modals
    document.addEventListener('keydown', (event) => {
        if (event.key === "Escape") {
            closeAllModals();
        }
    });

    itemsList.forEach((product) => {
        document.getElementById(product.id).addEventListener("click", () => {
            modalBody(product.id);
        });
    });

    const draggables = document.querySelectorAll('.draggable');

    draggables.forEach(draggable => {
        draggable.addEventListener('dragstart', () => {
            draggable.classList.add('is-dragging');
        });

        draggable.addEventListener('dragend', () => {
            draggable.classList.remove('is-dragging');
        });
    });


}

const parseTaskToItem = (task) => {
    taskToItem = {
        "id": task.id,
        "name": task.title,
        "description": task.description,
        "assignedTo": task.assignedTo,
        "startDate": task.startDate,
        "endDate": task.endDate,
        "status": task.status,
        "priority": task.priority
    };
    return taskToItem;
}


// MODAL FUNCTIONS
function openModal($el) {
    $el.classList.add('is-active');
}

function closeModal($el) {
    $el.classList.remove('is-active');
}

function closeAllModals() {
    (document.querySelectorAll('.modal') || []).forEach(($modal) => {
        closeModal($modal);
    });
};

const noProductsFound = () => {
    const noProducts = document.getElementById("noProducts");
    const products = document.getElementById("products");

    products.classList.add("hidden");
    noProducts.classList.add("is-flex");
};

async function fetchTasks() {

    try {
        const response = await fetch('http://localhost:3000/api/tasks');
        if (!response.ok) {
            throw new Error('Error en respuesta' + response.statusText);
        }
        const tasks = await response.json();
        console.log(tasks);
        for (task of tasks) {
            let item = parseTaskToItem(task);
            itemsList.push(item);
        }
    } catch (error) {
        console.error('Error en fetch', error);
    }
}

//EJECUTA LUEGO DE CARGADO EL HTML, ASEGURA PODER HACER document.[funcionParaObtenerElemento/s] dado que se agregan elementos
document.addEventListener('DOMContentLoaded', async () => {
    await fetchTasks();
    console.log(itemsList);

    htmlGenerator(itemsList);

    const cart = document.getElementById('cart');

    cart.addEventListener('dragover', e => {
        e.preventDefault();
        cart.classList.add('drag-over');
    });

    cart.addEventListener('dragleave', () => {
        cart.classList.remove('drag-over');
    });

    cart.addEventListener('drop', e => {
        e.preventDefault();
        cart.classList.remove('drag-over');

        const draggable = document.querySelector('.is-dragging');
        const itemName = draggable.getAttribute('data-name');
        const itemPrice = draggable.getAttribute('data-price');
        const itemElement = document.createElement('div');
        itemElement.className = 'card';
        itemElement.innerHTML = `
                <div class="card-content">
                    <p class="title">${itemName}</p>
                </div>
            `;
        cart.appendChild(itemElement);
    });
});


let filterByName = (text) => {
    const products = document.getElementById("products");
    products.classList.remove("hidden");
    const noProducts = document.getElementById("noProducts");
    noProducts.classList.remove("is-flex");

    const inputText = text.toLowerCase();
    if (!inputText) {
        htmlGenerator(itemsList);
    } else {
        const filteredProducts = itemsList.filter((item) => {
            return item.name.toLowerCase().includes(inputText);
        });
        if (filteredProducts.length > 0) {
            htmlGenerator(filteredProducts);
        } else {
            noProductsFound();
        }
    }
};

//global variable to check if its create or edit
let selectedItemId = "";
const createOrUpdateTask = async () => {
    let name = document.getElementById("name").value;
    let description = document.getElementById("description").value;
    let assignedTo = document.getElementById("assignedTo").value;
    let start = document.getElementById("start").value;
    let end = document.getElementById("end").value;
    let priority = document.getElementById("priority").value;
    let status = document.getElementById("status").value;

    let newTask = {
        "id": itemsList.length + 1,
        "title": name,
        "description": description,
        "assignedTo": assignedTo,
        "startDate": start,
        "endDate": end,
        "status": status,
        "priority": priority,
        "comments": []
    }

    let method = "POST";
    let URL = "http://localhost:3000/api/tasks";
    if (selectedItemId) {
        method = "PUT";
        URL = URL + "/" + selectedItemId;
    }
    const response = await fetch(URL, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTask),
    });

    const serverResponseTask = await response.json();
    const newItem = parseTaskToItem(serverResponseTask);

    if (method === "POST") {
        itemsList.push(newItem);
    } else {
        let item = itemsList.find(item => item.id == parseInt(selectedItemId));
        Object.assign(item, newItem);
        console.log(itemsList);
    }

    selectedItemId = "";
    htmlGenerator(itemsList);


    document.getElementById("name").value = "";
    document.getElementById("description").value = "";
    document.getElementById("assignedTo").value = "";
    document.getElementById("start").value = "";
    document.getElementById("end").value = "";
    document.getElementById("priority").value = "Low";
    document.getElementById("status").value = "To Do";

    closeModal(document.getElementById("modal-create-product"));
}

const deleteItem = async () => {
    const response = await fetch(`http://localhost:3000/api/tasks/${selectedItemId}`, {
        method: "DELETE",
        headers: {
            'Content-Type': 'application/json',
        },
    });

    document.getElementById("name").value = "";
    document.getElementById("description").value = "";
    document.getElementById("assignedTo").value = "";
    document.getElementById("start").value = "";
    document.getElementById("end").value = "";
    document.getElementById("priority").value = "Low";
    document.getElementById("status").value = "To Do";

    closeModal(document.getElementById("modal-create-product"));

    itemsList = itemsList.filter(item => item.id !== selectedItemId);
    htmlGenerator(itemsList);
    selectedItemId = "";
}

const modalBody = (productId) => {
    const item = itemsList.find(item => item.id == parseInt(productId));
    selectedItemId = productId;
    showButtonDelete();
    // const modalTitle = document.getElementById("ModalTitle");
    // const modalDescription = document.getElementById("ModalDescription");
    // const modalImage = document.getElementById("modalImage");

    document.getElementById("name").value = item.name;
    document.getElementById("description").value = item.description;
    document.getElementById("assignedTo").value = item.assignedTo;
    document.getElementById("start").value = item.startDate;
    document.getElementById("end").value = item.endDate;
    document.getElementById("priority").value = item.priority;
    document.getElementById("status").value = item.status;


    // modalTitle.innerHTML = item.name;
    // modalDescription.innerHTML = item.description + " " + item.price;
    // modalImage.src = item.image;
    document.getElementById("modal-create-product").classList.add('is-active');
}

const orderProducts = document.getElementById("orderProducts");
const inputText = document.getElementById("input1");
const save = document.getElementById("save");
const create = document.getElementById("create");
const deleteButton = document.getElementById("delete");

inputText.addEventListener("input", () => {
    filterByName(inputText.value);
});

save.addEventListener("click", createOrUpdateTask);
deleteButton.addEventListener("click", deleteItem);

create.addEventListener("click", () => {
    selectedItemId = "";
    hideButtonDelete();
    document.getElementById("name").value = "";
    document.getElementById("description").value = "";
    document.getElementById("assignedTo").value = "";
    document.getElementById("start").value = "";
    document.getElementById("end").value = "";
    document.getElementById("priority").value = "Low";
    document.getElementById("status").value = "To Do";
});

const hideButtonDelete = () => {
     const deleteButton = document.getElementById("delete");
     deleteButton.style.display = 'none';
}

const showButtonDelete = () => {
     const deleteButton = document.getElementById("delete");
     deleteButton.style.display = 'inline-block';
}
