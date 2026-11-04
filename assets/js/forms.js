/*
 * Client-side form handling.
 *
 * The site has no back end, so forms are never posted anywhere. Each form is
 * validated in the browser; when it is valid the visitor is told honestly that
 * online requests are not connected yet.
 *
 * To route valid submissions to the clinic, fill in ONE of the values below
 * with the clinic's real details:
 *   - whatsapp: international number, digits only (e.g. "2010xxxxxxxx")
 *   - email:    the clinic's inbox
 * The form will then open WhatsApp or the visitor's email app with the
 * message pre-filled.
 */
(function () {
  "use strict";

  var CLINIC_CONTACT = {
    whatsapp: "",
    email: "",
  };

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var PHONE_RE = /^\+?[0-9\s()-]{7,20}$/;
  var hasContact = Boolean(CLINIC_CONTACT.whatsapp || CLINIC_CONTACT.email);

  function fieldLabel(el) {
    if (el.type === "date") return "Preferred date";
    return (el.getAttribute("placeholder") || el.name || "This field").replace(/[*:.]+$/, "").trim();
  }

  function setStatus(form, text, isError) {
    var box = form.querySelector(".form-status");
    if (!box) {
      box = document.createElement("p");
      box.className = "form-status";
      box.setAttribute("role", "status");
      box.setAttribute("aria-live", "polite");
      form.appendChild(box);
    }
    box.textContent = text;
    box.classList.toggle("is-error", Boolean(isError));
  }

  function clearErrors(form) {
    form.querySelectorAll(".is-invalid").forEach(function (el) {
      el.classList.remove("is-invalid");
      el.removeAttribute("aria-invalid");
    });
  }

  function validate(form) {
    clearErrors(form);
    var errors = [];
    form.querySelectorAll("input, textarea").forEach(function (el) {
      if (el.type === "hidden" || el.type === "submit" || el.type === "checkbox" || el.type === "radio") return;
      var value = el.value.trim();
      var label = fieldLabel(el);
      var problem = "";
      if (!value) problem = label + " is required.";
      else if (el.type === "email" && !EMAIL_RE.test(value)) problem = "Please enter a valid email address.";
      else if ((el.type === "tel" || /phone/i.test(label)) && !PHONE_RE.test(value)) problem = "Please enter a valid phone number.";
      if (problem) {
        el.classList.add("is-invalid");
        el.setAttribute("aria-invalid", "true");
        errors.push({ el: el, msg: problem });
      }
    });
    return errors;
  }

  function buildMessage(form) {
    var lines = [];
    form.querySelectorAll("input, textarea, select").forEach(function (el) {
      if (el.type === "submit" || el.type === "hidden" || !el.value.trim()) return;
      lines.push(fieldLabel(el) + ": " + el.value.trim());
    });
    return lines.join("\n");
  }

  function isSearchForm(form) {
    var fields = form.querySelectorAll("input, textarea");
    return fields.length === 1 && /search/i.test(fields[0].getAttribute("placeholder") || "");
  }

  document.querySelectorAll("form").forEach(function (form) {
    form.setAttribute("novalidate", "");
    form.removeAttribute("action");

    if (isSearchForm(form)) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        setStatus(form, "Search is not available yet.", true);
      });
      return;
    }

    form.querySelectorAll("input, textarea").forEach(function (el) {
      if (el.type === "submit") return;
      el.setAttribute("required", "");
      if (!el.getAttribute("aria-label") && (el.getAttribute("placeholder") || el.type === "date")) {
        el.setAttribute("aria-label", fieldLabel(el));
      }
      if (/phone/i.test(el.getAttribute("placeholder") || "") && el.type === "number") el.type = "tel";
      el.addEventListener("input", function () {
        el.classList.remove("is-invalid");
        el.removeAttribute("aria-invalid");
      });
    });

    if (!hasContact) {
      var note = document.createElement("p");
      note.className = "form-note";
      note.textContent = "Online requests aren't connected yet. Clinic contact details are coming soon.";
      form.appendChild(note);
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var errors = validate(form);
      if (errors.length) {
        setStatus(form, errors[0].msg, true);
        errors[0].el.focus();
        return;
      }
      var message = buildMessage(form);
      if (CLINIC_CONTACT.whatsapp) {
        window.open("https://wa.me/" + CLINIC_CONTACT.whatsapp + "?text=" + encodeURIComponent(message), "_blank", "noopener");
        setStatus(form, "Opening WhatsApp with your message…", false);
      } else if (CLINIC_CONTACT.email) {
        window.location.href = "mailto:" + CLINIC_CONTACT.email + "?subject=" + encodeURIComponent("Website enquiry") + "&body=" + encodeURIComponent(message);
        setStatus(form, "Opening your email app with your message…", false);
      } else {
        setStatus(form, "Your details look good, but nothing was sent: online requests aren't connected yet.", false);
      }
    });
  });
})();
