document.addEventListener('DOMContentLoaded', () => {
  const questions = document.querySelector("#questions");

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

  questions.addEventListener("click", event => {
    event.preventDefault();

    let target = event.target;
    let li = target.closest("li");

    if (target.closest(".edit_form_link")) {
      li.querySelector(".edit_question").style.display = "block";
      li.querySelector(".overlay").style.display = "block";
    } else if (target.classList.contains("cancel")) {
      li.querySelector(".edit_question").style.display = "none";
      li.querySelector(".edit_question").nextElementSibling.style.display = "none";
    } else if (target.classList.contains("overlay")) {
      li.querySelector(".edit_question").style.display = "none";
      target.style.display = "none";
    }
  });

  document.querySelector("#add_form_link").addEventListener("click", event => {
    event.preventDefault();

    let targetParent = event.target.parentElement;
    targetParent.querySelector(".add_question").style.display = "block";
    targetParent.querySelector(".overlay").style.display = "block";
  });

  document.querySelector("main .overlay").addEventListener("click", event => {
    let target = event.target;

    document.querySelector(".add_question").style.display = "none";
    target.style.display = "none";
  });

  document.querySelector(".add_question button.cancel").addEventListener("click", event => {
    event.preventDefault();

    document.querySelector(".add_question").style.display = "none";
    document.querySelector("main .overlay").style.display = "none";
  });

  

  // let formContainer = document.querySelector(".add_question");
  // let formOverlay = document.querySelector("#overlay");

  // document.querySelectorAll("#add_form_link, .edit_form_link").forEach(element => {
  //   element.addEventListener("click", event => {
  //     event.preventDefault();
  

  //     formContainer.style.display = "block";
  //     formOverlay.style.display = "block";
  //   });
  // });

  // document.querySelectorAll("button.cancel, .overlay").forEach(element => {
  //   element.addEventListener("click", event => {
  //     console.log(event);
  //     event.preventDefault();
  //     event.stopPropagation();

  //     formContainer.style.display = "none";
  //     formOverlay.style.display = "none";
  //   });
  // });
});
