document.addEventListener('DOMContentLoaded', () => {
  const questions = document.querySelector("#questions");
  const addFormLink = document.querySelector("#add_form_link");
  const addQuestionOverlay = document.querySelector("main .overlay");
  const cancelAddQuestion = document.querySelector(".add_question button.cancel");
  const submitSurveyForm = document.querySelector(".submit_survey");

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

  submitSurveyForm && submitSurveyForm.addEventListener("submit", event => {
    event.preventDefault();
    event.stopPropagation();

    submitSurveyForm.querySelectorAll("dd").forEach(dd => {
      let dt = dd.previousElementSibling;
      let label = dt.querySelector("label");
      let requiredMessage = dt.querySelector(".required");
      let input = dd.querySelector("input, textarea");

      if (input.tagName === "INPUT") {
        if ([...dd.querySelectorAll("input")].every(input => input.checked === false)) {
          requiredMessage || label.insertAdjacentHTML("afterend", "<span class='required'>*required</span>");
        } else {
          requiredMessage && requiredMessage.remove();
        }
      } else if (input.tagName === "TEXTAREA") {
        if (input.value.trim() === "") {
          requiredMessage || label.insertAdjacentHTML("afterend", "<span class='required'>*required</span>");
        } else {
          requiredMessage && requiredMessage.remove();
        }
      }
    });

    if (submitSurveyForm.querySelector(".required")) {
      if (document.querySelector("body header ul li.error")) return;

      let ul = document.createElement("ul");
      let li = document.createElement("li");
      li.classList.add("error");
      li.textContent = "Please answer all of the questions.";
      ul.append(li);
      document.querySelector("body header").append(ul);
    } else {
      submitSurveyForm.submit();
    }
  });
});
