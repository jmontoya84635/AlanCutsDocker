let csrftoken;
console.log("js loaded");
document.addEventListener("DOMContentLoaded", () => {
    csrftoken = Cookies.get("csrftoken");
    const contentSection = document.querySelector("#content-section");
    const appointmentSection = document.querySelector("#appointments");
    const messagesSection = document.querySelector("#messages");
    const frontPageSection = document.querySelector("#front-page");
    const userSection = document.querySelector("#users");
    const navList = document.querySelector("#appointment-navbar");
    const linkObjectList = [appointmentSection, messagesSection, frontPageSection, userSection];
    const innerHtmlList = ["Active Appointments", "Messages", "Front Page", "Users"];
    navList.childNodes.forEach((element) => {
        element.addEventListener("click", () => {
            setActiveNavBar(element.childNodes[1], navList, linkObjectList, innerHtmlList, contentSection);
            adjustHeight(contentSection);
        });
    });
    const storedTab = localStorage.getItem("active");
    if (storedTab) {
        setActiveNavBar(document.querySelector(`#${storedTab}`), navList, linkObjectList, innerHtmlList, contentSection);
    } else {
        setActiveNavBar(document.querySelector("#appointment-link"), navList, linkObjectList, innerHtmlList, contentSection);
    }
    adjustHeight(contentSection);

    document.querySelectorAll(".delete-message").forEach((element) => {
        element.addEventListener("click", () => {
            deleteMessage(element);
        });
    });

    const createImageForm = document.querySelector("#create-picture");
    createImageForm.addEventListener("submit", (event) => {
        event.preventDefault();
        uploadImage(createImageForm);
    });

    document.querySelectorAll(".delete-picture").forEach((element) => {
        element.addEventListener("click", () => {
            deletePicture(element.parentNode.parentNode.parentElement);
        });
    });

    document.querySelectorAll(".move-picture-up").forEach((element) => {
        element.addEventListener("click", () => {
            moveElement(element.parentNode.parentNode.parentElement, "UP");
        });
    });
    document.querySelectorAll(".move-picture-down").forEach((element) => {
        element.addEventListener("click", () => {
            moveElement(element.parentNode.parentNode.parentElement, "DOWN");
        });
    });
});

function adjustHeight(content) {
    content.style.height = "auto";
    if (content.offsetHeight < visualViewport.height) {
        content.style.height = (visualViewport.height - 1) + "px";
    }
}

function setActiveNavBar(navLink, navBar, linkObjectList, linkInnerHtmlList, content) {
    localStorage.setItem("active", navLink.id);
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
    for (let i = 0; i < linkInnerHtmlList.length; i++) {
        if (linkInnerHtmlList[i] === navLink.innerHTML) {
            linkObjectList[i].style.display = "block";
        } else {
            linkObjectList[i].style.display = "none";
        }
    }
    adjustHeight(content);
}

function deleteMessage(element) {
    fetch("/delmessage", {
        method: "POST", body: JSON.stringify({
            "id": element.value,
        }), headers: {
            "X-CSRFToken": csrftoken,
        },
    }).then(response => response.json())
        .then(result => {
            console.log(result);
            element.parentNode.parentElement.style.display = "none";
        });
}

function uploadImage(form) {
    console.log("start upload func");
    const formData = new FormData(form);
    let amount = 0;
    const pictureDiv = document.querySelector("#picture-div");
    pictureDiv.childNodes.forEach((element) => {
        if (element.tagName === "DIV") {
            amount++;
        }
    });
    amount++;
    formData.append("order", amount);
    fetch("/upload", {
        method: "POST", body: formData, headers: {
            "X-CSRFToken": csrftoken,
        },
    })
        .then(response => response.json())
        .then(result => {
            console.log("finished upload func");
            console.log(result);
            location.reload();
        });
}

function moveElement(card, direction) {
    if (direction === "UP") {
        const upper = card.previousElementSibling;
        if (upper === null) return;
    }
    if (direction === "DOWN") {
        const lower = card.nextElementSibling;
        if (lower === null) return;
    }
    fetch("/move", {
        method: "POST", body: JSON.stringify({
            "direction": direction, "id": card.id,
        }), headers: {
            "X-CSRFToken": csrftoken,
        },
    }).then(response => response.json())
        .then(result => {
            console.log(result);
            if (direction === "UP") {
                const upper = card.previousElementSibling;
                if (upper === null) return;
                upper.insertAdjacentElement("beforebegin", card);
            }
            if (direction === "DOWN") {
                const lower = card.nextElementSibling;
                if (lower === null) return;
                lower.insertAdjacentElement("afterend", card);
            }
        });
}

function deletePicture(card) {
    fetch("deletepicture", {
        method: "POST", body: JSON.stringify({"id": card.id}), headers: {"X-CSRFToken": csrftoken},
    })
        .then(response => response.json())
        .then(result => {
            console.log(result);
            card.style.display = "none";
        });
}