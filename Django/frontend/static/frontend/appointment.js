// noinspection JSValidateTypes
let isSuperUser;
let selectedList;
let currentDate;
let csrftoken;
let primary = "#3560e9";
let secondary = "#ffb06c";
document.addEventListener("DOMContentLoaded", () => {
    csrftoken = Cookies.get("csrftoken");
    selectedList = [];
    currentDate = new Date();
    const superUserField = document.querySelector("#isSuperUser");
    isSuperUser = superUserField != null;

    const tableBody = document.querySelector("#scheduler-body");
    fillTable(tableBody, currentDate, "");

    const backButton = document.querySelector("#previousWeek");
    backButton.addEventListener("click", event => {
        event.preventDefault();
        fillTable(tableBody, currentDate, "backward");
    });
    const nextButton = document.querySelector("#nextWeek");
    nextButton.addEventListener("click", event => {
        event.preventDefault();
        fillTable(tableBody, currentDate, "forward");
    });

    if (isSuperUser) {
        const createButton = document.querySelector("#submit-time-slots");
        createButton.addEventListener("click", (event) => {
            event.preventDefault();
            fetchNewSlots();
        });
        const cancelCreateButton = document.querySelector("#cancel-time-slots");
        cancelCreateButton.addEventListener("click", () => {
            location.reload();
        });
    }
});

function alert(message, tag) {
    window.scrollTo({top: 0, behavior: "smooth"});
    const alertDiv = document.createElement("div");
    alertDiv.classList.add("alert", `alert-${tag}`, "text-center");
    alertDiv.setAttribute("role", "alert");
    alertDiv.setAttribute("data-bs-auto-dismiss", "true");
    alertDiv.textContent = message;
    document.querySelector("#alerts").append((alertDiv));
}

function CalculateDates(direction, currentDate, dateRow, currWeekField) {
    let dateList = [];
    const dayOfWeek = currentDate.getDay();
    const start = new Date(currentDate);
    start.setDate(start.getDate() - dayOfWeek);
    if (direction === "forward") {
        currentDate.setDate(currentDate.getDate() + 7);
        start.setDate(start.getDate() + 7);
    } else if (direction === "backward") {
        currentDate.setDate(currentDate.getDate() - 7);
        start.setDate(start.getDate() - 7);
    }
    let loopDate = start;
    for (let i = 0; i < 7; i++) {
        dateList.push(new Date(loopDate));
        if (dateRow != null) {
            dateRow.children[i + 1].innerHTML = `${loopDate.getMonth() + 1}/${loopDate.getDate()}`;
        }
        loopDate.setDate(loopDate.getDate() + 1);
    }
    if (currWeekField != null) {
        currWeekField.innerHTML = `${dateList[0].getMonth() + 1}/${dateList[0].getDate()}/${dateList[0].getFullYear().toString().substring(2)} - ${dateList[6].getMonth() + 1}/${dateList[6].getDate()}/${dateList[6].getFullYear().toString().substring(2)}`;
    }
    return dateList;
}

function fetchNewSlots() {
    const dateList = CalculateDates("", currentDate, null, null);
    const start = dateList[0].toISOString().substring(0, 10);
    const end = dateList[6].toISOString().substring(0, 10);
    fetch(`/slot`, {
        method: "POST", body: JSON.stringify({
            "slot_list": selectedList, "start": start, "end": end,
        }), headers: {
            "X-CSRFToken": csrftoken,
        },
    })
        .then(response => response.json())
        .then(result => {
            alert(result["message"], result["tag"]);
        });
}


function fillTable(tableBody, currentDate, direction) {
    tableBody.textContent = "";
    window.scrollTo({top: 0, behavior: "smooth"});
    const dateRow = document.querySelector("#dateRow");
    const currWeekField = document.querySelector("#currWeek");
    let dateList = CalculateDates(direction, currentDate, dateRow, currWeekField);
    // noinspection JSMismatchedCollectionQueryUpdate
    let appointmentList = [];
    // noinspection JSMismatchedCollectionQueryUpdate
    let timeSlotList = [];
    let dayList = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    let times24 = ["07:00:00", "08:00:00", "09:00:00", "10:00:00", "11:00:00", "12:00:00", "13:00:00", "14:00:00", "15:00:00", "16:00:00", "17:00:00", "18:00:00", "19:00:00", "20:00:00", "21:00:00", "22:00:00"];
    let times12 = ["7 AM", "8 AM", "9 AM", "10 AM", "11 AM", "12 AM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM", "6 PM", "7 PM", "8 PM", "9 PM", "10 PM"];
    fetch(`/schedule?start=${dateList[0].toISOString().substring(0, 10)}&end=${dateList[6].toISOString().substring(0, 10)}&expiry=yes`)
        .then(response => response.json())
        .then(result => {
            for (let i = 0; i < result["appointments"].length; i++) {
                appointmentList.push(result["appointments"][i]);
            }
            for (let i = 0; i < result["time slots"].length; i++) {
                timeSlotList.push(result["time slots"][i]);
            }
            for (let i = 0; i < times12.length; i++) {
                let tableRow = document.createElement("tr");
                for (let j = 0; j < dayList.length + 1; j++) {
                    let tableHeader = document.createElement("th");
                    tableHeader.className = "text-center";
                    if (j === 0) {
                        tableHeader.className = "text-muted text-center time-font";
                        tableHeader.innerHTML = times12[i];
                    } else {
                        let isEvent = false;
                        for (let k = 0; k < appointmentList.length; k++) {
                            if ((dateList[j - 1].toISOString().substring(0, 10) === appointmentList[k]["date"]) && (times24[i] === appointmentList[k]["time"]) && !(appointmentList[k]["expired"])) {
                                tableHeader.style.background = secondary;
                                isEvent = true;
                                break;
                            }
                        }
                        for (let k = 0; k < timeSlotList.length; k++) {
                            if (((dateList[j - 1]).toISOString().substring(0, 10) === timeSlotList[k]["date"]) && (times24[i] === timeSlotList[k]["time"]) && !(timeSlotList[k]["expired"])) {
                                tableHeader.style.background = primary;
                                selectedList.push(`${dateList[j - 1].toISOString().substring(0, 10)}, ${times24[i]}`);
                                if (isSuperUser) {
                                    tableHeader.addEventListener("click", () => {
                                        let value = `${dateList[j - 1].toISOString().substring(0, 10)}, ${times24[i]}`;
                                        if (tableHeader.style.background === "white") {
                                            selectedList.push(value);
                                            tableHeader.style.background = primary;
                                        } else {
                                            let index = selectedList.indexOf(value);
                                            if (index > -1) {
                                                selectedList.splice(index, 1);
                                            }
                                            tableHeader.style.background = "white";
                                        }
                                    });
                                } else {
                                    tableHeader.setAttribute("data-bs-toggle", "modal");
                                    tableHeader.setAttribute("data-bs-target", "#staticBackdrop");
                                    tableHeader.addEventListener("click", () => {
                                        let dateInput = document.querySelector("#date");
                                        let timeInput = document.querySelector("#time");
                                        dateInput.value = dateList[j - 1].toISOString().substring(0, 10);
                                        timeInput.value = times24[i];
                                    });
                                }
                                isEvent = true;
                                break;
                            }
                        }
                        if (!isEvent) {
                            tableHeader.style.background = "white";
                            if (isSuperUser) {
                                tableHeader.addEventListener("click", () => {
                                    let value = `${dateList[j - 1].toISOString().substring(0, 10)}, ${times24[i]}`;
                                    if (tableHeader.style.background === "white") {
                                        selectedList.push(value);
                                        tableHeader.style.background = primary;
                                    } else {
                                        let index = selectedList.indexOf(value);
                                        if (index > -1) {
                                            selectedList.splice(index, 1);
                                        }
                                        tableHeader.style.background = "white";
                                    }
                                });
                            }
                        }
                    }
                    tableRow.append(tableHeader);
                }
                tableBody.append(tableRow);
            }
        });
}