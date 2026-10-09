const loadUsersButton = document.querySelector("#load-users");
const filterInput = document.querySelector("#filter-input");
const statusElement = document.querySelector("#status");
const usersList = document.querySelector("#users-list");

let users = [];

function renderUsers(list) {
  usersList.replaceChildren();

  if (list.length === 0) {
    statusElement.textContent = filterInput.value.trim()
      ? "No users match your filter."
      : "No users to display.";
    return;
  }

  for (const user of list) {
    const item = document.createElement("li");
    item.className = "user-card";

    const name = document.createElement("h3");
    name.textContent = user.name;
    const email = document.createElement("p");
    email.textContent = `Email: ${user.email}`;
    const city = document.createElement("p");
    city.textContent = `City: ${user.address.city}`;
    const company = document.createElement("p");
    company.textContent = `Company: ${user.company.name}`;

    item.append(name, email, city, company);
    usersList.appendChild(item);
  }

  statusElement.textContent = `Showing ${list.length} user${list.length === 1 ? "" : "s"}.`;
}

async function loadUsers() {
  loadUsersButton.disabled = true;
  statusElement.textContent = "Loading users...";
  usersList.replaceChildren();

  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/users");
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    users = await response.json();
    renderUsers(users);
  } catch (error) {
    users = [];
    usersList.replaceChildren();
    statusElement.textContent = `Unable to load users. Please try again. (${error.message})`;
  } finally {
    loadUsersButton.disabled = false;
  }
}

loadUsersButton.addEventListener("click", loadUsers);

filterInput.addEventListener("input", () => {
  const query = filterInput.value.trim().toLowerCase();
  if (users.length === 0) {
    if (query) statusElement.textContent = "Load users first to filter the directory.";
    return;
  }
  const filteredUsers = users.filter(user => user.name.toLowerCase().includes(query));
  renderUsers(filteredUsers);
});
