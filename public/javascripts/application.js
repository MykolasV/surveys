document.addEventListener('DOMContentLoaded', () => {
  const surveysFilter = document.querySelector("#surveys_filter select");
  const questions = document.querySelector("#questions");
  const addFormLink = document.querySelector("#add_form_link");
  const addQuestionForm = document.querySelector(".add_question form");
  const addQuestionOverlay = document.querySelector("main .overlay");
  const cancelAddQuestion = document.querySelector(".add_question button.cancel");
  const submitSurveyForm = document.querySelector(".submit_survey");

  // Confirmation dialogs
  document.querySelectorAll("form.delete, form.unpublish").forEach(form => {
    form.addEventListener("submit", event => {
      event.preventDefault();
      event.stopPropagation();

      let message;
      if (form.classList.contains("delete")) {
        message = "Are you sure you want to delete this? It cannot be undone!";
      } else if (form.classList.contains("unpublish")) {
        message = "Are you sure? All of the answers will be lost!";
      }

      let main = document.querySelector("main");

      let modal = document.createElement("div");
      modal.classList.add("confirm_modal");
      let p = document.createElement("p");
      p.textContent = message;
      modal.append(p);

      let yesButton = document.createElement("button");
      yesButton.textContent = "Yes";
      let noButton = document.createElement("button");
      noButton.textContent = "No";

      let buttons = document.createElement("div");
      buttons.append(yesButton, noButton);
      modal.append(buttons);

      let overlay = document.createElement("div");
      overlay.classList.add("overlay");

      main.insertAdjacentElement("afterbegin", modal);
      modal.insertAdjacentElement("afterend", overlay);
      modal.style.display = "block";
      overlay.style.display = "block";

      yesButton.addEventListener("click", event => {
        event.preventDefault();

        if (form.classList.contains("delete")) {
          let request = new XMLHttpRequest();
          request.open(form.method, form.action);
          request.setRequestHeader("X-Requested-With", "XMLHttpRequest");
  
          request.addEventListener("load", event => {
            if (request.status === 204) {
              overlay.remove();
              modal.remove();
              form.closest("li").remove();
  
              let flashMessages = document.querySelectorAll(".flash");
              if (flashMessages.length > 0) {
                flashMessages[0].parentElement.remove();
              }
  
              let ul = document.createElement("ul");
              let li = document.createElement("li");
              li.textContent = "The question was deleted."
              li.classList.add("flash", "success");
              ul.append(li);
              document.querySelector("body > header h1").after(ul);

              if (questions.children.length === 0) {
                let p = document.createElement("p");
                p.id = "no_list";
                p.textContent = "There are no quesitons in this survey.";
                questions.after(p);

                let img = document.createElement("img");
                img.src = "/images/up-arrow.png";
                p.after(img);
                p.closest("main").style.background = "none"
              }
            } else if (request.status === 200) {
              document.location = request.responseText;
            }
          });
  
          request.send();
        } else {
          form.submit();
        }
      });

      [noButton, overlay].forEach(el => {
        el.addEventListener("click", event => {
          event.preventDefault();

          overlay.remove();
          modal.remove();
        });
      });
    });
  });

  // Filter surveys according to selection
  surveysFilter && surveysFilter.addEventListener("change", event => {
    let message = document.querySelector("#surveys_filter + p");
    if (message) message.remove();

    let selected = [...surveysFilter.children].find(option => option.selected).value;
    let surveys = [...document.querySelector("#surveys_list").children];

    if (selected === "all") {
      surveys.forEach(survey => survey.style.display = "inline-block");
    } else {
      surveys.forEach(survey => {
        if (survey.classList.contains(selected)) {
          survey.style.display = "inline-block";
        } else {
          survey.style.display = "none";
        }
      });
    }

    let filtered = surveys.filter(survey => survey.classList.contains(selected) || selected === "all");
    if (filtered.every(survey => survey.style.display === "none")) {
      let p = document.createElement("p");
      p.textContent = "There are no surveys in this category.";
      document.querySelector("#surveys_filter").insertAdjacentElement("afterend", p);
    }
  });

  // Show or hide the form for updating a question
  questions && questions.addEventListener("click", event => {
    let target = event.target;
    let li = target.closest("li");

    let editQuestion = li.querySelector(".edit_question");

    if (target.closest(".edit_form_link")) {
      event.preventDefault();
      editQuestion.style.display = "block";
      li.querySelector(".overlay").style.display = "block";
    } else if (target.classList.contains("cancel")) {
      editQuestion.style.display = "none";
      editQuestion.nextElementSibling.style.display = "none";
      editQuestion.querySelector("form").reset();

      let errors = editQuestion.querySelector("#errors");
      if (errors) errors.remove();
  
      editQuestion.querySelectorAll("form .invalid").forEach(el => el.classList.remove("invalid"));
    } else if (target.classList.contains("overlay")) {
      editQuestion.style.display = "none";
      target.style.display = "none";
      editQuestion.querySelector("form").reset();

      let errors = editQuestion.querySelector("#errors");
      if (errors) errors.remove();
  
      editQuestion.querySelectorAll("form .invalid").forEach(el => el.classList.remove("invalid"));
    }
  });

  // Show the form for creating a question
  addFormLink && addFormLink.addEventListener("click", event => {
    event.preventDefault();

    let targetParent = event.target.parentElement;
    targetParent.querySelector(".add_question").style.display = "block";
    targetParent.querySelector(".overlay").style.display = "block";
  });

  // Hide the form for creating a question
  addQuestionOverlay && addQuestionOverlay.addEventListener("click", event => {
    let target = event.target;

    document.querySelector(".add_question").style.display = "none";
    target.style.display = "none";
    document.querySelector(".add_question form").reset();

    let errors = addQuestionForm.querySelector("#errors");
    if (errors) errors.remove();

    addQuestionForm.querySelectorAll(".invalid").forEach(el => el.classList.remove("invalid"));
  });

  cancelAddQuestion && cancelAddQuestion.addEventListener("click", event => {
    document.querySelector(".add_question").style.display = "none";
    document.querySelector("main .overlay").style.display = "none";
    document.querySelector(".add_question form").reset();

    let errors = addQuestionForm.querySelector("#errors");
    if (errors) errors.remove();

    addQuestionForm.querySelectorAll(".invalid").forEach(el => el.classList.remove("invalid"));
  });

  // Validate the forms for creating and updating a question before submission
  [...document.querySelectorAll(".edit_question form"), addQuestionForm].forEach(form => {
    if (!form) return;

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
        if (form.parentElement.classList.contains("edit_question")) {
          function formValues(form) {
            let keysAndValues = [];
  
            for (let index = 0; index < form.elements.length; index += 1) {
              let element = form.elements[index];
              let key;
              let value;
          
              if (element.type !== 'submit') {
                key = encodeURIComponent(element.name);
                value = encodeURIComponent(element.value);
                keysAndValues.push(`${key}=${value}`);
              }
            }
          
            return keysAndValues.join('&');
          }
  
          let data = formValues(form);
  
          let request = new XMLHttpRequest();
          request.open(form.method, form.action);
          request.setRequestHeader("X-Requested-With", "XMLHttpRequest");
          request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  
          request.addEventListener("load", event => {
            if (request.status === 204) {
              form.querySelector(`select option[value=${selectedType}]`).selected = true;
              form.querySelector("input#questionText").value = question;

              let optionsInput = form.querySelector("input#options");
              if (selectedType === "open") {
                optionsInput.value = "";
              } else {
                optionsInput.value = options.join(", ");
              }

              form.parentElement.nextElementSibling.style.display = "none";
              form.parentElement.style.display = "none";
  
              let flashMessages = document.querySelectorAll(".flash");
              if (flashMessages.length > 0) {
                flashMessages[0].parentElement.remove();
              }
  
              let ul = document.createElement("ul");
              let li = document.createElement("li");
              li.textContent = "The question was updated."
              li.classList.add("flash", "success");
              ul.append(li);
              document.querySelector("body > header h1").after(ul);
            }
          });
  
          request.send(data);
        } else {
          form.submit()
        }
      }
    });
  });

  // Validate the survey form before submission
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

  // Work-around to get rid of the preset background
  let startSurvey = document.querySelector(".start_survey");
  (startSurvey) && (startSurvey.closest("main").style.background = "none");

  let endSurvey = document.querySelector("#thanks");
  (endSurvey) && (endSurvey.closest("main").style.background = "none");

  let noList = document.querySelector("#no_list");
  (noList) && (noList.closest("main").style.background = "none");
});
