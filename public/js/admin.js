let token = localStorage.getItem("adminToken");

/* Login */
async function login() {
  const username = document.getElementById("u").value.trim();
  const password = document.getElementById("p").value;
  const err = document.getElementById("err");

  err.textContent = "";

  if (!username || !password) {
    err.textContent = "Username and password are required.";
    return;
  }

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username,
        password
      })
    });

    const data = await response.json();

    if (!response.ok) {
      err.textContent = data.error || "Login failed.";
      return;
    }

    token = data.token;
    localStorage.setItem("adminToken", token);

    showApp();
    show("enquiries");

  } catch (error) {
    console.error(error);
    err.textContent = "Server connection failed.";
  }
}

/* Show admin panel */
function showApp() {
  document.getElementById("login").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
}

/* Logout */
function logout() {
  localStorage.removeItem("adminToken");
  token = null;

  document.getElementById("app").classList.add("hidden");
  document.getElementById("login").classList.remove("hidden");
}

/* API helper */
async function api(url, options = {}) {
  options.headers = options.headers || {};

  if (token) {
    options.headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, options);

  if (response.status === 401) {
    logout();
    throw new Error("Session expired.");
  }

  return response;
}

/* Show section */
async function show(section) {
  const content = document.getElementById("content");

  content.innerHTML = "<h2>Loading...</h2>";

  try {
    if (section === "enquiries") {
      await loadEnquiries();
    }

    if (section === "services") {
      await loadServices();
    }

    if (section === "gallery") {
      await loadGallery();
    }

    if (section === "testimonials") {
      await loadTestimonials();
    }

  } catch (error) {
    console.error(error);
    content.innerHTML = `
      <h2>Error</h2>
      <p>${escapeHtml(error.message)}</p>
    `;
  }
}

/* Enquiries */
async function loadEnquiries() {
  const response = await api("/api/enquiries");

  if (!response.ok) {
    throw new Error("Unable to load enquiries.");
  }

  const data = await response.json();

  let html = `
    <h2>Enquiries</h2>
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Phone</th>
          <th>Email</th>
          <th>Message</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
  `;

  if (!Array.isArray(data) || data.length === 0) {
    html += `
      <tr>
        <td colspan="5">No enquiries found.</td>
      </tr>
    `;
  } else {
    data.forEach(item => {
      html += `
        <tr>
          <td>${escapeHtml(item.name || "")}</td>
          <td>${escapeHtml(item.phone || "")}</td>
          <td>${escapeHtml(item.email || "")}</td>
          <td>${escapeHtml(item.message || "")}</td>
          <td>${escapeHtml(item.created_at || "")}</td>
        </tr>
      `;
    });
  }

  html += `
      </tbody>
    </table>
  `;

  document.getElementById("content").innerHTML = html;
}

/* Services */
async function loadServices() {
  const response = await api("/api/services");

  if (!response.ok) {
    throw new Error("Unable to load services.");
  }

  const data = await response.json();

  let html = `
    <h2>Services</h2>
    <p>Services available from the website API.</p>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
  `;

  if (!Array.isArray(data) || data.length === 0) {
    html += `
      <tr>
        <td colspan="3">No services found.</td>
      </tr>
    `;
  } else {
    data.forEach(item => {
      html += `
        <tr>
          <td>${escapeHtml(String(item.id || ""))}</td>
          <td>${escapeHtml(item.name || "")}</td>
          <td>${escapeHtml(item.description || "")}</td>
        </tr>
      `;
    });
  }

  html += `
      </tbody>
    </table>
  `;

  document.getElementById("content").innerHTML = html;
}

/* Gallery */
async function loadGallery() {
  const response = await api("/api/gallery");

  if (!response.ok) {
    throw new Error("Unable to load gallery.");
  }

  const data = await response.json();

  let html = `
    <h2>Gallery</h2>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Image</th>
          <th>Title</th>
        </tr>
      </thead>
      <tbody>
  `;

  if (!Array.isArray(data) || data.length === 0) {
    html += `
      <tr>
        <td colspan="3">No gallery items found.</td>
      </tr>
    `;
  } else {
    data.forEach(item => {
      html += `
        <tr>
          <td>${escapeHtml(String(item.id || ""))}</td>
          <td>
            ${
              item.image
                ? `<img src="${escapeAttribute(item.image)}" width="80" alt="Gallery image">`
                : "No image"
            }
          </td>
          <td>${escapeHtml(item.title || "")}</td>
        </tr>
      `;
    });
  }

  html += `
      </tbody>
    </table>
  `;

  document.getElementById("content").innerHTML = html;
}

/* Testimonials */
async function loadTestimonials() {
  const response = await api("/api/testimonials");

  if (!response.ok) {
    throw new Error("Unable to load testimonials.");
  }

  const data = await response.json();

  let html = `
    <h2>Testimonials</h2>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Message</th>
        </tr>
      </thead>
      <tbody>
  `;

  if (!Array.isArray(data) || data.length === 0) {
    html += `
      <tr>
        <td colspan="3">No testimonials found.</td>
      </tr>
    `;
  } else {
    data.forEach(item => {
      html += `
        <tr>
          <td>${escapeHtml(String(item.id || ""))}</td>
          <td>${escapeHtml(item.name || "")}</td>
          <td>${escapeHtml(item.message || "")}</td>
        </tr>
      `;
    });
  }

  html += `
      </tbody>
    </table>
  `;

  document.getElementById("content").innerHTML = html;
}

/* Security helpers */
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

/* Check existing login */
if (token) {
  showApp();
  show("enquiries");
}
