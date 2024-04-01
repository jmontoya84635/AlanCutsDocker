let csrftoken;
document.addEventListener("DOMContentLoaded", () => {
    csrftoken = Cookies.get("csrftoken");
    let contentSection = document.querySelector("#content-section");
    let activeList = document.querySelector("#active-list-div");
    let allList = document.querySelector("#all-list-div");
    let canceledList = document.querySelector("#cancelled-list-div");
    let pastList = document.querySelector("#past-list-div");
    let appointmentNav = document.querySelector("#appointment-navbar");
    appointmentNav.childNodes.forEach((element) => {
        element.addEventListener("click", () => {
            setActiveNavBar(element.childNodes[1], appointmentNav, activeList, allList, canceledList, pastList);
            adjustHeight(contentSection);
        });
    });
    adjustHeight(contentSection);

    document.querySelectorAll(".edit-appointment").forEach((element) => {
        element.addEventListener("click", (event) => {
            event.preventDefault();
            editAppointment(element, element.parentNode.previousSibling.previousSibling);
        });
    });

    document.querySelectorAll(".cancel-appointment").forEach((element) => {
        element.addEventListener("click", (event) => {
            event.preventDefault();
            document.querySelector("#appointment-id").value = element.previousElementSibling.value;
        });
    });

    document.querySelector("#modal-submit").addEventListener("click", cancelAppointment);
});

function editAppointment(button, text) {
    const originalEditButton = button;
    const originalIdHint = button.nextElementSibling;
    const originalCancelButton = button.nextElementSibling.nextElementSibling;
    const originalText = text;
    const cancelButton = document.createElement("button");
    cancelButton.className = "btn btn-secondary shadow flex-fill";
    cancelButton.innerHTML = "Cancel Edit";
    cancelButton.addEventListener("click", () => {
        replacement.replaceWith(originalText);
        cancelButton.parentNode.replaceChildren(originalEditButton, originalIdHint, originalCancelButton);
    });
    const submitButton = document.createElement("button");
    submitButton.className = "btn btn-primary shadow flex-fill me-1";
    submitButton.innerHTML = "Save";
    submitButton.addEventListener("click", () => {
        cancelButton.parentNode.replaceChildren(originalEditButton, originalIdHint, originalCancelButton);
        fetch("/edit", {
            method: "POST", body: JSON.stringify({
                "action": "edit", "reason": replacement.value, "id": originalIdHint.value,
            }), headers: {
                "X-CSRFToken": csrftoken,
            },
        }).then(response => response.json())
            .then(result => {
                console.log(`edit: ${result}`);
                originalText.innerHTML = replacement.value;
                replacement.replaceWith(originalText);
            });
    });
    button.parentNode.replaceChildren(submitButton, cancelButton);
    console.log(text);
    let replacement = document.createElement("textarea");
    replacement.className = "form-control mb-3";
    replacement.innerHTML = originalText.innerHTML;
    replacement.oninput = () => {
        replacement.style.height = "";
        replacement.style.height = Math.min(replacement.scrollHeight, 250) + "px";
    };
    text.replaceWith(replacement);
    replacement.style.height = replacement.scrollHeight + "px";
}

function cancelAppointment() {
    const id = document.querySelector("#appointment-id").value;
    fetch("/edit", {
        method: "POST", body: JSON.stringify({
            "id": id, "action": "cancel", "reason": document.querySelector("#floatingTextarea").value,
        }), headers: {
            "X-CSRFToken": csrftoken,
        },
    })
        .then(response => response.json())
        .then(result => {
            console.log(result);
            location.reload();
        });
}

function adjustHeight(content) {
    content.style.height = "auto";
    if (content.offsetHeight < visualViewport.height) {
        content.style.height = (visualViewport.height - 1) + "px";
    }
}

function setActiveNavBar(navLink, navBar, activeList, allList, cancelledList, pastList) {
    navBar.childNodes.forEach((li) => {
        li.childNodes.forEach((a) => {
            if (a.className != null) {
                if (a.innerHTML === navLink.innerHTML) {
                    a.className = "nav-link active";
                } else {
                    a.className = "nav-link";
                }
            }
        });
    });
    allList.style.display = "none";
    allList.classList.add("my-auto");
    activeList.style.display = "none";
    cancelledList.style.display = "none";
    pastList.style.display = "none";
    if (navLink.innerHTML === "Active") {
        activeList.style.display = "block";
    } else if (navLink.innerHTML === "All") {
        allList.style.display = "block";
    } else if (navLink.innerHTML === "Cancelled") {
        cancelledList.style.display = "block";
    } else if (navLink.innerHTML === "Past") {
        pastList.style.display = "block";
    }
}