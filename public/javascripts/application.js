document.addEventListener('DOMContentLoaded', () => {
  const questions = document.querySelector("#questions");
  const addFormLink = document.querySelector("#add_form_link");
  const addQuestionOverlay = document.querySelector("main .overlay");
  const cancelAddQuestion = document.querySelector(".add_question button.cancel");

  document.querySelectorAll("form.delete, form.unpublish").forEach(form => {
    form.addEventListener("submit", event => {
      event.preventDefault();
      event.stopPropagation();

      let element = event.target;
      let message;
      if (element.classList.contains("delete")) {
        message = "Are you sure? This cannot be undone!";
      } else if (element.classList.contains("unpublish")) {
        message = "Are you sure? All of the answers will be lost!";
      }

      if (confirm(message)) {
        element.submit();
      }
    });
  });

  questions && questions.addEventListener("click", event => {
    let target = event.target;
    let li = target.closest("li");

    if (target.closest(".edit_form_link")) {
      event.preventDefault();
      li.querySelector(".edit_question").style.display = "block";
      li.querySelector(".overlay").style.display = "block";
      li.querySelector("form select").focus();
    } else if (target.classList.contains("cancel")) {
      li.querySelector(".edit_question").style.display = "none";
      li.querySelector(".edit_question").nextElementSibling.style.display = "none";
    } else if (target.classList.contains("overlay")) {
      li.querySelector(".edit_question").style.display = "none";
      target.style.display = "none";
    }
  });

  addFormLink && addFormLink.addEventListener("click", event => {
    event.preventDefault();

    let targetParent = event.target.parentElement;
    targetParent.querySelector(".add_question").style.display = "block";
    targetParent.querySelector(".overlay").style.display = "block";

    targetParent.querySelector(".add_question form select").focus();
  });

  addQuestionOverlay && addQuestionOverlay.addEventListener("click", event => {
    let target = event.target;

    document.querySelector(".add_question").style.display = "none";
    target.style.display = "none";
  });

  cancelAddQuestion && cancelAddQuestion.addEventListener("click", event => {
    document.querySelector(".add_question").style.display = "none";
    document.querySelector("main .overlay").style.display = "none";
  });
});
