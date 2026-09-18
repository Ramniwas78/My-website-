document.addEventListener("DOMContentLoaded", () => {
  const servicesGrid = document.getElementById("servicesGrid");
  const galleryGrid = document.getElementById("galleryGrid");
  const testimonialsGrid = document.getElementById("testimonialsGrid");
  const serviceSelect = document.getElementById("serviceSelect");
  const footerServices = document.getElementById("footerServices");
  const contactForm = document.getElementById("contactForm");
  const formStatus = document.getElementById("formStatus");
  const year = document.getElementById("year");

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  async function loadWebsiteData() {
    try {
      const response = await fetch("/api/public");

      if (!response.ok) {
        throw new Error("Unable to load website data.");
      }

      const data = await response.json();

      loadServices(data.services || []);
      loadGallery(data.gallery || []);
      loadTestimonials(data.testimonials || []);

    } catch (error) {
      console.error("Website data error:", error);

      if (servicesGrid) {
        servicesGrid.innerHTML =
          "<p>Services are currently unavailable.</p>";
      }

      if (galleryGrid) {
        galleryGrid.innerHTML =
          "<p>Gallery is currently unavailable.</p>";
      }

      if (testimonialsGrid) {
        testimonialsGrid.innerHTML =
          "<p>Testimonials are currently unavailable.</p>";
      }
    }
  }

  function loadServices(services) {
    if (!servicesGrid) return;

    servicesGrid.innerHTML = "";

    if (serviceSelect) {
      serviceSelect.innerHTML =
        '<option value="">Select a service</option>';
    }

    if (footerServices) {
      footerServices.innerHTML = "";
    }

    if (services.length === 0) {
      servicesGrid.innerHTML = "<p>No services available.</p>";
      return;
    }

    services.forEach(service => {
      const card = document.createElement("div");
      card.className = "service-card";

      card.innerHTML = `
        <div class="card-icon">${escapeHtml(service.icon || "🪨")}</div>
        <h3>${escapeHtml(service.title)}</h3>
        <p>${escapeHtml(service.description)}</p>
      `;

      servicesGrid.appendChild(card);

      if (serviceSelect) {
        const option = document.createElement("option");
        option.value = service.title;
        option.textContent = service.title;
        serviceSelect.appendChild(option);
      }

      if (footerServices) {
        const li = document.createElement("li");
        li.innerHTML =
          `<a href="#services">${escapeHtml(service.title)}</a>`;
        footerServices.appendChild(li);
      }
    });
  }

  function loadGallery(gallery) {
    if (!galleryGrid) return;

    galleryGrid.innerHTML = "";

    if (gallery.length === 0) {
      galleryGrid.innerHTML =
        "<p>No gallery images available.</p>";
      return;
    }

    gallery.forEach(item => {
      const wrapper = document.createElement("div");

      wrapper.innerHTML = `
        <img
          src="${escapeAttribute(item.image)}"
          alt="${escapeAttribute(
            item.title || "Al Bidoor Marble Project"
          )}"
          loading="lazy"
        >
      `;

      galleryGrid.appendChild(wrapper);
    });
  }

  function loadTestimonials(testimonials) {
    if (!testimonialsGrid) return;

    testimonialsGrid.innerHTML = "";

    if (testimonials.length === 0) {
      testimonialsGrid.innerHTML =
        "<p>No testimonials available.</p>";
      return;
    }

    testimonials.forEach(item => {
      const card = document.createElement("div");
      card.className = "testimonial-card";

      card.innerHTML = `
        <p>“${escapeHtml(item.text || "")}”</p>
        <strong>${escapeHtml(item.name || "")}</strong>
        <small>${escapeHtml(item.role || "")}</small>
      `;

      testimonialsGrid.appendChild(card);
    });
  }

  if (contactForm) {
    contactForm.addEventListener("submit", async event => {
      event.preventDefault();

      const submitButton =
        contactForm.querySelector(".form-submit");

      const formData = new FormData(contactForm);

      const name = formData.get("name");
      const phone = formData.get("phone");
      const email = formData.get("email");
      const service = formData.get("service");
      const message = formData.get("message");

      const payload = {
        name,
        phone,
        email,
        service,
        message
      };

      if (formStatus) {
        formStatus.textContent = "Sending enquiry...";
        formStatus.style.color = "#c49a5a";
      }

      if (submitButton) {
        submitButton.disabled = true;
      }

      try {
        // Save enquiry in database
        const response = await fetch("/api/enquiries", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to send enquiry."
          );
        }

        // WhatsApp message
        const whatsappMessage =
          "Hello Al Bidoor Marble Company\n\n" +
          "New Customer Enquiry\n\n" +
          "Name: " + (name || "Not provided") + "\n" +
          "Customer Phone: " + (phone || "Not provided") + "\n" +
          "Email: " + (email || "Not provided") + "\n" +
          "Service: " + (service || "Not selected") + "\n" +
          "Project Details: " + (message || "Not provided");

        const whatsappUrl =
          "https://wa.me/96879159463?text=" +
          encodeURIComponent(whatsappMessage);

        if (formStatus) {
          formStatus.textContent =
            "Enquiry saved successfully. Opening WhatsApp...";
          formStatus.style.color = "#16803c";
        }

        contactForm.reset();

        // Open WhatsApp
        window.location.href = whatsappUrl;

      } catch (error) {
        console.error("Enquiry error:", error);

        if (formStatus) {
          formStatus.textContent =
            error.message || "Something went wrong.";
          formStatus.style.color = "#c62828";
        }

      } finally {
        if (submitButton) {
          submitButton.disabled = false;
        }
      }
    });
  }

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

  loadWebsiteData();
});
