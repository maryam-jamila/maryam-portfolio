/* Save the public contact form into Supabase. */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".contact-form");
  if (!form || !window.supabaseClient) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const subject = document.getElementById("subject").value;
    const message = document.getElementById("message").value.trim();
    const button = form.querySelector('button[type="submit"]');

    if (!name || !email || !subject || !message) {
      alert("Please fill in all fields.");
      return;
    }

    button.disabled = true;
    const original = button.innerHTML;
    button.textContent = "Sending...";

    const { error } = await window.supabaseClient.from("contact_messages").insert({
      name, email, subject, message
    });

    button.disabled = false;
    button.innerHTML = original;

    if (error) {
      console.error(error);
      alert("Sorry, your message could not be sent. Please try again.");
      return;
    }

    form.reset();
    alert("Thank you! Your message has been sent.");
  });
});
