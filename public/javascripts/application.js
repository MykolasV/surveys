document.addEventListener('DOMContentLoaded', () => {
  const questions = document.querySelector("#questions");
  const addFormLink = document.querySelector("#add_form_link");
  const addQuestionForm = document.querySelector(".add_question form");
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

      let errors = li.querySelector(".edit_question #errors");
      if (errors) errors.remove();
  
      li.querySelectorAll(".edit_question form .invalid").forEach(el => el.classList.remove("invalid"));
    } else if (target.classList.contains("overlay")) {
      li.querySelector(".edit_question").style.display = "none";
      target.style.display = "none";

      let errors = li.querySelector(".edit_question #errors");
      if (errors) errors.remove();
  
      li.querySelectorAll(".edit_question form .invalid").forEach(el => el.classList.remove("invalid"));
    }
  });

  questions && [...questions.querySelectorAll(".edit_question form")].forEach(form => {
    form.addEventListener("submit", event => {
      event.preventDefault();

      let errors = form.querySelector("#errors");
      if (errors) errors.remove();

      form.querySelectorAll(".invalid").forEach(el => el.classList.remove("invalid"));

      let selectedType = [...form.querySelector("select").children].find(option => option.selected).value;
      let question = form.querySelector("#questionText").value.trim();
      let options = form.querySelector("#options").value.split(/, +|,/)
                                                            .map(str => str.trim())
                                                            .filter(str => str.length > 0);

      let ul = document.createElement("ul");
      ul.id = "errors";

      if (question.length <= 0) {
        let li = document.createElement("li");
        li.classList.add("flash", "error");
        li.textContent = "The question field is required.";
        ul.append(li);

        form.querySelector("#questionText").classList.add("invalid");
      }

      if (["closed", "nominal"].includes(selectedType) && options.length === 0) {
        let li = document.createElement("li");
        li.classList.add("flash", "error");
        li.textContent = "Please provide options in the correct format.";
        ul.append(li);

        form.querySelector("#options").classList.add("invalid");
      }

      if (ul.children.length > 0) {
        form.insertAdjacentElement("afterbegin", ul);
      } else {
        form.submit();
      }
    });
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

    let errors = addQuestionForm.querySelector("#errors");
    if (errors) errors.remove();

    addQuestionForm.querySelectorAll(".invalid").forEach(el => el.classList.remove("invalid"));
  });

  cancelAddQuestion && cancelAddQuestion.addEventListener("click", event => {
    document.querySelector(".add_question").style.display = "none";
    document.querySelector("main .overlay").style.display = "none";

    let errors = addQuestionForm.querySelector("#errors");
    if (errors) errors.remove();

    addQuestionForm.querySelectorAll(".invalid").forEach(el => el.classList.remove("invalid"));
  });

  addQuestionForm && addQuestionForm.addEventListener("submit", event => {
    event.preventDefault();

    let errors = addQuestionForm.querySelector("#errors");
    if (errors) errors.remove();

    addQuestionForm.querySelectorAll(".invalid").forEach(el => el.classList.remove("invalid"));

    let selectedType = [...addQuestionForm.querySelector("select").children].find(option => option.selected).value;
    let question = addQuestionForm.querySelector("#questionText").value.trim();
    let options = addQuestionForm.querySelector("#options").value.split(/, +|,/)
                                                           .map(str => str.trim())
                                                           .filter(str => str.length > 0);

    let ul = document.createElement("ul");
    ul.id = "errors";

    if (question.length <= 0) {
      let li = document.createElement("li");
      li.classList.add("flash", "error");
      li.textContent = "The question field is required.";
      ul.append(li);

      addQuestionForm.querySelector("#questionText").classList.add("invalid");
    }

    if (["closed", "nominal"].includes(selectedType) && options.length === 0) {
      let li = document.createElement("li");
      li.classList.add("flash", "error");
      li.textContent = "Please provide options in the correct format.";
      ul.append(li);

      addQuestionForm.querySelector("#options").classList.add("invalid");
    }

    if (ul.children.length > 0) {
      addQuestionForm.insertAdjacentElement("afterbegin", ul);
    } else {
      addQuestionForm.submit();
    }
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
      li.textContent = "You must answer all of the required questions.";
      ul.append(li);
      document.querySelector("body header").append(ul);
    } else {
      submitSurveyForm.submit();
    }
  });
});
