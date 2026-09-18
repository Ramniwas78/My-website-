let token = localStorage.getItem("adminToken");

const loginBox = document.getElementById("login");
const appBox = document.getElementById("app");
const errorBox = document.getElementById("err");
const content = document.getElementById("content");

function headers() {
  return {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + token
  };
}

async function login() {
  const username = document.getElementById("u").value.trim();
  const password = document.getElementById("p").value;

  errorBox.textContent = "Logging in...";

  try {
    const response = await fetch("/api/admin/login", {
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
      throw new Error(data.message || "Invalid username or password");
    }

    token = data.token;
    localStorage.setItem("adminToken", token);

    showApp();
    show("enquiries");

  } catch (error) {
    console.error(error);
    errorBox.textContent =
      error.message || "Server connection failed.";
  }
}

function showApp() {
  loginBox.classList.add("hidden");
  appBox.classList.remove("hidden");
}

function logout() {
  localStorage.removeItem("adminToken");
  token = null;

  appBox.classList.add("hidden");
  loginBox.classList.remove("hidden");
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers(),
      ...(options.headers || {})
    }
  });

  if (response.status === 401) {
    logout();
    throw new Error("Session expired. Please login again.");
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

async function show(section) {
  content.innerHTML = "<p>Loading...</p>";

  try {
    if (section === "enquiries") {
      await showEnquiries();
    }

    if (section === "services") {
      await showServices();
    }

    if (section === "gallery") {
      await showGallery();
    }

    if (section === "testimonials") {
      await showTestimonials();
    }

    if (section === "password") {
      showPassword();
    }

  } catch (error) {
    content.innerHTML =
      `<p style="color:red;">${escapeHtml(error.message)}</p>`;
  }
}

async function showEnquiries() {
  const enquiries = await api("/api/admin/enquiries");

  let html = `
    <h1>Customer Enquiries</h1>
    <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Phone</th>
          <th>Email</th>
          <th>Service</th>
          <th>Project Details</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
  `;

  if (enquiries.length === 0) {
    html += `
      <tr>
        <td colspan="7">No enquiries yet.</td>
      </tr>
    `;
  }

  enquiries.forEach(item => {
    html += `
      <tr>
        <td>${escapeHtml(item.name)}</td>
        <td>${escapeHtml(item.phone)}</td>
        <td>${escapeHtml(item.email || "")}</td>
        <td>${escapeHtml(item.service || "")}</td>
        <td>${escapeHtml(item.message)}</td>
        <td>${escapeHtml(item.status)}</td>
        <td>
          <button onclick="deleteEnquiry(${item.id})">
            Delete
          </button>
        </td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
    </div>
  `;

  content.innerHTML = html;
}

async function deleteEnquiry(id) {
  if (!confirm("Delete this enquiry?")) return;

  try {
    await api("/api/admin/enquiries/" + id, {
      method: "DELETE"
    });

    show("enquiries");

  } catch (error) {
    alert(error.message);
  }
}

async function showServices() {
  const services = await api("/api/admin/services");

  let html = `
    <h1>Services</h1>

    <div class="admin-form">
      <input id="serviceTitle" placeholder="Service title">
      <input id="serviceDescription" placeholder="Description">
      <input id="serviceIcon" placeholder="Icon e.g. 🪨">
      <input id="serviceTags" placeholder="Tags">
      <button onclick="addService()">Add Service</button>
    </div>

    <div class="items">
  `;

  services.forEach(item => {
    html += `
      <div class="item">
        <h3>${escapeHtml(item.icon || "")} ${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.description)}</p>
        <small>${escapeHtml(item.tags || "")}</small>
        <br>
        <button onclick="deleteService(${item.id})">
          Delete
        </button>
      </div>
    `;
  });

  html += "</div>";

  content.innerHTML = html;
}

async function addService() {
  const title = document.getElementById("serviceTitle").value;
  const description =
    document.getElementById("serviceDescription").value;
  const icon = document.getElementById("serviceIcon").value;
  const tags = document.getElementById("serviceTags").value;

  try {
    await api("/api/admin/services", {
      method: "POST",
      body: JSON.stringify({
        title,
        description,
        icon,
        tags
      })
    });

    show("services");

  } catch (error) {
    alert(error.message);
  }
}

async function deleteService(id) {
  if (!confirm("Delete this service?")) return;

  await api("/api/admin/services/" + id, {
    method: "DELETE"
  });

  show("services");
}

async function showGallery() {
  const gallery = await api("/api/admin/gallery");

  let html = `
    <h1>Gallery</h1>

    <div class="admin-form">
      <input id="galleryTitle" placeholder="Image title">
      <input id="galleryImage" placeholder="/assets/image.jpg">
      <button onclick="addGallery()">Add Image</button>
    </div>

    <div class="items">
  `;

  gallery.forEach(item => {
    html += `
      <div class="item">
        <h3>${escapeHtml(item.title)}</h3>
        <img
          src="${escapeAttribute(item.image)}"
          style="max-width:250px;border-radius:8px;"
        >
        <br>
        <button onclick="deleteGallery(${item.id})">
          Delete
        </button>
      </div>
    `;
  });

  html += "</div>";

  content.innerHTML = html;
}

async function addGallery() {
  const title = document.getElementById("galleryTitle").value;
  const image = document.getElementById("galleryImage").value;

  try {
    await api("/api/admin/gallery", {
      method: "POST",
      body: JSON.stringify({
        title,
        image
      })
    });

    show("gallery");

  } catch (error) {
    alert(error.message);
  }
}

async function deleteGallery(id) {
  if (!confirm("Delete this image?")) return;

  await api("/api/admin/gallery/" + id, {
    method: "DELETE"
  });

  show("gallery");
}

async function showTestimonials() {
  const testimonials = await api("/api/admin/testimonials");

  let html = `
    <h1>Testimonials</h1>

    <div class="admin-form">
      <input id="testName" placeholder="Name">
      <input id="testRole" placeholder="Role">
      <input id="testInitials" placeholder="Initials">
      <textarea id="testText" placeholder="Testimonial"></textarea>
      <button onclick="addTestimonial()">Add Testimonial</button>
    </div>

    <div class="items">
  `;

  testimonials.forEach(item => {
    html += `
      <div class="item">
        <h3>${escapeHtml(item.name)}</h3>
        <small>${escapeHtml(item.role || "")}</small>
        <p>${escapeHtml(item.text)}</p>
        <button onclick="deleteTestimonial(${item.id})">
          Delete
        </button>
      </div>
    `;
  });

  html += "</div>";

  content.innerHTML = html;
}

async function addTestimonial() {
  const name = document.getElementById("testName").value;
  const role = document.getElementById("testRole").value;
  const initials = document.getElementById("testInitials").value;
  const text = document.getElementById("testText").value;

  try {
    await api("/api/admin/testimonials", {
      method: "POST",
      body: JSON.stringify({
        name,
        role,
        initials,
        text
      })
    });

    show("testimonials");

  } catch (error) {
    alert(error.message);
  }
}

async function deleteTestimonial(id) {
  if (!confirm("Delete this testimonial?")) return;

  await api("/api/admin/testimonials/" + id, {
    method: "DELETE"
  });

  show("testimonials");
}

function showPassword() {
  content.innerHTML = `
    <h1>Change Password</h1>

    <div class="admin-form">
      <input
        id="currentPassword"
        type="password"
        placeholder="Current Password"
      >

      <input
        id="newPassword"
        type="password"
        placeholder="New Password"
      >

      <input
        id="confirmPassword"
        type="password"
        placeholder="Confirm New Password"
      >

      <button onclick="changePassword()">
        Change Password
      </button>

      <p id="passwordMessage"></p>
    </div>
  `;
}

async function changePassword() {
  const currentPassword =
    document.getElementById("currentPassword").value;

  const newPassword =
    document.getElementById("newPassword").value;

  const confirmPassword =
    document.getElementById("confirmPassword").value;

  const messageBox =
    document.getElementById("passwordMessage");

  if (!currentPassword || !newPassword || !confirmPassword) {
    messageBox.textContent = "Please fill all fields.";
    return;
  }

  if (newPassword !== confirmPassword) {
    messageBox.textContent = "New passwords do not match.";
    return;
  }

  if (newPassword.length < 8) {
    messageBox.textContent =
      "New password must be at least 8 characters.";
    return;
  }

  try {
    const data = await api("/api/admin/change-password", {
      method: "POST",
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    });

    messageBox.textContent = data.message;

    document.getElementById("currentPassword").value = "";
    document.getElementById("newPassword").value = "";
    document.getElementById("confirmPassword").value = "";

  } catch (error) {
    messageBox.textContent = error.message;
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

if (token) {
  showApp();
  show("enquiries");
}
