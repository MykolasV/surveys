document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll("form.delete, form.unpublish").forEach(form => {
    form.addEventListener("submit", event => {
      event.preventDefault();
      event.stopPropagation();

      let element = event.target;
      let message;
      if (element.classList.contains("delete")) {
        message = "Are you sure? This cannot be undone!";
      } else if (element.classList.contains("unpublish")) {
        message = "Are you sure? All survey data will be lost!";
      }

      if (confirm(message)) {
        element.submit();
      }
    });
  });

  let hiddenFormLink = document.querySelector("#form_link");
  let formContainer = document.querySelector(".add_question");
  let formOverlay = document.querySelector("#overlay");

  hiddenFormLink.addEventListener("click", event => {
    event.preventDefault();

    formContainer.style.display = "block";
    formOverlay.style.display = "block";
  });

  document.querySelectorAll("button.cancel, #overlay").forEach(element => {
    element.addEventListener("click", event => {
      console.log(event);
      event.preventDefault();
      event.stopPropagation();

      formContainer.style.display = "none";
      formOverlay.style.display = "none";
    });
  });
});
